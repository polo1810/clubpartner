-- =============================================
-- ClubPartner - Supabase Setup
-- Copier ce script dans l'éditeur SQL de Supabase
-- (Dashboard > SQL Editor > New query)
-- =============================================

-- Table clubs : un JSON par club
CREATE TABLE clubs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table membres : qui a accès à quel club + rôle
CREATE TABLE club_members (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'commercial',
  name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(email, club_id)
);

-- Activer RLS (Row Level Security)
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;

-- Politique : un utilisateur connecté peut lire son club
CREATE POLICY "Users can read their club"
  ON clubs FOR SELECT
  USING (id IN (SELECT club_id FROM club_members WHERE email = auth.jwt()->>'email'));

-- Politique : un utilisateur connecté peut modifier son club
CREATE POLICY "Users can update their club"
  ON clubs FOR UPDATE
  USING (id IN (SELECT club_id FROM club_members WHERE email = auth.jwt()->>'email'));

-- Politique : lecture des membres de son club
CREATE POLICY "Users can read their club members"
  ON club_members FOR SELECT
  USING (club_id IN (SELECT club_id FROM club_members WHERE email = auth.jwt()->>'email'));

-- Politique : les admins peuvent gérer les membres
CREATE POLICY "Admins can insert members"
  ON club_members FOR INSERT
  WITH CHECK (club_id IN (SELECT club_id FROM club_members WHERE email = auth.jwt()->>'email' AND role IN ('admin', 'superadmin')));

CREATE POLICY "Admins can delete members"
  ON club_members FOR DELETE
  USING (club_id IN (SELECT club_id FROM club_members WHERE email = auth.jwt()->>'email' AND role IN ('admin', 'superadmin')));

CREATE POLICY "Admins can update members"
  ON club_members FOR UPDATE
  USING (club_id IN (SELECT club_id FROM club_members WHERE email = auth.jwt()->>'email' AND role IN ('admin', 'superadmin')));

-- Politique superadmin : peut tout faire sur clubs
CREATE POLICY "Superadmin can do everything on clubs"
  ON clubs FOR ALL
  USING (EXISTS (SELECT 1 FROM club_members WHERE email = auth.jwt()->>'email' AND role = 'superadmin'));

CREATE POLICY "Superadmin can do everything on members"
  ON club_members FOR ALL
  USING (EXISTS (SELECT 1 FROM club_members WHERE email = auth.jwt()->>'email' AND role = 'superadmin'));

-- =============================================
-- CRÉER TON PREMIER CLUB + TON COMPTE SUPERADMIN
-- Remplace les valeurs ci-dessous par les tiennes
-- =============================================
INSERT INTO clubs (id, name, data) VALUES ('demo', 'Club Sportif de Cholet', '{}');
INSERT INTO club_members (email, club_id, role, name) VALUES ('ton-email@example.com', 'demo', 'superadmin', 'Admin');
