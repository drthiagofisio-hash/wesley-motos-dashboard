import { createClient } from '@supabase/supabase-js';

// TODO: Substituir pela URL e chave do projeto Supabase do Wesley
export const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANON_AQUI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
