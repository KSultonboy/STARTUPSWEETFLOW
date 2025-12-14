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
  // 1) BRANCHES
  db.run(`
    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE,            -- masalan: XONQA, URGANCH
      location TEXT,
      branch_type TEXT NOT NULL DEFAULT 'BRANCH',  -- BRANCH | OUTLET
      is_active INTEGER DEFAULT 1,
      use_central_stock INTEGER NOT NULL DEFAULT 0, -- 0 = o'z ombori, 1 = markaziy ombor bilan ishlaydi
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT
    )
  `);

  // Eski bazalar uchun: use_central_stock ustunini qo'shish
  db.run(
    `ALTER TABLE branches ADD COLUMN use_central_stock INTEGER NOT NULL DEFAULT 0`,
    (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error(
          "branches jadvaliga use_central_stock ustunini qo'shishda xato:",
          err.message
        );
      }
    }
  );

  // 2) USERS
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,          -- admin, branch, production, director
      branch_id INTEGER,           -- faqat filial userlar uchun
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
    name TEXT NOT NULL,
    unit TEXT NOT NULL,                 -- 'kg' yoki 'piece'
    category TEXT NOT NULL DEFAULT 'PRODUCT',  -- PRODUCT / DECORATION / UTILITY
    price REAL DEFAULT 0,               -- asosiy sotuv narxi (filiallar)
    wholesale_price REAL DEFAULT 0,     -- do'konlarga sotish narxi
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT
  )
`);

  db.run(
    `ALTER TABLE products ADD COLUMN wholesale_price REAL DEFAULT 0`,
    (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error(
          "products jadvaliga wholesale_price ustunini qo'shishda xato:",
          err.message
        );
      }
    }
  );

  // 4) SALES (sotuv "shapkasi")
  db.run(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL,
      user_id INTEGER,              -- kim kiritgan
      sale_date TEXT NOT NULL,      -- YYYY-MM-DD
      total_amount REAL DEFAULT 0,  -- tez hisobot uchun
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 5) SALE_ITEMS (sotuv tarkibi)
  db.run(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL DEFAULT 0,
      total_price REAL DEFAULT 0,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // 6) PRODUCTION_BATCHES (ishlab chiqarish partiyasi)
  db.run(`
    CREATE TABLE IF NOT EXISTS production_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_date TEXT NOT NULL,      -- YYYY-MM-DD
      shift TEXT,                    -- 1-smena, 2-smena...
      created_by INTEGER,            -- users.id
      note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // 7) PRODUCTION_ITEMS (partiya tarkibi)
  db.run(`
    CREATE TABLE IF NOT EXISTS production_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      FOREIGN KEY (batch_id) REFERENCES production_batches(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // 8) WAREHOUSE_MOVEMENTS (ombor kirim/chiqim logi)
  db.run(`
    CREATE TABLE IF NOT EXISTS warehouse_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      branch_id INTEGER,             -- NULL = markaziy ombor, NOT NULL = filial ombori
      movement_type TEXT NOT NULL,   -- IN yoki OUT
      source_type TEXT,              -- production, sale, transfer, return, manual...
      source_id INTEGER,             -- production_batches.id, sales.id va h.k.
      quantity REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id)
    )
  `);

  // 9) EXPENSES (xarajatlar)
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_date TEXT NOT NULL,    -- YYYY-MM-DD
      type TEXT NOT NULL,            -- ingredients, decor, utility
      total_amount REAL NOT NULL DEFAULT 0,
      description TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // 10) EXPENSE_ITEMS (xarajat tarkibi, asosan bezaklar uchun)
  db.run(`
    CREATE TABLE IF NOT EXISTS expense_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_id INTEGER NOT NULL,
      product_id INTEGER,            -- bezaklar uchun product_id
      name TEXT,
      quantity REAL,
      unit_price REAL,
      total_price REAL,
      FOREIGN KEY (expense_id) REFERENCES expenses(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // 11) TRANSFERS (markaziy ombordan filiallarga jo'natmalar)
  db.run(`
    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_date TEXT NOT NULL,      -- YYYY-MM-DD
      from_branch_id INTEGER,           -- NULL = markaziy ombor
      to_branch_id INTEGER NOT NULL,    -- qaysi filialga
      status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, PARTIAL, COMPLETED, CANCELLED
      note TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT,
      FOREIGN KEY (from_branch_id) REFERENCES branches(id),
      FOREIGN KEY (to_branch_id) REFERENCES branches(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // 12) TRANSFER_ITEMS (transfer tarkibi)
  db.run(`
    CREATE TABLE IF NOT EXISTS transfer_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (transfer_id) REFERENCES transfers(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // 13) RETURNS (filialdan markaziy omborga qaytarilgan mahsulotlar headeri)
  db.run(`
    CREATE TABLE IF NOT EXISTS returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL,        -- qaysi filial qaytaryapti
      return_date TEXT NOT NULL,         -- YYYY-MM-DD
      status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      created_by INTEGER,
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // 14) RETURN_ITEMS (qaytish tarkibi)
  db.run(`
    CREATE TABLE IF NOT EXISTS return_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT,
      reason TEXT,
      FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cash_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cash_date TEXT NOT NULL,          -- 'YYYY-MM-DD'
  branch_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  note TEXT,
  created_by INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT
);

  `);

  // === INDEKSLAR ===

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_transfers_to_branch
    ON transfers(to_branch_id, status)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_transfer_items_transfer
    ON transfer_items(transfer_id, status)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_sales_branch_date
    ON sales(branch_id, sale_date)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id
    ON sale_items(sale_id)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_warehouse_product_branch
    ON warehouse_movements(product_id, branch_id)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_returns_branch_date
    ON returns(branch_id, return_date)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_returns_status
    ON returns(status)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_return_items_return
    ON return_items(return_id)
  `);
  db.run(
    `ALTER TABLE branches ADD COLUMN branch_type TEXT NOT NULL DEFAULT 'BRANCH'`,
    (err) => {
      if (err && !err.message.includes("duplicate column")) {
        console.error("branches jadvaliga branch_type qo'shishda xato:", err.message);
      }
    }
  );

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
