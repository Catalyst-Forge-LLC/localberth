import Database from 'better-sqlite3';
import { DASHBOARD_NAME, DASHBOARD_PORT, dbPath } from './paths.js';

let dbSingleton: Database.Database | null = null;

export function getDb(): Database.Database {
	if (dbSingleton) return dbSingleton;
	let db: Database.Database;
	try {
		db = new Database(dbPath());
	} catch (err) {
		throw rewriteSqliteBindingsError(err);
	}
	db.pragma('journal_mode = WAL');
	db.pragma('foreign_keys = ON');
	migrate(db);
	ensureSelfLease(db);
	dbSingleton = db;
	return db;
}

function rewriteSqliteBindingsError(err: unknown): Error {
	const raw = err instanceof Error ? err.message : String(err);
	if (!/locate the bindings file|better_sqlite3\.node/i.test(raw)) {
		return err instanceof Error ? err : new Error(raw);
	}
	return new Error(
		'SQLite native bindings are missing. npm 12 does not run dependency install scripts, so better-sqlite3 12 never downloads a binary. Use localberth 0.2.1 or newer, or reinstall with: npm i -g localberth --allow-scripts=better-sqlite3'
	);
}

/** Tests only — close the singleton so LOCALBERTH_HOME can change. */
export function resetDb(): void {
	if (!dbSingleton) return;
	dbSingleton.close();
	dbSingleton = null;
}

function migrate(db: Database.Database): void {
	db.exec(`
		CREATE TABLE IF NOT EXISTS leases (
			name TEXT PRIMARY KEY,
			port INTEGER NOT NULL UNIQUE,
			bind TEXT NOT NULL DEFAULT '127.0.0.1',
			protocol TEXT NOT NULL DEFAULT 'tcp',
			kind TEXT NOT NULL DEFAULT 'always',
			notes TEXT NOT NULL DEFAULT '',
			firewall TEXT NOT NULL DEFAULT 'wanted',
			updated_at TEXT NOT NULL
		);
	`);
}

function ensureSelfLease(db: Database.Database): void {
	const row = db.prepare('SELECT name FROM leases WHERE name = ?').get(DASHBOARD_NAME);
	if (row) return;
	const taken = db.prepare('SELECT name FROM leases WHERE port = ?').get(DASHBOARD_PORT);
	if (taken) return;
	db.prepare(
		`INSERT INTO leases (name, port, bind, protocol, kind, notes, firewall, updated_at)
		 VALUES (?, ?, '127.0.0.1', 'tcp', 'always', 'LocalBerth dashboard', 'wanted', ?)`
	).run(DASHBOARD_NAME, DASHBOARD_PORT, new Date().toISOString());
}
