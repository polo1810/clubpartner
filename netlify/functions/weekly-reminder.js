// Netlify Scheduled Function — Relance hebdo par email chaque lundi 8h
import { createClient } from '@supabase/supabase-js';

export default async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // service role = bypass RLS
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.REMINDER_FROM_EMAIL || 'ClubPartner <noreply@clubpartner.fr>';

  if (!supabaseUrl || !supabaseKey || !resendKey) {
    console.error('Variables manquantes : VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY ou RESEND_API_KEY');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // --- 1. Récupérer tous les clubs (pour memberEmails) ---
  const { data: clubs } = await supabase.from('clubs').select('id, data');
  if (!clubs?.length) return console.log('Aucun club trouvé');

  // --- Dates de la semaine ---
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d) => d.toISOString().slice(0, 10);
  const mondayStr = fmt(monday);
  const sundayStr = fmt(sunday);
  const todayStr = fmt(today);

  for (const club of clubs) {
    const memberEmails = club.data?.memberEmails || {};
    if (!Object.keys(memberEmails).length) continue;

    // --- 2. Récupérer les entreprises, contrats, factures du club ---
    const [companiesRes, contractsRes, invoicesRes] = await Promise.all([
      supabase.from('companies').select('id, data').eq('club_id', club.id),
      supabase.from('contracts').select('id, data').eq('club_id', club.id),
      supabase.from('invoices').select('id, data').eq('club_id', club.id),
    ]);

    // --- 3. Extraire toutes les actions ---
    const actions = [];

    (companiesRes.data || []).forEach(row => {
      const c = row.data;
      (c.actions || []).forEach(a => actions.push({ ...a, company: c.company }));
    });
    (contractsRes.data || []).forEach(row => {
      const c = row.data;
      const co = companiesRes.data?.find(x => x.data?.id === c.companyId);
      (c.actions || []).forEach(a => actions.push({ ...a, company: co?.data?.company || '?' }));
    });
    (invoicesRes.data || []).forEach(row => {
      const inv = row.data;
      (inv.actions || []).forEach(a => actions.push({ ...a, company: inv.companyName || '?' }));
    });

    // --- 4. Pour chaque membre, filtrer ses tâches ---
    for (const [name, email] of Object.entries(memberEmails)) {
      if (!email) continue;

      const myActions = actions.filter(a => a.assignee === name && !a.done && !a.archived);
      const overdue = myActions.filter(a => a.date && a.date < todayStr);
      const thisWeek = myActions.filter(a => a.date && a.date >= mondayStr && a.date <= sundayStr);

      if (!overdue.length && !thisWeek.length) continue;

      // --- 5. Construire l'email HTML ---
      const html = buildEmail(name, overdue, thisWeek, club.data?.clubInfo?.name || 'ClubPartner');

      // --- 6. Envoyer via Resend ---
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: fromEmail,
            to: email,
            subject: `📋 ${overdue.length ? `${overdue.length} en retard · ` : ''}Tes tâches de la semaine`,
            html,
          }),
        });
        if (!res.ok) console.error(`Erreur envoi à ${email}:`, await res.text());
        else console.log(`✅ Email envoyé à ${name} (${email})`);
      } catch (err) {
        console.error(`Erreur envoi à ${email}:`, err);
      }
    }
  }
};

// --- Config du cron Netlify ---
export const config = { schedule: "0 8 * * 1" }; // Chaque lundi à 8h UTC

// --- Template email ---
function buildEmail(name, overdue, thisWeek, clubName) {
  const actionRow = (a) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">${a.company}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">${a.type || '-'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">${a.category || '-'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">${a.date || '-'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12px;color:#666">${a.note || ''}</td>
    </tr>`;

  const table = (rows) => `
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr style="background:#f5f5f5">
        <th style="padding:8px 12px;text-align:left">Entreprise</th>
        <th style="padding:8px 12px;text-align:left">Action</th>
        <th style="padding:8px 12px;text-align:left">Catégorie</th>
        <th style="padding:8px 12px;text-align:left">Date</th>
        <th style="padding:8px 12px;text-align:left">Note</th>
      </tr>
      ${rows.map(actionRow).join('')}
    </table>`;

  let body = `
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:20px">
      <h2 style="color:#1a1a1a">👋 Salut ${name},</h2>
      <p style="color:#555">Voici ton récap hebdo pour <strong>${clubName}</strong>.</p>`;

  if (overdue.length) {
    body += `
      <h3 style="color:#dc2626;margin-top:24px">🔴 En retard (${overdue.length})</h3>
      ${table(overdue)}`;
  }

  if (thisWeek.length) {
    body += `
      <h3 style="color:#2563eb;margin-top:24px">📅 Cette semaine (${thisWeek.length})</h3>
      ${table(thisWeek)}`;
  }

  body += `
      <p style="margin-top:24px;color:#999;font-size:12px">— Envoyé automatiquement par ClubPartner</p>
    </div>`;

  return body;
}
