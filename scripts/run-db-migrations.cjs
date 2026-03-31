const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const { Client } = require('pg');

const cwd = process.cwd();
const envFiles = [
  path.resolve(cwd, '.env'),
  path.resolve(cwd, '.env.local'),
  path.resolve(cwd, 'client/.env'),
  path.resolve(cwd, 'client/.env.local'),
];

for (const envPath of envFiles) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

function getDatabaseUrl() {
  return (
    process.env.SUPABASE_DB_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    ''
  );
}

function normalizeSslMode(databaseUrl) {
  const sslModeOverride = String(process.env.DB_MIGRATION_SSLMODE || '').trim();

  try {
    const parsed = new URL(databaseUrl);

    if (sslModeOverride) {
      parsed.searchParams.set('sslmode', sslModeOverride);
      return parsed.toString();
    }

    const currentMode = (parsed.searchParams.get('sslmode') || '').toLowerCase();

    if (!currentMode || currentMode === 'prefer' || currentMode === 'require' || currentMode === 'verify-ca') {
      parsed.searchParams.set('sslmode', 'no-verify');
      return parsed.toString();
    }

    return parsed.toString();
  } catch {
    return databaseUrl;
  }
}

function shouldEnforceMigration() {
  return String(process.env.VERCEL || '').toLowerCase() === '1' ||
    String(process.env.CI || '').toLowerCase() === 'true';
}

async function runSqlFile(client, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8').trim();

  if (!sql) {
    return;
  }

  console.log('[db:migrate] Applying', path.relative(cwd, filePath));
  await client.query(sql);
}

async function main() {
  const rawDatabaseUrl = getDatabaseUrl();
  const databaseUrl = normalizeSslMode(rawDatabaseUrl);

  if (!databaseUrl) {
    const message =
      'Missing SUPABASE_DB_URL (or POSTGRES_URL / DATABASE_URL). Skipping DB migrations.';

    if (shouldEnforceMigration()) {
      throw new Error(message);
    }

    console.warn('[db:migrate]', message);
    return;
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const migrationFiles = [
    path.resolve(cwd, 'server/scripts/flashcards-library-schema.sql'),
    path.resolve(cwd, 'server/scripts/openlang-learning-schema.sql'),
  ];

  try {
    await client.connect();

    for (const filePath of migrationFiles) {
      if (!fs.existsSync(filePath)) {
        console.warn('[db:migrate] Missing migration file:', path.relative(cwd, filePath));
        continue;
      }

      await runSqlFile(client, filePath);
    }

    console.log('[db:migrate] Done.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('[db:migrate] Failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
