const { db, get, run, all } = require('../../db/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../../config/env');

const generateToken = (payload) => {
    return jwt.sign(payload, jwtSecret, { expiresIn: '24h' });
};

// Platform Owner Login
async function login({ email, password }) {
    const user = await get('SELECT * FROM platform_users WHERE email = ?', [email]);
    if (!user) {
        throw new Error('Email yoki parol noto‘g‘ri');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
        throw new Error('Email yoki parol noto‘g‘ri');
    }

    const token = generateToken({
        id: user.id,
        role: user.role, // 'PLATFORM_OWNER'
        tenantId: null // Platform owner doesn't belong to a tenant context usually
    });

    return { token, user: { id: user.id, email: user.email, role: user.role } };
}

// Consolidated Create Tenant (with Admin & Expiry)
async function createTenant({ name, slug, planId, adminFullName, username, password, contractEndDate }) {
    const existing = await get('SELECT id FROM tenants WHERE slug = ?', [slug]);
    if (existing) {
        throw new Error('Bu slug (identifikator) band');
    }

    const now = new Date();
    const billingDay = now.getDate();
    const contractEndDateValue = contractEndDate || (() => {
        const next = new Date(now);
        next.setMonth(next.getMonth() + 1);
        return next.toISOString().slice(0, 10);
    })();

    // 1. Create Tenant
    await run(
        `INSERT INTO tenants (name, slug, plan_id, status, contract_end_date, billing_day) VALUES (?, ?, ?, 'ACTIVE', ?, ?)`,
        [name, slug, planId || null, contractEndDateValue, billingDay]
    );

    const newTenant = await get('SELECT * FROM tenants WHERE slug = ?', [slug]);

    // 2. Create Admin User (if provided)
    if (username && password) {
        // reuse createTenantAdmin logic or call it
        await createTenantAdmin(newTenant.id, {
            fullName: adminFullName || 'Admin',
            username,
            password
        });
    }

    return newTenant;
}

// Get all tenants with Admin Info
async function getTenants() {
    const query = `
        SELECT t.*, 
               u.username as admin_username,
               u.full_name as admin_full_name
        FROM tenants t 
        LEFT JOIN users u ON t.id = u.tenant_id AND u.role = 'TENANT_ADMIN' 
        GROUP BY t.id
    `;
    const tenants = await all(query);
    return tenants;
}

// Create Tenant Admin
async function createTenantAdmin(tenantId, { fullName, username, password }) {
    // Check if username exists in THIS tenant
    const existing = await get('SELECT id FROM users WHERE username = ? AND tenant_id = ?', [username, tenantId]);
    if (existing) {
        throw new Error('Bu username ushbu tenantda band');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Default role 'TENANT_ADMIN'
    await run(
        `INSERT INTO users (tenant_id, full_name, username, password_hash, role, is_active) 
         VALUES (?, ?, ?, ?, 'TENANT_ADMIN', 1)`,
        [tenantId, fullName, username, hashedPassword]
    );

    const newUser = await get('SELECT id, full_name, username, role FROM users WHERE username = ? AND tenant_id = ?', [username, tenantId]);
    return newUser;
}

module.exports = {
    login,
    createTenant,
    getTenants,
    createTenantAdmin,
    updateTenant,
    deleteTenant,
    // Utility features
    resetAdminPassword,
    // Wallet & billing
    getTenantWallet,
    topUpWallet,
    chargeTenant,
    chargeDueTenants
};

async function updateTenant(id, payload) {
    // Fetch current tenant to allow partial updates
    const current = await get('SELECT * FROM tenants WHERE id = ?', [id]);
    if (!current) {
        throw new Error('Tenant topilmadi');
    }

    const {
        name = current.name,
        slug = current.slug,
        planId = current.plan_id,
        contractEndDate = current.contract_end_date,
        status = current.status,
        username,
        password,
        adminFullName
    } = payload || {};

    // If slug changed, ensure uniqueness
    if (slug && slug !== current.slug) {
        const existing = await get('SELECT id FROM tenants WHERE slug = ? AND id != ?', [slug, id]);
        if (existing) throw new Error("Bu slug band");
    }

    await run(
        `UPDATE tenants SET name = ?, slug = ?, plan_id = ?, contract_end_date = ?, status = ? WHERE id = ?`,
        [name, slug, planId || null, contractEndDate || null, status || 'ACTIVE', id]
    );

    // Optionally update tenant admin credentials
    if (username || password || adminFullName) {
        const adminUser = await get(
            `SELECT id, username, full_name FROM users WHERE tenant_id = ? AND role = 'TENANT_ADMIN' LIMIT 1`,
            [id]
        );

        if (adminUser) {
            const updates = [];
            const params = [];

            const newUsername = username || adminUser.username;
            const newFullName = adminFullName || adminUser.full_name;

            // If username changed, ensure uniqueness within tenant
            if (newUsername !== adminUser.username) {
                const existingUser = await get(
                    'SELECT id FROM users WHERE username = ? AND tenant_id = ? AND id != ?',
                    [newUsername, id, adminUser.id]
                );
                if (existingUser) {
                    throw new Error('Bu username ushbu tenantda band');
                }
            }

            if (newFullName && newFullName !== adminUser.full_name) {
                updates.push('full_name = ?');
                params.push(newFullName);
            }

            if (newUsername && newUsername !== adminUser.username) {
                updates.push('username = ?');
                params.push(newUsername);
            }

            if (password && password.trim().length > 0) {
                const hashed = await bcrypt.hash(password, 10);
                updates.push('password_hash = ?');
                params.push(hashed);
            }

            if (updates.length > 0) {
                await run(
                    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
                    [...params, adminUser.id]
                );
            }
        }
    }

    return get('SELECT * FROM tenants WHERE id = ?', [id]);
}

async function deleteTenant(id) {
    // Delete related users first (optional but good practice)
    await run('DELETE FROM users WHERE tenant_id = ?', [id]);
    await run('DELETE FROM tenants WHERE id = ?', [id]);
    return true;
}

// Reset admin password for a tenant: generate a new temporary password, store its hash and return the plaintext
async function resetAdminPassword(tenantId) {
    // Find admin user for tenant
    const user = await get(`SELECT id, username FROM users WHERE tenant_id = ? AND role = 'TENANT_ADMIN' LIMIT 1`, [tenantId]);
    if (!user) throw new Error('Admin topilmadi');

    // Generate random 10-character password
    const newPwd = Math.random().toString(36).slice(-10) + Math.floor(1000 + Math.random()*9000).toString();
    const hashed = await bcrypt.hash(newPwd, 10);

    // Update user's password_hash
    await run(`UPDATE users SET password_hash = ? WHERE id = ?`, [hashed, user.id]);

    return { id: user.id, username: user.username, password: newPwd };
}

// Wallet & Billing functions
async function getTenantWallet(tenantId) {
    const tenant = await get('SELECT id, name, wallet_balance, billing_day, last_billed_at, unpaid, status, plan_id FROM tenants WHERE id = ?', [tenantId]);
    if (!tenant) throw new Error('Tenant topilmadi');

    const plan = tenant.plan_id ? await get('SELECT id, name, price FROM plans WHERE id = ?', [tenant.plan_id]) : null;

    // Get recent transactions
    const txs = await all('SELECT id, type, amount, description, balance_after, created_at FROM wallet_transactions WHERE tenant_id = ? ORDER BY id DESC LIMIT 20', [tenantId]);

    return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        balance: tenant.wallet_balance || 0,
        billingDay: tenant.billing_day || 1,
        lastBilledAt: tenant.last_billed_at || null,
        unpaid: !!tenant.unpaid,
        status: tenant.status,
        plan: plan ? { id: plan.id, name: plan.name, price: plan.price || 0 } : null,
        transactions: txs
    };
}

async function topUpWallet(tenantId, amount) {
    const tenant = await get('SELECT id, wallet_balance, status, plan_id FROM tenants WHERE id = ?', [tenantId]);
    if (!tenant) throw new Error('Tenant topilmadi');

    const newBalance = (tenant.wallet_balance || 0) + Number(amount);
    await run('UPDATE tenants SET wallet_balance = ? WHERE id = ?', [newBalance, tenantId]);

    // record transaction
    await run(
        `INSERT INTO wallet_transactions (tenant_id, type, amount, description, balance_after) VALUES (?, 'topup', ?, 'Top-up via admin', ?)`,
        [tenantId, amount, newBalance]
    );

    // If previously suspended/unpaid, attempt to charge for current plan if possible
    if (tenant.status === 'SUSPENDED' && tenant.plan_id) {
        const plan = await get('SELECT price FROM plans WHERE id = ?', [tenant.plan_id]);
        const price = plan?.price || 0;
        if (newBalance >= price && price > 0) {
            // Charge and reactivate
            await run("UPDATE tenants SET wallet_balance = wallet_balance - ?, last_billed_at = datetime('now') , status = ? , unpaid = 0 WHERE id = ?", [price, 'ACTIVE', tenantId]);
            const balanceAfterCharge = newBalance - price;
            await run(
                `INSERT INTO wallet_transactions (tenant_id, type, amount, description, balance_after) VALUES (?, 'charge', ?, 'Auto-charge after top-up', ?)`,
                [tenantId, price, balanceAfterCharge]
            );
        }
    }

    return getTenantWallet(tenantId);
}

// Charge a single tenant for their plan (if possible), otherwise mark unpaid/suspended
async function chargeTenant(tenant) {
    // tenant is object with id, plan_id, wallet_balance
    const plan = tenant.plan_id ? await get('SELECT id, price FROM plans WHERE id = ?', [tenant.plan_id]) : null;
    const price = plan?.price || 0;

    // Har oylik billing uchun yangi contract_end_date ni hisoblaymiz
    const now = new Date();
    const nextEnd = new Date(now);
    nextEnd.setMonth(nextEnd.getMonth() + 1);
    const nextEndStr = nextEnd.toISOString().slice(0, 10);

    if (price === 0) {
        // Nothing to charge, lekin muddatni yangilab boramiz
        await run(
            "UPDATE tenants SET last_billed_at = datetime('now'), contract_end_date = ? WHERE id = ?",
            [nextEndStr, tenant.id]
        );
        return { charged: false, reason: 'no-price' };
    }

    if ((tenant.wallet_balance || 0) >= price) {
        const newBal = (tenant.wallet_balance || 0) - price;
        await run(
            "UPDATE tenants SET wallet_balance = ?, last_billed_at = datetime('now'), unpaid = 0, status = ?, contract_end_date = ? WHERE id = ?",
            [newBal, 'ACTIVE', nextEndStr, tenant.id]
        );
        await run(
            `INSERT INTO wallet_transactions (tenant_id, type, amount, description, balance_after) VALUES (?, 'charge', ?, 'Monthly billing', ?);`,
            [tenant.id, price, newBal]
        );
        return { charged: true };
    } else {
        // Mark as unpaid/suspended
        await run('UPDATE tenants SET unpaid = 1, status = ? WHERE id = ?', ['SUSPENDED', tenant.id]);
        return { charged: false, reason: 'insufficient_balance' };
    }
}

// Iterate tenants and charge those whose billing day is reached and not charged for this billing period
async function chargeDueTenants() {
    const tenants = await all('SELECT id, wallet_balance, billing_day, last_billed_at, plan_id FROM tenants');
    const now = new Date();

    for (const t of tenants) {
        try {
            const billingDay = t.billing_day || 1;

            const todayDay = now.getDate();

            // If today is before billing day, skip
            if (todayDay < billingDay) continue;

            // If last_billed_at is in the same month and year, skip
            if (t.last_billed_at) {
                const last = new Date(t.last_billed_at);
                if (last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth()) continue;
            }

            // Attempt to charge
            await chargeTenant(t);
        } catch (err) {
            console.error('Error charging tenant', t.id, err.message);
        }
    }
}
