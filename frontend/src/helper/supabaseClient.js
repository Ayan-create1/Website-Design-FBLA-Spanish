import { createClient } from "@supabase/supabase-js"

//look into using .env file over here
const supabaseUrl = "https://ixyucxilnbsaifbgkbzg.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4eXVjeGlsbmJzYWlmYmdrYnpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MDQ0NzgsImV4cCI6MjA4NzQ4MDQ3OH0.xiHkwu5drlAiN0ZjQRbyjG9n6JFnKSd4AultuoRCUZg";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;