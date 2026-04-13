import { useState, useEffect } from 'react';
import { useAuth } from '../data/AuthContext';
import { supabase } from '../data/supabase';
import { S, Cl } from '../data/styles';
import { Badge, Modal, Field } from '../components/index';

// Helper : calcul des jours restants
const daysLeft = (endDate) => {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
};

// Helper : badge de statut
const StatusBadge = ({ status, trialEnd }) => {
  if (status === 'active') return <span style={{ ...S.badge(Cl.ok, Cl.okL), fontSize: 11 }}>✅ Actif</span>;
  if (status === 'blocked') return <span style={{ ...S.badge(Cl.err, Cl.errL), fontSize: 11 }}>🚫 Bloqué</span>;
  const d = daysLeft(trialEnd);
  const urgent = d !== null && d <= 7;
  const c = urgent ? Cl.err : Cl.warn;
  const bg = urgent ? Cl.errL : Cl.warnL;
  return <span style={{ ...S.badge(c, bg), fontSize: 11 }}>🕐 Essai {d !== null ? `(${d}j)` : ''}</span>;
};

export default function AdminTab() {
  const { isSuperAdmin, member, globalConfig } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddClub, setShowAddClub] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newClub, setNewClub] = useState({ id: "", name: "", trialDays: 30 });
  const [newMember, setNewMember] = useState({ email: "", club_id: "", role: "commercial", name: "" });
  const [editClub, setEditClub] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  // ★ Config globale
  const [supportWhatsapp, setSupportWhatsapp] = useState(globalConfig?.supportWhatsapp || "");

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data: c } = await supabase.from('clubs').select('id, name, created_at, status, trial_end_date, blocked_reason');
    const { data: m } = await supabase.from('club_members').select('*');
    setClubs(c || []); setAllMembers(m || []); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ★ Sauvegarder le WhatsApp support dans app_config
  const saveWhatsapp = async (val) => {
    setSupportWhatsapp(val);
    await supabase.from('app_config').upsert({ key: 'supportWhatsapp', value: val });
  };

  const addClub = async () => {
    if (!newClub.id.trim() || !newClub.name.trim()) return;
    const trialDays = parseInt(newClub.trialDays) || 30;
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + trialDays);
    const { error } = await supabase.from('clubs').insert({
      id: newClub.id.trim().toLowerCase().replace(/\s/g, "-"),
      name: newClub.name.trim(),
      data: {},
      status: 'trial',
      trial_end_date: trialEnd.toISOString(),
    });
    if (error) { alert("Erreur : " + error.message); return; }
    setShowAddClub(false); setNewClub({ id: "", name: "", trialDays: 30 }); load();
  };

  const activateClub = async (clubId) => {
    await supabase.from('clubs').update({ status: 'active', blocked_reason: '' }).eq('id', clubId);
    load();
  };

  const blockClub = async (clubId) => {
    await supabase.from('clubs').update({ status: 'blocked', blocked_reason: 'Bloqué manuellement' }).eq('id', clubId);
    load();
  };

  const extendTrial = async (clubId, extraDays) => {
    const club = clubs.find(c => c.id === clubId);
    const base = club?.trial_end_date ? new Date(club.trial_end_date) : new Date();
    const start = base < new Date() ? new Date() : base;
    start.setDate(start.getDate() + (parseInt(extraDays) || 15));
    await supabase.from('clubs').update({ status: 'trial', trial_end_date: start.toISOString(), blocked_reason: '' }).eq('id', clubId);
    load();
  };

  const saveEditClub = async () => {
    if (!editClub || !editClub.newName.trim()) return;
    const newId = editClub.newId.trim().toLowerCase().replace(/\s/g, "-");
    if (newId !== editClub.id) {
      const oldClub = clubs.find(c => c.id === editClub.id);
      const { error: insErr } = await supabase.from('clubs').insert({ id: newId, name: editClub.newName.trim(), data: oldClub?.data || {} });
      if (insErr) { alert("Erreur : " + insErr.message); return; }
      await supabase.from('club_members').update({ club_id: newId }).eq('club_id', editClub.id);
      await supabase.from('clubs').delete().eq('id', editClub.id);
    } else {
      const { error } = await supabase.from('clubs').update({ name: editClub.newName.trim() }).eq('id', editClub.id);
      if (error) { alert("Erreur : " + error.message); return; }
    }
    setEditClub(null); load();
  };

  const doDelete = async () => {
    if (!confirmDel) return;
    if (confirmDel.type === "club") {
      await supabase.from('clubs').delete().eq('id', confirmDel.id);
    } else {
      await supabase.from('club_members').delete().eq('id', confirmDel.id);
    }
    setConfirmDel(null); load();
  };

  const addMember = async () => {
    if (!newMember.email.trim() || !newMember.club_id) return;
    const { error } = await supabase.from('club_members').insert({ email: newMember.email.trim().toLowerCase(), club_id: newMember.club_id, role: newMember.role, name: newMember.name.trim() });
    if (error) { alert("Erreur : " + error.message); return; }
    setShowAddMember(false); setNewMember({ email: "", club_id: "", role: "commercial", name: "" }); load();
  };

  const updateRole = async (id, role) => {
    await supabase.from('club_members').update({ role }).eq('id', id); load();
  };

  if (!isSuperAdmin) return <div style={S.empty}>Accès réservé au super-administrateur.</div>;

  const trialClubs = clubs.filter(c => c.status === 'trial');
  const activeClubs = clubs.filter(c => c.status === 'active');
  const blockedClubs = clubs.filter(c => c.status === 'blocked');
  const urgentClubs = trialClubs.filter(c => { const d = daysLeft(c.trial_end_date); return d !== null && d <= 7; });

  return (<>
    <div style={S.fx}>
      <h2 style={S.pageH}>Administration</h2>
      <div style={{ display: "flex", gap: 6 }}>
        <button style={S.btn("primary")} onClick={() => setShowAddClub(true)}>+ Club</button>
        <button style={S.btn("primary")} onClick={() => setShowAddMember(true)}>+ Membre</button>
      </div>
    </div>

    {!loading && <div style={{ ...S.g4, marginTop: 12 }}>
      <div style={S.statCard}><div style={S.statV()}>{clubs.length}</div><div style={S.statL}>Clubs</div></div>
      <div style={S.statCard}><div style={S.statV(Cl.warn)}>{trialClubs.length}</div><div style={S.statL}>En essai</div></div>
      <div style={S.statCard}><div style={S.statV(Cl.ok)}>{activeClubs.length}</div><div style={S.statL}>Actifs</div></div>
      <div style={S.statCard}><div style={S.statV(Cl.err)}>{blockedClubs.length}</div><div style={S.statL}>Bloqués</div></div>
    </div>}

    {/* ★ Config globale */}
    {!loading && <div style={{ ...S.card, marginTop: 12 }}>
      <div style={S.cT}>⚙️ Configuration globale</div>
      <div style={S.g2}>
        <Field label="WhatsApp support (aide)">
          <input style={S.inp} value={supportWhatsapp} onChange={e => saveWhatsapp(e.target.value)} placeholder="33612345678 (sans +, sans espaces)" />
          <div style={{ fontSize: 11, color: Cl.txtL, marginTop: 4 }}>Numéro WhatsApp de support commun à tous les clubs</div>
        </Field>
      </div>
    </div>}

    {urgentClubs.length > 0 && <div style={{ ...S.alert("danger"), marginTop: 12 }}>
      ⚠️ {urgentClubs.length} club{urgentClubs.length > 1 ? "s" : ""} en fin d'essai : {urgentClubs.map(c => c.name).join(", ")}
    </div>}

    {loading ? <p style={{ color: Cl.txtL }}>Chargement...</p> : <>
      <div style={{ ...S.cT, marginTop: 16 }}>🏟️ Clubs ({clubs.length})</div>
      {clubs.map(c => {
        const cm = allMembers.filter(m => m.club_id === c.id);
        const d = daysLeft(c.trial_end_date);
        const isExpired = c.status === 'trial' && d !== null && d <= 0;
        return (
          <div key={c.id} style={{ ...S.card, marginTop: 8, borderLeft: `3px solid ${c.status === 'active' ? Cl.ok : c.status === 'blocked' || isExpired ? Cl.err : Cl.warn}` }}>
            <div style={S.fx}>
              <div>
                <strong style={{ fontSize: 15 }}>{c.name}</strong>
                <span style={{ fontSize: 11, color: Cl.txtL, marginLeft: 8, fontFamily: "monospace" }}>{c.id}</span>
                <span style={{ marginLeft: 8 }}><StatusBadge status={isExpired ? 'blocked' : c.status} trialEnd={c.trial_end_date} /></span>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: Cl.txtL }}>{cm.length} membre{cm.length > 1 ? "s" : ""}</span>
                <button style={S.btnS("ghost")} onClick={() => setEditClub({ id: c.id, name: c.name, newId: c.id, newName: c.name })}>✏️</button>
                <button style={S.btnDelete} onClick={() => setConfirmDel({ type: "club", id: c.id, label: c.name })}>🗑️</button>
              </div>
            </div>

            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {c.trial_end_date && (
                <span style={{ fontSize: 11, color: Cl.txtL }}>
                  Fin essai : {new Date(c.trial_end_date).toLocaleDateString('fr-FR')}
                  {d !== null && d > 0 && ` (${d}j restants)`}
                  {d !== null && d <= 0 && ` (expiré)`}
                </span>
              )}
              {c.created_at && (
                <span style={{ fontSize: 11, color: Cl.txtL }}>· Créé le {new Date(c.created_at).toLocaleDateString('fr-FR')}</span>
              )}
            </div>

            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(c.status !== 'active') && (
                <button style={{ ...S.btn("success"), fontSize: 12, padding: "5px 12px" }} onClick={() => activateClub(c.id)}>✅ Activer</button>
              )}
              {(c.status !== 'blocked') && (
                <button style={{ ...S.btn("ghost"), fontSize: 12, padding: "5px 12px", color: Cl.err, borderColor: Cl.err }} onClick={() => blockClub(c.id)}>🚫 Bloquer</button>
              )}
              <button style={{ ...S.btnS("ghost"), fontSize: 11 }} onClick={() => extendTrial(c.id, 15)}>+15j essai</button>
              <button style={{ ...S.btnS("ghost"), fontSize: 11 }} onClick={() => extendTrial(c.id, 30)}>+30j essai</button>
            </div>

            {cm.length > 0 && <div style={{ marginTop: 8 }}>
              {cm.map(m => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${Cl.brd}`, fontSize: 12 }}>
                  <span style={{ flex: 1 }}><strong>{m.name || m.email}</strong> <span style={{ color: Cl.txtL }}>{m.email}</span></span>
                  <select style={S.roleColor ? { fontSize: 11, padding: "3px 8px", borderRadius: 8, fontWeight: 700, color: S.roleColor(m.role), border: `1px solid ${Cl.brd}`, background: Cl.wh, cursor: "pointer", fontFamily: "inherit" } : {}} value={m.role} onChange={e => updateRole(m.id, e.target.value)}>
                    <option value="superadmin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="commercial">Commercial</option>
                    <option value="readonly">Lecture seule</option>
                  </select>
                  <button style={S.btnDelete} onClick={() => setConfirmDel({ type: "member", id: m.id, label: m.name || m.email })}>✕</button>
                </div>
              ))}
            </div>}
          </div>
        );
      })}
    </>}

    {showAddClub && <Modal title="+ Nouveau club" onClose={() => setShowAddClub(false)}>
      <Field label="Identifiant (sans espaces)"><input style={{ ...S.inp, fontFamily: "monospace" }} value={newClub.id} onChange={e => setNewClub({ ...newClub, id: e.target.value })} placeholder="ex: fc-nantes" /></Field>
      <Field label="Nom du club"><input style={S.inp} value={newClub.name} onChange={e => setNewClub({ ...newClub, name: e.target.value })} placeholder="ex: FC Nantes" /></Field>
      <Field label="Durée de la période d'essai (jours)">
        <input type="number" style={S.inp} value={newClub.trialDays} onChange={e => setNewClub({ ...newClub, trialDays: e.target.value })} min="1" max="365" />
      </Field>
      <div style={{ fontSize: 11, color: Cl.txtL, marginTop: 4 }}>
        Le club sera en mode essai pendant {newClub.trialDays || 30} jours. Après expiration, l'accès sera bloqué jusqu'à activation manuelle.
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={S.btn("ghost")} onClick={() => setShowAddClub(false)}>Annuler</button>
        <button style={S.btn("primary")} onClick={addClub}>Créer</button>
      </div>
    </Modal>}

    {showAddMember && <Modal title="+ Nouveau membre" onClose={() => setShowAddMember(false)}>
      <Field label="Email"><input type="email" style={S.inp} value={newMember.email} onChange={e => setNewMember({ ...newMember, email: e.target.value })} placeholder="email@example.com" /></Field>
      <Field label="Nom"><input style={S.inp} value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} placeholder="Prénom Nom" /></Field>
      <Field label="Club"><select style={S.sel} value={newMember.club_id} onChange={e => setNewMember({ ...newMember, club_id: e.target.value })}>
        <option value="">-- Choisir --</option>
        {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select></Field>
      <Field label="Rôle"><select style={S.sel} value={newMember.role} onChange={e => setNewMember({ ...newMember, role: e.target.value })}>
        <option value="commercial">Commercial</option>
        <option value="admin">Admin</option>
        <option value="readonly">Lecture seule</option>
        <option value="superadmin">Super Admin</option>
      </select></Field>
      <div style={{ fontSize: 11, color: Cl.txtL, marginTop: 4 }}>
        <strong>Admin</strong> : tout sauf gestion des clubs · <strong>Commercial</strong> : pas de facturation ni paramètres · <strong>Lecture seule</strong> : consulte sans modifier
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={S.btn("ghost")} onClick={() => setShowAddMember(false)}>Annuler</button>
        <button style={S.btn("primary")} onClick={addMember}>Ajouter</button>
      </div>
    </Modal>}

    {editClub && <Modal title="✏️ Modifier le club" onClose={() => setEditClub(null)}>
      <Field label="Identifiant (sans espaces)"><input style={{ ...S.inp, fontFamily: "monospace" }} value={editClub.newId} onChange={e => setEditClub({ ...editClub, newId: e.target.value })} placeholder="ex: fc-nantes" /></Field>
      <Field label="Nom du club"><input style={S.inp} value={editClub.newName} onChange={e => setEditClub({ ...editClub, newName: e.target.value })} placeholder="ex: FC Nantes" /></Field>
      {editClub.newId !== editClub.id && <div style={S.alert("warning")}>⚠️ Changer l'identifiant va migrer tous les membres vers le nouvel ID.</div>}
      <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={S.btn("ghost")} onClick={() => setEditClub(null)}>Annuler</button>
        <button style={S.btn("primary")} onClick={saveEditClub}>Enregistrer</button>
      </div>
    </Modal>}

    {confirmDel && <Modal title="🗑 Confirmer la suppression" onClose={() => setConfirmDel(null)}>
      <p style={{ fontSize: 14, marginBottom: 16 }}>Êtes-vous sûr de vouloir supprimer <strong>{confirmDel.label}</strong>{confirmDel.type === "club" ? " et tous ses membres" : ""} ? Cette action est irréversible.</p>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={S.btn("ghost")} onClick={() => setConfirmDel(null)}>Annuler</button>
        <button style={{ ...S.btn("primary"), background: Cl.err }} onClick={doDelete}>Supprimer</button>
      </div>
    </Modal>}
  </>);
}
