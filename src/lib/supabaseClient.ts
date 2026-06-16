import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vzfzykzmxyqecfrsewao.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6InZ6Znp5a3pteHlxZWNmcnNld2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczODU3MDgsImV4cCI6MjA5Mjk2MTcwOH0.OJGeRbHx1hSsHmucW_b9bXlcjPcSOlIGiCIFEdwlk9U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseFunctionsUrl = `${supabaseUrl}/functions/v1`;
