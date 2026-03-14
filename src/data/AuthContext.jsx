import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

const AuthCtx = createContext();
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Supabase user
  const [member, setMember] = useState(null);    // { email, club_id, role, name }
  const [clubData, setClubData] = useState(null); // JSON data du club
  const [clubInfo, setClubInfoState] = useState(null); // { id, name }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Si pas de Supabase configuré, mode local
  const isLocal = !supabase;

  useEffect(() => {
    if (isLocal) { setLoading(false); return; }

    // Check session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadUserData(session.user);
      else setLoading(false);
    });

    // Listen for auth changes
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
      // Find member entry
      const { data: members, error: mErr } = await supabase.from('club_members').select('*').eq('email', u.email);
      if (mErr) throw mErr;
      if (!members || members.length === 0) { setError("Aucun accès. Contactez votre administrateur."); setLoading(false); return; }
      const m = members[0];
      setMember(m);

      // Load club
      const { data: club, error: cErr } = await supabase.from('clubs').select('*').eq('id', m.club_id).single();
      if (cErr) throw cErr;
      setClubInfoState({ id: club.id, name: club.name });
      setClubData(club.data || {});
    } catch (e) {
      setError("Erreur de chargement : " + (e.message || e));
    }
    setLoading(false);
  };

  // Save club data to Supabase
  const saveClubData = async (data) => {
    if (isLocal || !member) return;
    if (member.role === "readonly") return; // Lecture seule ne sauvegarde pas
    const { error } = await supabase.from('clubs').update({ data, updated_at: new Date().toISOString() }).eq('id', member.club_id);
    if (error) console.error("Save error:", error);
  };

  // Login with magic link
  const login = async (email) => {
    if (isLocal) return;
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) setError(error.message);
    return !error;
  };

  // Logout
  const logout = async () => {
    if (isLocal) return;
    await supabase.auth.signOut();
    setUser(null); setMember(null); setClubData(null); setClubInfoState(null);
  };

  // Role helpers
  const role = member?.role || "admin";
  const canEdit = role !== "readonly";
  const canInvoice = role === "admin" || role === "superadmin";
  const canSettings = role === "admin" || role === "superadmin";
  const isSuperAdmin = role === "superadmin";

  const value = {
    user, member, clubData, clubInfo: clubInfoState, loading, error, isLocal,
    login, logout, saveClubData, loadUserData,
    role, canEdit, canInvoice, canSettings, isSuperAdmin,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
