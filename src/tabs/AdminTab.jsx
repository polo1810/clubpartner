import { useState, useEffect } from 'react';
import { useAuth } from '../data/AuthContext';
import { supabase } from '../data/supabase';
import { S, Cl } from '../data/styles';
import { Badge, Modal, Field } from '../components/index';

export default function AdminTab() {
  const { isSuperAdmin, member } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddClub, setShowAddClub] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newClub, setNewClub] = useState({ id: "", name: "" });
  const [newMember, setNewMember] = useState({ email: "", club_id: "", role: "commercial", name: "" });

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data: c } = await supabase.from('clubs').select('id, name, created_at');
    const { data: m } = await supabase.from('club_members').select('*');
    setClubs(c || []);
    setAllMembers(m || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addClub = async () => {
    if (!newClub.id.trim() || !newClub.name.trim()) return;
    const { error } = await supabase.from('clubs').insert({ id: newClub.id.trim().toLowerCase().replace(/\s/g, "-"), name: newClub.name.trim(), data: {} });
    if (error) { alert("Erreur : " + error.message); return; }
    setShowAddClub(false); setNewClub({ id: "", name: "" }); load();
  };

  const deleteClub = async (id) => {
    if (!confirm(`Supprimer le club "${id}" et tous ses membres ?`)) return;
    await supabase.from('clubs').delete().eq('id', id);
    load();
  };

  const addMember = async () => {
    if (!newMember.email.trim() || !newMember.club_id) return;
    const { error } = await supabase.from('club_members').insert({ email: newMember.email.trim().toLowerCase(), club_id: newMember.club_id, role: newMember.role, name: newMember.name.trim() });
    if (error) { alert("Erreur : " + error.message); return; }
    setShowAddMember(false); setNewMember({ email: "", club_id: "", role: "commercial", name: "" }); load();
  };

  const deleteMember = async (id) => {
    if (!confirm("Supprimer ce membre ?")) return;
    await supabase.from('club_members').delete().eq('id', id);
    load();
  };

  const updateRole = async (id, role) => {
    await supabase.from('club_members').update({ role }).eq('id', id);
    load();
  };

  if (!isSuperAdmin) return <div style={{ textAlign: "center", padding: 40, color: Cl.txtL }}>Accès réservé au super-administrateur.</div>;

  const roleColor = (r) => ({ superadmin: Cl.err, admin: Cl.pur, commercial: Cl.pri, readonly: Cl.txtL }[r] || Cl.txtL);

  return (<>
    <div style={S.fx}>
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>🔧 Administration</h2>
      <div style={{ display: "flex", gap: 4 }}>
        <button style={S.btn("primary")} onClick={() => setShowAddClub(true)}>+ Club</button>
        <button style={S.btn("primary")} onClick={() => setShowAddMember(true)}>+ Membre</button>
      </div>
    </div>

    {loading ? <p style={{ color: Cl.txtL }}>Chargement...</p> : <>
      {/* Clubs list */}
      <div style={{ ...S.cT, marginTop: 14 }}>🏟️ Clubs ({clubs.length})</div>
      {clubs.map(c => {
        const cm = allMembers.filter(m => m.club_id === c.id);
        return (
          <div key={c.id} style={{ ...S.card, marginTop: 6 }}>
            <div style={S.fx}>
              <div><strong style={{ fontSize: 14 }}>{c.name}</strong><span style={{ fontSize: 10, color: Cl.txtL, marginLeft: 6, fontFamily: "monospace" }}>{c.id}</span></div>
              <div style={{ display: "flex", gap: 4 }}>
                <span style={{ fontSize: 11, color: Cl.txtL }}>{cm.length} membre{cm.length > 1 ? "s" : ""}</span>
                <button style={{ ...S.btnS("ghost"), color: Cl.err, fontSize: 11 }} onClick={() => deleteClub(c.id)}>🗑️</button>
              </div>
            </div>
            {cm.length > 0 && <div style={{ marginTop: 6 }}>
              {cm.map(m => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: `1px solid ${Cl.brd}`, fontSize: 11 }}>
                  <span style={{ flex: 1 }}><strong>{m.name || m.email}</strong> <span style={{ color: Cl.txtL }}>{m.email}</span></span>
                  <select style={{ ...S.sel, width: "auto", fontSize: 10, padding: "2px 6px", color: roleColor(m.role), fontWeight: 700 }} value={m.role} onChange={e => updateRole(m.id, e.target.value)}>
                    <option value="superadmin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="commercial">Commercial</option>
                    <option value="readonly">Lecture seule</option>
                  </select>
                  <button style={{ ...S.btnS("ghost"), fontSize: 10, color: Cl.err }} onClick={() => deleteMember(m.id)}>✕</button>
                </div>
              ))}
            </div>}
          </div>
        );
      })}
    </>}

    {/* Add Club Modal */}
    {showAddClub && <Modal title="+ Nouveau club" onClose={() => setShowAddClub(false)}>
      <Field label="Identifiant (sans espaces)"><input style={{ ...S.inp, fontFamily: "monospace" }} value={newClub.id} onChange={e => setNewClub({ ...newClub, id: e.target.value })} placeholder="ex: fc-nantes" /></Field>
      <Field label="Nom du club"><input style={S.inp} value={newClub.name} onChange={e => setNewClub({ ...newClub, name: e.target.value })} placeholder="ex: FC Nantes" /></Field>
      <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={S.btn("ghost")} onClick={() => setShowAddClub(false)}>Annuler</button>
        <button style={S.btn("primary")} onClick={addClub}>Créer</button>
      </div>
    </Modal>}

    {/* Add Member Modal */}
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
      <div style={{ fontSize: 10, color: Cl.txtL, marginTop: 4 }}>
        <strong>Admin</strong> : tout sauf gestion des clubs · <strong>Commercial</strong> : pas de facturation ni paramètres · <strong>Lecture seule</strong> : consulte sans modifier
      </div>
      <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={S.btn("ghost")} onClick={() => setShowAddMember(false)}>Annuler</button>
        <button style={S.btn("primary")} onClick={addMember}>Ajouter</button>
      </div>
    </Modal>}
  </>);
}
