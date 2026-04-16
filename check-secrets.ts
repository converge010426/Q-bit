import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const placeholderUrl = "https://acuuasfmtmfolabunhhf.supabase.co";
const placeholderKey = "sb_publishable_gbxtZh3697WfrjTmN94nb...";

console.log("--- Secret Keys Validation Report ---");

if (!supabaseUrl) {
  console.log("❌ SUPABASE_URL: Not defined in environment.");
} else {
  console.log(`SUPABASE_URL: "${supabaseUrl}" (Length: ${supabaseUrl.length})`);
  const firstChar = supabaseUrl.charCodeAt(0);
  console.log(`First character code: ${firstChar} ('${supabaseUrl[0]}')`);
  if (supabaseUrl === placeholderUrl) {
    console.log("❌ SUPABASE_URL: Matches the placeholder value from .env.example. Please update it with your actual Supabase URL.");
  } else if (!supabaseUrl.startsWith("https://") || !supabaseUrl.includes(".supabase.co")) {
    console.log(`⚠️ SUPABASE_URL: Does not look like a standard Supabase URL.`);
  } else {
    console.log("✅ SUPABASE_URL: Defined and looks like a valid Supabase URL.");
  }
}

if (!supabaseAnonKey) {
  console.log("❌ SUPABASE_ANON_KEY: Not defined in environment.");
} else {
  console.log(`SUPABASE_ANON_KEY: "${supabaseAnonKey}" (Length: ${supabaseAnonKey.length})`);
  const firstChar = supabaseAnonKey.charCodeAt(0);
  console.log(`First character code: ${firstChar} ('${supabaseAnonKey[0]}')`);
  if (supabaseAnonKey === placeholderKey) {
    console.log("❌ SUPABASE_ANON_KEY: Matches the placeholder value from .env.example. Please update it with your actual Supabase Anon Key.");
  } else if (supabaseAnonKey.length < 50) {
    console.log(`⚠️ SUPABASE_ANON_KEY: Length is ${supabaseAnonKey.length}, which is shorter than a typical Supabase Anon Key.`);
  } else {
    console.log("✅ SUPABASE_ANON_KEY: Defined and has a reasonable length.");
  }
}

console.log("-------------------------------------");
