import Database from 'better-sqlite3';
import { StatusError } from 'itty-router';

export class LocalDatabase {
    private db: Database.Database;

    constructor(dbPath: string) {
        this.db = new Database(dbPath);
        this.db.pragma('journal_mode = WAL');
    }

    // Query audio entries from SQLite
    queryAudioEntries(query: string, params: any[]): any[] {
        try {
            const stmt = this.db.prepare(query);
            const results = stmt.all(...params);
            return results;
        } catch (error: any) {
            throw new StatusError(500, `Database query failed: ${error.message}`);
        }
    }

    // Query pitch accents from SQLite
    queryPitchAccents(query: string, params: any[]): any[] {
        try {
            const stmt = this.db.prepare(query);
            const results = stmt.all(...params);
            return results;
        } catch (error: any) {
            throw new StatusError(500, `Database query failed: ${error.message}`);
        }
    }

    // Close the database connection
    close() {
        this.db.close();
    }
}

