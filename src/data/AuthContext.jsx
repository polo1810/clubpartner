import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

const AuthCtx = createContext();
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [clubData, setClubData] = useState(null);    // Paramètres du club (saisons, catégories, etc.)
  const [clubInfo, setClubInfoState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Données chargées depuis les tables séparées
  const [initCompanies, setInitCompanies] = useState([]);
  const [initContracts, setInitContracts] = useState([]);
  const [initInvoices, setInitInvoices] = useState([]);
  const [initProducts, setInitProducts] = useState([]);

  const isLocal = !supabase;

  useEffect(() => {
    if (isLocal) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadUserData(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadUserData(session.user);
      else { setUser(null); setMember(null); setClubData(null); setClubInfoState(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (u) => {
    setUser(u);
    setError("");
    try {
      // Trouver le membre
      const { data: members, error: mErr } = await supabase.from('club_members').select('*').eq('email', u.email);
      if (mErr) throw mErr;
      if (!members || members.length === 0) { setError("Aucun accès. Contactez votre administrateur."); setLoading(false); return; }
      const m = members[0];
      setMember(m);

      // Charger le club (paramètres uniquement)
      const { data: club, error: cErr } = await supabase.from('clubs').select('*').eq('id', m.club_id).single();
      if (cErr) throw cErr;

      // Charger les 4 tables séparées EN PARALLÈLE
      const [compRes, contRes, invRes, prodRes] = await Promise.all([
        supabase.from('companies').select('*').eq('club_id', m.club_id),
        supabase.from('contracts').select('*').eq('club_id', m.club_id),
        supabase.from('invoices').select('*').eq('club_id', m.club_id),
        supabase.from('products').select('*').eq('club_id', m.club_id),
      ]);

      // Tout mettre à jour EN MÊME TEMPS pour éviter les rendus intermédiaires
      setInitCompanies((compRes.data || []).map(r => r.data));
      setInitContracts((contRes.data || []).map(r => r.data));
      setInitInvoices((invRes.data || []).map(r => r.data));
      setInitProducts((prodRes.data || []).map(r => r.data));
      setClubInfoState({ id: club.id, name: club.name });
      setClubData(club.data || {}); // Doit être EN DERNIER (déclenche le montage d'AppProvider)

    } catch (e) {
      setError("Erreur de chargement : " + (e.message || e));
    }
    setLoading(false);
  };

  // Sauvegarder les paramètres du club (saisons, catégories, scripts, etc.)
  const saveClubData = async (data) => {
    if (isLocal || !member) return;
    if (member.role === "readonly") return;
    const { error } = await supabase.from('clubs').update({ data, updated_at: new Date().toISOString() }).eq('id', member.club_id);
    if (error) console.error("Save settings error:", error);
  };

  const login = async (email) => {
    if (isLocal) return;
    setError("");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (error) setError(error.message);
    return !error;
  };

  const loginWithPassword = async (email, password) => {
    if (isLocal) return;
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message === "Invalid login credentials" ? "Email ou mot de passe incorrect" : error.message);
    return !error;
  };

  const signUp = async (email, password) => {
    if (isLocal) return;
    setError("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    return !error;
  };

  const logout = async () => {
    if (isLocal) return;
    await supabase.auth.signOut();
    setUser(null); setMember(null); setClubData(null); setClubInfoState(null);
  };

  const role = member?.role || "admin";
  const canEdit = role !== "readonly";
  const canInvoice = role === "admin" || role === "superadmin";
  const canSettings = role === "admin" || role === "superadmin";
  const isSuperAdmin = role === "superadmin";

  const value = {
    user, member, clubData, clubInfo, loading, error, isLocal,
    login, loginWithPassword, signUp, logout, saveClubData, loadUserData,
    role, canEdit, canInvoice, canSettings, isSuperAdmin,
    // Données initiales des tables séparées
    initCompanies, initContracts, initInvoices, initProducts,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
