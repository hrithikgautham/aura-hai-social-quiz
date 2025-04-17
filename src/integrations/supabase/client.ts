
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://tjlswxiqmtbtqbhofhmt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqbHN3eGlxbXRidHFiaG9maG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTgzMDEsImV4cCI6MjA2MDIzNDMwMX0.nwtxRmothYE6KcRncsSsBG8o2xI_Mu6c1_KMkdodNm4";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    detectSessionInUrl: true,  // Look for #access_token/#id_token on page load
    persistSession: true,      // Store session in localStorage
    autoRefreshToken: true,    // Automatically refresh the token
    storageKey: 'sb-access-token'  // Custom storage key for better control
  }
});

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
