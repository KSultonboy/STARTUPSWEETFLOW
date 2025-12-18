const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const { dbPath } = require('../config/env');

// data/ papkasini yaratamiz, agar yo'q bo'lsa
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// DB ulanishi
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('SQLite ulanishida xatolik:', err.message);
  } else {
    console.log('SQLite databasega ulandik:', dbPath);
  }
});

db.serialize(() => {
  // ==========================================
  // 0) SAAS CORE TABLES (New)
  // ==========================================

  // PLATFORM USERS (SaaS Admins)
  db.run(`
    CREATE TABLE IF NOT EXISTS platform_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'PLATFORM_OWNER',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // PLANS
  db.run(`
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL DEFAULT 0,
      features_json TEXT, -- JSON formatida featurelar
      limits_json TEXT,   -- JSON formatida limitlar
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // TENANTS
  db.run(`
    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE,
      status TEXT DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED
      plan_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (plan_id) REFERENCES plans(id)
    )
  `);

  // Wallet & Billing migration: add columns if they don't exist
  const addColumnIfMissing = (table, columnDef) => {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error(`Error adding column ${columnDef} to ${table}:`, err.message);
      }
    });
  };

  addColumnIfMissing('tenants', `wallet_balance REAL DEFAULT 0`);
  addColumnIfMissing('tenants', `billing_day INTEGER DEFAULT 1`);
  addColumnIfMissing('tenants', `last_billed_at TEXT`);
  addColumnIfMissing('tenants', `unpaid INTEGER DEFAULT 0`);

  // Wallet transactions history
  db.run(`
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'topup'|'charge'|'adjustment'
      amount REAL NOT NULL,
      description TEXT,
      balance_after REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )
  `);


  // TENANT FEATURES (Overrides)
  db.run(`
    CREATE TABLE IF NOT EXISTS tenant_features (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      feature_key TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      config_json TEXT,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )
  `);

  // ==========================================
  // EXISTING TABLES UPDATE (Multi-tenant)
  // ==========================================

  const addTenantIdColumn = (tableName) => {
    db.run(
      `ALTER TABLE ${tableName} ADD COLUMN tenant_id INTEGER`,
      (err) => {
        if (err && !err.message.includes('duplicate column')) {
          console.error(`${tableName} jadvaliga tenant_id qo'shishda xato:`, err.message);
        } else if (!err) {
          // Agar column endi qo'shilgan bo'lsa, default tenant bilan to'ldirish (Migration strategy)
          // Biz default tenant IDsini 1 deb faraz qilamiz (pastda yaratamiz)
          db.run(`UPDATE ${tableName} SET tenant_id = 1 WHERE tenant_id IS NULL`);
        }
      }
    );
  };

  const tablesToUpdate = [
    'branches', 'users', 'products', 'sales', 'sale_items',
    'production_batches', 'production_items', 'warehouse_movements',
    'expenses', 'expense_items', 'transfers', 'transfer_items',
    'returns', 'return_items', 'cash_entries'
  ];

  tablesToUpdate.forEach(addTenantIdColumn);

  // 1) BRANCHES
  db.run(`
    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER, -- Multi-tenant
      name TEXT NOT NULL,
      code TEXT,            
      location TEXT,
      branch_type TEXT NOT NULL DEFAULT 'BRANCH',
      is_active INTEGER DEFAULT 1,
      use_central_stock INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT
    )
  `);

  // 2) USERS
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER, -- Multi-tenant
      full_name TEXT NOT NULL,
      username TEXT NOT NULL, -- Unique constraintni olib tashlaymiz yoki tenant_id bilan birga unique qilamiz (pastda index bor)
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,          
      branch_id INTEGER,           
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT,
      FOREIGN KEY (branch_id) REFERENCES branches(id)
    )
  `);

  // 3) PRODUCTS
  db.run(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER, -- Multi-tenant
    name TEXT NOT NULL,
    barcode TEXT,                -- optional: unique per tenant
    unit TEXT NOT NULL,                
    category TEXT NOT NULL DEFAULT 'PRODUCT', 
    price REAL DEFAULT 0,               
    wholesale_price REAL DEFAULT 0,     
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT
  )
`);
  // ensure barcode column exists if DB was created before this change
  addColumnIfMissing('products', 'barcode TEXT');

  // 4) SALES
  db.run(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER, -- Multi-tenant
      branch_id INTEGER NOT NULL,
      user_id INTEGER,              
      sale_date TEXT NOT NULL,      
      total_amount REAL DEFAULT 0,  
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 5) SALE_ITEMS
  db.run(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER, -- Multi-tenant (denormalized for ease)
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL DEFAULT 0,
      total_price REAL DEFAULT 0,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // 6) PRODUCTION_BATCHES
  db.run(`
    CREATE TABLE IF NOT EXISTS production_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER, -- Multi-tenant
      batch_date TEXT NOT NULL,      
      shift TEXT,                    
      created_by INTEGER,            
      note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // 7) PRODUCTION_ITEMS
  db.run(`
    CREATE TABLE IF NOT EXISTS production_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER, -- Multi-tenant
      batch_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      FOREIGN KEY (batch_id) REFERENCES production_batches(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // 8) WAREHOUSE_MOVEMENTS
  db.run(`
    CREATE TABLE IF NOT EXISTS warehouse_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER, -- Multi-tenant
      product_id INTEGER NOT NULL,
      branch_id INTEGER,             
      movement_type TEXT NOT NULL,   
      source_type TEXT,              
      source_id INTEGER,             
      quantity REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id)
    )
  `);

  // 9) EXPENSES
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER, -- Multi-tenant
      expense_date TEXT NOT NULL,    
      type TEXT NOT NULL,            
      total_amount REAL NOT NULL DEFAULT 0,
      description TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // 10) EXPENSE_ITEMS
  db.run(`
    CREATE TABLE IF NOT EXISTS expense_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER, -- Multi-tenant
      expense_id INTEGER NOT NULL,
      product_id INTEGER,            
      name TEXT,
      quantity REAL,
      unit_price REAL,
      total_price REAL,
      FOREIGN KEY (expense_id) REFERENCES expenses(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // 11) TRANSFERS
  db.run(`
    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER, -- Multi-tenant
      transfer_date TEXT NOT NULL,      
      from_branch_id INTEGER,           
      to_branch_id INTEGER NOT NULL,    
      status TEXT NOT NULL DEFAULT 'PENDING', 
      note TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT,
      FOREIGN KEY (from_branch_id) REFERENCES branches(id),
      FOREIGN KEY (to_branch_id) REFERENCES branches(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // 12) TRANSFER_ITEMS
  db.run(`
    CREATE TABLE IF NOT EXISTS transfer_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER, -- Multi-tenant
      transfer_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING', 
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (transfer_id) REFERENCES transfers(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // 13) RETURNS
  db.run(`
    CREATE TABLE IF NOT EXISTS returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER, -- Multi-tenant
      branch_id INTEGER NOT NULL,        
      return_date TEXT NOT NULL,         
      status TEXT NOT NULL DEFAULT 'PENDING', 
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      created_by INTEGER,
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // 14) RETURN_ITEMS
  db.run(`
    CREATE TABLE IF NOT EXISTS return_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER, -- Multi-tenant
      return_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT,
      reason TEXT,
      FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // 15) CASH ENTRIES
  db.run(`
    CREATE TABLE IF NOT EXISTS cash_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER, -- Multi-tenant
      cash_date TEXT NOT NULL,          
      branch_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT
    )
  `);

  // === MIGRATION & SEEDING (Default Tenant - optional) ===
  // Default tenant faqat SEED_DEFAULT_TENANT=1 bo'lganda yaratiladi
  if (process.env.SEED_DEFAULT_TENANT === '1') {
    db.get("SELECT count(*) as count FROM tenants", (err, row) => {
      if (!err && row.count === 0) {
        console.log("Tenants jadvali bo'sh. Default tenant yaratilmoqda...");
        db.run(`
          INSERT INTO tenants (id, name, slug, status) 
          VALUES (1, 'Ruxshona Tort', 'ruxshona', 'ACTIVE')
        `, (err) => {
          if (!err) {
            console.log("Default tenant ('Ruxshona Tort') yaratildi. ID: 1");
            // Mavjud datani shu tenantga bog'lash
            tablesToUpdate.forEach(tbl => {
              db.run(`UPDATE ${tbl} SET tenant_id = 1 WHERE tenant_id IS NULL OR tenant_id = 0`);
            });
          }
        });
      }
    });
  }

  // Unique index for users within a tenant
  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_tenant ON users(username, tenant_id)`);

});

// Promise asosidagi helperlar
function run(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function get(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

module.exports = {
  db,
  run,
  get,
  all,
};
