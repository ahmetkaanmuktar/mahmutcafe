import fs from "fs";
import path from "path";
import type { Database } from "./types";

// Use /tmp on production if not GCS, otherwise local directory
const IS_PROD = process.env.NODE_ENV === "production";
const DATA_DIR = IS_PROD ? "/tmp/data" : path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const GCS_DB_FILE = "db.json";

const EMPTY_DB: Database = { users: [], groups: [], transactions: [], invitations: [] };

function ensureLocalDb(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(EMPTY_DB, null, 2), "utf-8");
  }
}

async function readFromGcs(bucket: string): Promise<Database> {
  const { Storage } = await import("@google-cloud/storage");
  const storage = new Storage();
  const file = storage.bucket(bucket).file(GCS_DB_FILE);
  const [exists] = await file.exists();
  if (!exists) return { ...EMPTY_DB };
  const [contents] = await file.download();
  return JSON.parse(contents.toString("utf-8")) as Database;
}

async function writeToGcs(db: Database, bucket: string): Promise<void> {
  const { Storage } = await import("@google-cloud/storage");
  const storage = new Storage();
  const file = storage.bucket(bucket).file(GCS_DB_FILE);
  await file.save(JSON.stringify(db, null, 2), {
    contentType: "application/json",
  });
}

export async function readDb(): Promise<Database> {
  const bucket = process.env.GCS_BUCKET;
  let db: Database;
  if (bucket) {
    db = await readFromGcs(bucket);
  } else {
    ensureLocalDb();
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    db = JSON.parse(raw) as Database;
  }
  if (!db.invitations) db.invitations = [];
  return db;
}

export async function writeDb(db: Database): Promise<void> {
  const bucket = process.env.GCS_BUCKET;
  if (bucket) {
    await writeToGcs(db, bucket);
    return;
  }
  ensureLocalDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export async function updateDb(
  mutator: (db: Database) => void
): Promise<Database> {
  const db = await readDb();
  mutator(db);
  await writeDb(db);
  return db;
}
