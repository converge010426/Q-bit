import "dotenv/config";
import { getSupabase } from "./src/lib/supabase.js";

async function checkSubmissions() {
  const supabase = getSupabase(true);
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('id', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching submissions:", error);
    return;
  }

  console.log("Last 5 Submissions:");
  data.forEach(s => {
    console.log(`ID: ${s.id} | Name: ${s.name} | Email: ${s.email} | Report URL: ${s.report_url}`);
  });
}

checkSubmissions();
