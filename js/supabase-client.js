// Creates the shared Supabase client. Requires supabase-config.js and the
// Supabase JS library (loaded via CDN) to run first.
window.supabaseClient = null;

if (window.supabase && window.SUPABASE_URL && !window.SUPABASE_URL.includes('YOUR-PROJECT-REF')) {
  window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
} else {
  console.warn('Supabase is not configured yet — update js/supabase-config.js with your project URL and anon key.');
}
