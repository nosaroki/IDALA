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

-- Service role : accès total (edge functions)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- S'assurer que les nouvelles tables héritent des bonnes permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;