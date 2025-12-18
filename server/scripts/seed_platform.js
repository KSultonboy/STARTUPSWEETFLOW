const { db, run, get } = require('../src/db/connection');
const bcrypt = require('bcryptjs');

async function seedPlatform() {
    try {
        const existing = await get("SELECT * FROM platform_users WHERE email = ?", ['admin@sweetflow.uz']);
        if (existing) {
            console.log('Platform User already exists');
            return;
        }

        const passwordHash = await bcrypt.hash('admin123', 10);
        await run(`
            INSERT INTO platform_users (email, password_hash, role, is_active)
            VALUES (?, ?, 'PLATFORM_OWNER', 1)
        `, ['admin@sweetflow.uz', passwordHash]);

        console.log('Platform User created: admin@sweetflow.uz / admin123');
    } catch (err) {
        console.error('Seed Error:', err);
    }
}

seedPlatform();
