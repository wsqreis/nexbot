#!/usr/bin/env node
import fs from 'fs/promises';
import { Client } from 'pg';

function shouldUseSsl(connectionString) {
  if (process.env.DATABASE_SSL === 'true') return { rejectUnauthorized: false };
  if (process.env.DATABASE_SSL === 'false') return false;

  try {
    const { hostname } = new URL(connectionString);
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === 'db' || hostname === 'postgres') {
      return false;
    }
  } catch {
    return false;
  }

  return { rejectUnauthorized: false };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node scripts/run-migration.js <sql-file> [DATABASE_URL]');
    process.exit(1);
  }

  const sqlPath = args[0];
  const dbUrl = process.env.DATABASE_URL || args[1];
  if (!dbUrl) {
    console.error('Set DATABASE_URL env var or pass as second argument');
    process.exit(1);
  }

  try {
    const sql = await fs.readFile(sqlPath, 'utf8');
    const client = new Client({ connectionString: dbUrl, ssl: shouldUseSsl(dbUrl) });
    await client.connect();
    console.log('Connected to database, running migration...');
    await client.query(sql);
    console.log('Migration applied successfully.');
    await client.end();
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exit(1);
  }
}

main();
