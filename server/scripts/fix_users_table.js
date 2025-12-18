const { db, run, all } = require('../src/db/connection');

async function fixUsersTable() {
    console.log('--- Fixing Users Table Constraints ---');

    // 1. Rename existing table
    await run("ALTER TABLE users RENAME TO users_old");

    // 2. Create new table without UNIQUE(username) but with tenant_id logic
    await run(`
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tenant_id INTEGER, 
            full_name TEXT NOT NULL,
            username TEXT NOT NULL, 
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,          
            branch_id INTEGER,           
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT,
            FOREIGN KEY (branch_id) REFERENCES branches(id)
        )
    `);

    // 3. Copy data
    await run(`
        INSERT INTO users (id, tenant_id, full_name, username, password_hash, role, branch_id, is_active, created_at, updated_at)
        SELECT id, tenant_id, full_name, username, password_hash, role, branch_id, is_active, created_at, updated_at
        FROM users_old
    `);

    // 4. Drop old table
    await run("DROP TABLE users_old");

    // 5. Recreate Index
    await run("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_tenant ON users(username, tenant_id)");

    console.log("--- Users table fixed! ---");
}

fixUsersTable().catch(console.error);
