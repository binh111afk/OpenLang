const { createClient } = require("@supabase/supabase-js");

function getSupabaseServerEnv() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return { supabaseUrl, supabaseKey };
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  try {
    const { supabaseUrl, supabaseKey } = getSupabaseServerEnv();
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabase
      .from("vocabulary")
      .select("*")
      .limit(20);

    if (error) {
      res.statusCode = 500;
      res.end(
        JSON.stringify({
          error: error.message,
          source: "supabase",
        }),
      );
      return;
    }

    res.statusCode = 200;
    res.end(
      JSON.stringify({
        ok: true,
        source: "server",
        rowCount: Array.isArray(data) ? data.length : 0,
        data: data ?? [],
      }),
    );
  } catch (error) {
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Unknown server error",
        source: "server",
      }),
    );
  }
};
