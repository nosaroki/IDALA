-- ============================================
-- PERMISSIONS SUPABASE - The Idala Family
-- À réappliquer si les permissions sont perdues
-- ============================================

-- Accès public (lecture seule pour le front)
GRANT SELECT ON public.pratiques TO anon;
GRANT SELECT ON public.praticiens TO anon;
GRANT SELECT ON public.praticien_pratiques TO anon;
GRANT SELECT ON public.praticien_offres TO anon;
GRANT SELECT ON public.praticiens_public TO anon;

-- Candidatures : lecture + insertion publique (formulaire)
GRANT SELECT, INSERT ON public.candidatures TO anon;

-- Admin : accès complet pour utilisateurs authentifiés
GRANT ALL ON public.pratiques TO authenticated;
GRANT ALL ON public.praticiens TO authenticated;
GRANT ALL ON public.praticien_pratiques TO authenticated;
GRANT ALL ON public.praticien_offres TO authenticated;
GRANT ALL ON public.candidatures TO authenticated;

-- Lecture publique des praticiens actifs (pour affichage sur le site)
DROP POLICY IF EXISTS "lecture publique praticiens" ON public.praticiens;
CREATE POLICY "lecture publique praticiens" ON public.praticiens FOR SELECT TO anon, authenticated USING (actif = true);

-- Service role : accès total (edge functions)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- S'assurer que les nouvelles tables héritent des bonnes permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

-- ============================================================
-- STORAGE : Permissions sur le bucket photos-praticiens
-- ============================================================
-- Ces policies controlent qui peut uploader, lire et gerer les
-- photos dans le bucket. Si elles sautent, l'upload de candidature
-- echoue (erreur 403) et les photos ne s'affichent plus.

-- GRANT au niveau table (Storage utilise sa propre table objects)
GRANT SELECT, INSERT ON storage.objects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;

-- Upload : public (formulaire candidature) + authenticated (admin)
DROP POLICY IF EXISTS "upload photos praticiens" ON storage.objects;
CREATE POLICY "upload photos praticiens"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'photos-praticiens');

-- Lecture publique des photos (pour affichage sur le site)
DROP POLICY IF EXISTS "lecture photos praticiens" ON storage.objects;
CREATE POLICY "lecture photos praticiens"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'photos-praticiens');

-- Gestion complete pour l'admin (modifier, supprimer)
DROP POLICY IF EXISTS "gestion photos praticiens" ON storage.objects;
CREATE POLICY "gestion photos praticiens"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'photos-praticiens')
WITH CHECK (bucket_id = 'photos-praticiens');