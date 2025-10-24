/// <reference path="./types/env.d.ts" />

import express, { Request as ExpressRequest, Response, NextFunction } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import mainRouter from './index';
import { LocalStorage } from './lib/localStorage';
import { LocalDatabase } from './lib/localDatabase';

// Load environment variables
dotenv.config();

// Load local configuration
const configPath = path.join(__dirname, '..', 'local.config.json');
let config: any = {
    port: 3000,
    dataDir: './data',
    databasePath: './data/yomitan-audio.db',
};

if (fs.existsSync(configPath)) {
    const configFile = fs.readFileSync(configPath, 'utf-8');
    config = { ...config, ...JSON.parse(configFile) };
}

// Override port from environment variable if set
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : config.port;

// Initialize local storage and database
const dataDir = path.resolve(config.dataDir);
const databasePath = path.resolve(config.databasePath);

// Check if database exists
if (!fs.existsSync(databasePath)) {
    console.error(`Database not found at ${databasePath}`);
    console.error('Please run: npm run local:init');
    process.exit(1);
}

const localStorage = new LocalStorage(dataDir);
const localDatabase = new LocalDatabase(databasePath);

// Create a mock Env object for local development
const mockEnv: Env = {
    AUTHENTICATION_ENABLED: process.env.AUTHENTICATION_ENABLED === 'true',
    AWS_POLLY_ENABLED: process.env.AWS_POLLY_ENABLED === 'true',
    API_KEYS: process.env.API_KEYS || '',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
    yomitan_audio_d1_db: {
        prepare: (query: string) => {
            return {
                bind: (...params: any[]) => {
                    return {
                        all: async () => {
                            try {
                                const results = localDatabase.queryAudioEntries(query, params);
                                return {
                                    success: true,
                                    results: results,
                                    meta: {},
                                };
                            } catch (error: any) {
                                return {
                                    success: false,
                                    results: [],
                                    error: error.message,
                                    meta: {},
                                };
                            }
                        },
                    };
                },
            };
        },
    } as any,
    yomitan_audio_r2_bucket: {
        get: async (key: string) => {
            try {
                let buffer: Buffer | null;
                
                if (key.startsWith('tts_files/')) {
                    const tts_identifier = key.replace('tts_files/', '').replace('.mp3', '');
                    buffer = await localStorage.fetchTTSFromLocal(tts_identifier);
                } else {
                    // Parse the key to extract source and file
                    const match = key.match(/^(.+?)_files\/(.+)$/);
                    if (!match) {
                        return null;
                    }
                    const [, source, file] = match;
                    buffer = await localStorage.fetchAudioFromLocal(source, file);
                }
                
                if (!buffer) {
                    return null;
                }
                
                return {
                    blob: async () => {
                        // Convert Buffer to Blob properly
                        const arrayBuffer = buffer.buffer.slice(
                            buffer.byteOffset,
                            buffer.byteOffset + buffer.byteLength
                        ) as ArrayBuffer;
                        return new Blob([arrayBuffer], { type: 'audio/mpeg' });
                    },
                };
            } catch (error) {
                return null;
            }
        },
        put: async (key: string, value: any) => {
            if (key.startsWith('tts_files/')) {
                const tts_identifier = key.replace('tts_files/', '').replace('.mp3', '');
                const arrayBuffer = await value.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                await localStorage.saveTTSToLocal(tts_identifier, buffer);
            }
        },
    } as any,
};

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req: ExpressRequest, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Wrap the itty-router with Express
app.use(async (req: ExpressRequest, res: Response, next: NextFunction) => {
    try {
        // Create a mock Request object that matches itty-router's IRequest interface
        const url = `http://${req.headers.host || 'localhost'}${req.url}`;
        const mockRequest = new Request(url, {
            method: req.method,
            headers: req.headers as any,
        });

        // Add itty-router specific properties
        (mockRequest as any).params = req.params;
        (mockRequest as any).query = req.query;

        // Create a mock ExecutionContext
        const mockContext: ExecutionContext = {
            waitUntil: (promise: Promise<any>) => {
                // In local mode, we'll just handle the promise in the background
                promise.catch(err => console.error('Background task error:', err));
            },
            passThroughOnException: () => {
                // No-op in local mode
            }
        };

        // Call the itty-router
        const response = await mainRouter.fetch(mockRequest, mockEnv, mockContext);

        // Convert the Response to Express response
        const headers: any = {};
        response.headers.forEach((value: string, key: string) => {
            headers[key] = value;
        });

        res.status(response.status);
        Object.keys(headers).forEach((key) => {
            res.setHeader(key, headers[key]);
        });

        // Handle different response types
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const json = await response.json();
            res.json(json);
        } else if (contentType && contentType.includes('audio/mpeg')) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            res.send(buffer);
        } else {
            const text = await response.text();
            res.send(text);
        }
    } catch (error) {
        next(error);
    }
});

// Error handler
app.use((err: any, req: ExpressRequest, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🎵 Yomitan Audio Server Running Locally`);
    console.log(`   → Server: http://localhost:${PORT}`);
    console.log(`   → Data directory: ${dataDir}`);
    console.log(`   → Database: ${databasePath}`);
    console.log(`   → Authentication: ${mockEnv.AUTHENTICATION_ENABLED ? 'Enabled' : 'Disabled'}`);
    console.log(`   → AWS Polly TTS: ${mockEnv.AWS_POLLY_ENABLED ? 'Enabled' : 'Disabled'}`);
    console.log(`\n   Configure Yomitan with:`);
    console.log(`   http://localhost:${PORT}/audio/list?term={term}&reading={reading}${mockEnv.AUTHENTICATION_ENABLED ? '&apiKey=YOUR_API_KEY' : ''}\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    localDatabase.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nShutting down gracefully...');
    localDatabase.close();
    process.exit(0);
});

