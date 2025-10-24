// Type definitions for local server environment
// This makes the Env and ExecutionContext types available for local development

declare global {
    // D1 Database types
    interface D1Result<T = any> {
        results: T[];
        success: boolean;
        error?: string;
        meta: any;
    }

    interface D1PreparedStatement {
        bind(...values: any[]): D1PreparedStatement;
        all(): Promise<D1Result>;
        first(): Promise<any>;
        run(): Promise<D1Result>;
    }

    interface D1Database {
        prepare(query: string): D1PreparedStatement;
        batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
        exec(query: string): Promise<D1Result>;
    }

    // R2 Bucket types
    interface R2Object {
        blob(): Promise<Blob>;
        arrayBuffer(): Promise<ArrayBuffer>;
        text(): Promise<string>;
        json(): Promise<any>;
    }

    interface R2Bucket {
        get(key: string): Promise<R2Object | null>;
        put(key: string, value: any): Promise<void>;
        delete(key: string): Promise<void>;
    }

    // Main environment interface
    interface Env {
        AUTHENTICATION_ENABLED: boolean;
        AWS_POLLY_ENABLED: boolean;
        API_KEYS: string;
        AWS_ACCESS_KEY_ID: string;
        AWS_SECRET_ACCESS_KEY: string;
        yomitan_audio_d1_db: D1Database;
        yomitan_audio_r2_bucket: R2Bucket;
    }

    // Execution context for Cloudflare Workers
    interface ExecutionContext {
        waitUntil(promise: Promise<any>): void;
        passThroughOnException(): void;
    }
}

export {};

