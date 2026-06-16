import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vzfzykzmxyqecfrsewao.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_CkF_YH2m9esQFCazD0LWdg_NbSawE1y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseFunctionsUrl = `${supabaseUrl}/functions/v1`;
