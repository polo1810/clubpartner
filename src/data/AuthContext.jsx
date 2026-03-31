import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

const AuthCtx = createContext();
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [clubData, setClubData] = useState(null);
  const [clubInfo, setClubInfoState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Données chargées depuis les tables séparées
  const [initCompanies, setInitCompanies] = useState([]);
  const [initContracts, setInitContracts] = useState([]);
  const [initInvoices, setInitInvoices] = useState([]);
  const [initProducts, setInitProducts] = useState([]);

  // ★ NOUVEAU : multi-clubs
  const [allMemberships, setAllMemberships] = useState([]);

  const isLocal = !supabase;

  useEffect(() => {
    if (isLocal) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadUserData(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadUserData(session.user);
      else { setUser(null); setMember(null); setClubData(null); setClubInfoState(null); setAllMemberships([]); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ★ Charger les données d'UN club spécifique
  const loadClubData = async (m) => {
    setMember(m);
    try {
      const { data: club, error: cErr } = await supabase.from('clubs').select('*').eq('id', m.club_id).single();
      if (cErr) throw cErr;

      const [compRes, contRes, invRes, prodRes] = await Promise.all([
        supabase.from('companies').select('*').eq('club_id', m.club_id),
        supabase.from('contracts').select('*').eq('club_id', m.club_id),
        supabase.from('invoices').select('*').eq('club_id', m.club_id),
        supabase.from('products').select('*').eq('club_id', m.club_id),
      ]);

      setInitCompanies((compRes.data || []).map(r => r.data));
      setInitContracts((contRes.data || []).map(r => r.data));
      setInitInvoices((invRes.data || []).map(r => r.data));
      setInitProducts((prodRes.data || []).map(r => r.data));
      setClubInfoState({ id: club.id, name: club.name });
      setClubData(club.data || {});
    } catch (e) {
      setError("Erreur de chargement : " + (e.message || e));
    }
    setLoading(false);
  };

  const loadUserData = async (u) => {
    setUser(u);
    setError("");
    try {
      const { data: members, error: mErr } = await supabase.from('club_members').select('*').eq('email', u.email);
      if (mErr) throw mErr;
      if (!members || members.length === 0) { setError("Aucun accès. Contactez votre administrateur."); setLoading(false); return; }

      // ★ Si un seul club → on entre directement
      if (members.length === 1) {
        await loadClubData(members[0]);
        return;
      }

      // ★ Plusieurs clubs → on récupère les noms et on laisse choisir
      const clubIds = members.map(m => m.club_id);
      const { data: clubsData } = await supabase.from('clubs').select('id, name').in('id', clubIds);
      setAllMemberships(members.map(m => ({
        ...m,
        clubName: clubsData?.find(c => c.id === m.club_id)?.name || m.club_id
      })));
      setLoading(false);

    } catch (e) {
      setError("Erreur de chargement : " + (e.message || e));
      setLoading(false);
    }
  };

  // ★ L'utilisateur choisit un club
  const selectClub = async (membership) => {
    setLoading(true);
    await loadClubData(membership);
  };

  // ★ Revenir à la sélection de club
  const switchClub = () => {
    setMember(null);
    setClubData(null);
    setClubInfoState(null);
    setInitCompanies([]);
    setInitContracts([]);
    setInitInvoices([]);
    setInitProducts([]);
  };

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
    setUser(null); setMember(null); setClubData(null); setClubInfoState(null); setAllMemberships([]);
  };

  const role = member?.role || "admin";
  const canEdit = role !== "readonly";
  const canInvoice = role === "admin" || role === "superadmin";
  const canSettings = role === "admin" || role === "superadmin";
  const isSuperAdmin = role === "superadmin";

  // ★ Vrai si l'utilisateur doit choisir un club
  const needsClubSelection = allMemberships.length > 1 && !member;

  const value = {
    user, member, clubData, clubInfo, loading, error, isLocal,
    login, loginWithPassword, signUp, logout, saveClubData, loadUserData,
    role, canEdit, canInvoice, canSettings, isSuperAdmin,
    initCompanies, initContracts, initInvoices, initProducts,
    // ★ NOUVEAU
    allMemberships, needsClubSelection, selectClub, switchClub,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
