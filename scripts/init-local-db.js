#!/usr/bin/env node

/**
 * Initialize local SQLite database for Yomitan Audio Server
 * This script reads the SQL dump file and imports it into a SQLite database
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SQL_FILE = path.join(DATA_DIR, 'entry_and_pitch_db.sql');
const DB_FILE = path.join(DATA_DIR, 'yomitan-audio.db');
const TTS_DIR = path.join(DATA_DIR, 'tts_files');

console.log('🗄️  Initializing local Yomitan audio database...\n');

// Check if SQL file exists
if (!fs.existsSync(SQL_FILE)) {
    console.error(`❌ Error: SQL file not found at ${SQL_FILE}`);
    console.error('   Please download the audio data and place entry_and_pitch_db.sql in the data folder.');
    console.error('   See README.md for instructions.');
    process.exit(1);
}

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Create TTS directory if it doesn't exist
if (!fs.existsSync(TTS_DIR)) {
    fs.mkdirSync(TTS_DIR, { recursive: true });
    console.log(`✓ Created TTS cache directory: ${TTS_DIR}`);
}

// Remove existing database if it exists
if (fs.existsSync(DB_FILE)) {
    console.log(`⚠️  Existing database found at ${DB_FILE}`);
    console.log('   Removing old database...');
    fs.unlinkSync(DB_FILE);
}

console.log(`📖 Reading SQL file: ${SQL_FILE}`);
const sqlContent = fs.readFileSync(SQL_FILE, 'utf-8');

console.log('🔨 Creating new SQLite database...');
const db = new Database(DB_FILE);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

console.log('📊 Importing data into database...');

try {
    // Split SQL content into individual statements
    // Handle both semicolon-separated statements and multi-line INSERT statements
    const statements = [];
    let currentStatement = '';
    let inString = false;
    let stringChar = null;
    
    for (let i = 0; i < sqlContent.length; i++) {
        const char = sqlContent[i];
        const prevChar = i > 0 ? sqlContent[i - 1] : null;
        
        // Track if we're inside a string literal
        if ((char === '"' || char === "'") && prevChar !== '\\') {
            if (!inString) {
                inString = true;
                stringChar = char;
            } else if (char === stringChar) {
                inString = false;
                stringChar = null;
            }
        }
        
        currentStatement += char;
        
        // Check for statement end (semicolon not in a string)
        if (char === ';' && !inString) {
            const trimmed = currentStatement.trim();
            if (trimmed && !trimmed.startsWith('--')) {
                statements.push(trimmed);
            }
            currentStatement = '';
        }
    }
    
    // Add any remaining statement
    if (currentStatement.trim() && !currentStatement.trim().startsWith('--')) {
        statements.push(currentStatement.trim());
    }
    
    console.log(`   Found ${statements.length} SQL statements`);
    
    // Execute statements in a transaction for performance
    const insertMany = db.transaction((statements) => {
        let executed = 0;
        let lastPercent = -1;
        
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            
            // Skip empty statements and comments
            if (!stmt || stmt.startsWith('--')) continue;
            
            try {
                db.exec(stmt);
                executed++;
                
                // Show progress every 10%
                const percent = Math.floor((i / statements.length) * 100);
                if (percent !== lastPercent && percent % 10 === 0) {
                    process.stdout.write(`\r   Progress: ${percent}%`);
                    lastPercent = percent;
                }
            } catch (err) {
                // Log error but continue with other statements
                if (process.env.DEBUG) {
                    console.error(`\n   Warning: Failed to execute statement: ${err.message}`);
                    console.error(`   Statement: ${stmt.substring(0, 100)}...`);
                }
            }
        }
        
        process.stdout.write(`\r   Progress: 100%\n`);
        return executed;
    });
    
    const executedCount = insertMany(statements);
    console.log(`✓ Successfully executed ${executedCount} SQL statements`);
    
} catch (error) {
    console.error(`\n❌ Error importing data: ${error.message}`);
    db.close();
    process.exit(1);
}

// Verify the database
console.log('\n🔍 Verifying database...');

try {
    const entriesCount = db.prepare('SELECT COUNT(*) as count FROM entries').get();
    console.log(`   ✓ Audio entries: ${entriesCount.count.toLocaleString()}`);
    
    const pitchCount = db.prepare('SELECT COUNT(*) as count FROM pitch_accents').get();
    console.log(`   ✓ Pitch accents: ${pitchCount.count.toLocaleString()}`);
    
} catch (error) {
    console.error(`   ⚠️  Warning: Could not verify all tables: ${error.message}`);
}

db.close();

console.log('\n✅ Database initialization complete!');
console.log(`   Database location: ${DB_FILE}`);
console.log('\n   You can now run: npm run local:dev');

