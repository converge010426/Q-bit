import { createClient } from '@supabase/supabase-js';

let supabaseClient: any = null;

export const getSupabase = (useServiceRole = false) => {
  // We don't cache the service role client to avoid accidental leaks
  if (supabaseClient && !useServiceRole) return supabaseClient;

  const rawUrl = (typeof process !== 'undefined' ? process.env.SUPABASE_URL : undefined) || 
                 (typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.VITE_SUPABASE_URL : undefined);
  
  const anonKey = (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : undefined) || 
                  (typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.VITE_SUPABASE_ANON_KEY : undefined);
  
  const serviceKey = (typeof process !== 'undefined' ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined);

  const supabaseUrl = rawUrl?.replace(/^[•\s\t]+/, '').trim();
  const supabaseAnonKey = anonKey?.replace(/^[•\s\t]+/, '').trim();
  const supabaseServiceKey = serviceKey?.replace(/^[•\s\t]+/, '').trim();

  // Detect common placeholder mistakes
  if (supabaseUrl === 'VITE_SUPABASE_URL' || supabaseUrl === 'SUPABASE_URL') {
    throw new Error(`CRITICAL: Your SUPABASE_URL environment variable is set to the literal string "${supabaseUrl}". You must replace this with your actual Supabase project URL (e.g., https://xyz.supabase.co).`);
  }
  if (supabaseAnonKey === 'VITE_SUPABASE_ANON_KEY' || supabaseAnonKey === 'SUPABASE_ANON_KEY') {
    throw new Error(`CRITICAL: Your SUPABASE_ANON_KEY environment variable is set to a literal placeholder string. You must replace this with your actual Supabase "anon" public key.`);
  }

  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    throw new Error(`Invalid SUPABASE_URL: "${supabaseUrl}". It must be a valid URL starting with http:// or https://.`);
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    const missing = [];
    if (!supabaseUrl) missing.push('SUPABASE_URL');
    if (!supabaseAnonKey) missing.push('SUPABASE_ANON_KEY');
    throw new Error(`Supabase configuration is incomplete. Missing: ${missing.join(', ')}.`);
  }

  // Use service key if requested and available, otherwise fallback to anon
  const finalKey = (useServiceRole && supabaseServiceKey) ? supabaseServiceKey : supabaseAnonKey;
  
  const client = createClient(supabaseUrl, finalKey);
  if (!useServiceRole) supabaseClient = client;
  return client;
};
