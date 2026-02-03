// config/supabase.js
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.RECT_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.RECT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY // server only
);

module.exports = supabase;
