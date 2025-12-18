// server/scripts/reset_tenant_data.js
// Barcha tenantga tegishli ma'lumotlarni o'chirib, faqat platform_users jadvalini qoldiradi.
// Ishlatish: node server/scripts/reset_tenant_data.js

const { db } = require('../src/db/connection');

db.serialize(() => {
  console.log('--- MULTI-TENANT DATA RESET ---');

  const tables = [
    'wallet_transactions',
    'tenant_features',
    'cash_entries',
    'return_items',
    'returns',
    'transfer_items',
    'transfers',
    'expense_items',
    'expenses',
    'warehouse_movements',
    'production_items',
    'production_batches',
    'sale_items',
    'sales',
    'products',
    'branches',
    'users',
    'tenants'
  ];

  db.run('BEGIN TRANSACTION');

  tables.forEach((tbl) => {
    console.log(`Clearing table: ${tbl}`);
    db.run(`DELETE FROM ${tbl}`, (err) => {
      if (err) {
        console.error(`Error clearing ${tbl}:`, err.message);
      }
    });
  });

  db.run('COMMIT', (err) => {
    if (err) {
      console.error('Commit error:', err.message);
    } else {
      console.log('All tenant-related data cleared. platform_users untouched.');
    }
    db.close();
  });
});

