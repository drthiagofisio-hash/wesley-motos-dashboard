import { createClient } from '@supabase/supabase-js';

// TODO: Substituir pela URL e chave do projeto Supabase do Wesley
export const SUPABASE_URL = 'https://tblyexnniromidsqhufw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_OzarIWLAEk4TCzmUSPckuQ_edPAz55q';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
