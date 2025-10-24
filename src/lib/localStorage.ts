import { promises as fs } from 'fs';
import * as path from 'path';
import { StatusError } from 'itty-router';

export class LocalStorage {
    private dataDir: string;

    constructor(dataDir: string) {
        this.dataDir = dataDir;
    }

    async fetchAudioFromLocal(source: string, file: string): Promise<Buffer> {
        const filePath = path.join(this.dataDir, `${source}_files`, file);
        
        try {
            const audioData = await fs.readFile(filePath);
            return audioData;
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                throw new StatusError(404, 'File not found');
            }
            throw new StatusError(500, `Failed to read audio file: ${error.message}`);
        }
    }

    async fetchTTSFromLocal(tts_identifier: string): Promise<Buffer | null> {
        const filePath = path.join(this.dataDir, 'tts_files', `${tts_identifier}.mp3`);
        
        try {
            const audioData = await fs.readFile(filePath);
            return audioData;
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw new StatusError(500, `Failed to read TTS file: ${error.message}`);
        }
    }

    async saveTTSToLocal(tts_identifier: string, mp3: Buffer): Promise<boolean> {
        const ttsDir = path.join(this.dataDir, 'tts_files');
        const filePath = path.join(ttsDir, `${tts_identifier}.mp3`);
        
        try {
            // Ensure the TTS directory exists
            await fs.mkdir(ttsDir, { recursive: true });
            
            // Write the file
            await fs.writeFile(filePath, mp3);
            return true;
        } catch (error: any) {
            throw new StatusError(500, `Failed to save TTS file: ${error.message}`);
        }
    }
}

