// server/src/modules/history/history.repository.js
const { all } = require('../../db/connection');

/**
 * Umumiy tarix:
 *  - Sotuvlar (sales)
 *  - Ishlab chiqarish (production_batches)
 *  - Transferlar (transfers)
 *  - Vazvratlar (returns)
 *
 * Qaytadigan ustunlar:
 *  - id
 *  - type: 'sale' | 'production' | 'transfer' | 'return'
 *  - activity_date
 *  - branch_name
 *  - description
 *  - amount (agar mavjud bo'lsa, aks holda null)
 *  - status  (transfer / return uchun; boshqalar NULL)
 */
async function getActivities({ limit, offset, type, dateFrom, dateTo, branchId }) {
  const unionParts = [];
  let params = [];

  /* ----------------------------------------------------
     1) SALES (sotuvlar)
  ----------------------------------------------------- */
  if (type === 'all' || type === 'sale') {
    const conds = [];
    const p = [];

    if (dateFrom) {
      conds.push('s.sale_date >= ?');
      p.push(dateFrom);
    }
    if (dateTo) {
      conds.push('s.sale_date <= ?');
      p.push(dateTo);
    }

    if (branchId && branchId !== 'all') {
      conds.push('s.branch_id = ?');
      p.push(branchId);
    }

    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

    unionParts.push(`
      SELECT
        s.id AS id,
        'sale' AS type,
        s.sale_date AS activity_date,
        b.name AS branch_name,
        printf('Sotuv #%d', s.id) AS description,
        s.total_amount AS amount,
        NULL AS status              -- sales jadvalida status bo'lmasa ham xato bermaydi
      FROM sales s
      LEFT JOIN branches b ON b.id = s.branch_id
      ${where}
    `);

    params = params.concat(p);
  }

  /* ----------------------------------------------------
     2) PRODUCTION (production_batches)
  ----------------------------------------------------- */
  if (type === 'all' || type === 'production') {
    const conds = [];
    const p = [];

    if (dateFrom) {
      conds.push('pb.batch_date >= ?');
      p.push(dateFrom);
    }
    if (dateTo) {
      conds.push('pb.batch_date <= ?');
      p.push(dateTo);
    }

    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

    unionParts.push(`
      SELECT
        pb.id AS id,
        'production' AS type,
        pb.batch_date AS activity_date,
        NULL AS branch_name,
        printf('Ishlab chiqarish #%d', pb.id) AS description,
        NULL AS amount,
        NULL AS status              -- pb.status USTUNI YO'Q, shu uchun NULL
      FROM production_batches pb
      ${where}
    `);

    params = params.concat(p);
  }

  /* ----------------------------------------------------
     3) TRANSFERLAR
  ----------------------------------------------------- */
  if (type === 'all' || type === 'transfer') {
    const conds = [];
    const p = [];

    if (dateFrom) {
      conds.push('DATE(t.created_at) >= ?');
      p.push(dateFrom);
    }
    if (dateTo) {
      conds.push('DATE(t.created_at) <= ?');
      p.push(dateTo);
    }

    if (branchId && branchId !== 'all') {
      if (branchId === 'central') {
        conds.push('(t.from_branch_id IS NULL OR t.to_branch_id IS NULL)');
      } else {
        conds.push('(t.from_branch_id = ? OR t.to_branch_id = ?)');
        p.push(branchId, branchId);
      }
    }

    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

    unionParts.push(`
      SELECT
        t.id AS id,
        'transfer' AS type,
        DATE(t.created_at) AS activity_date,
        printf('%s → %s',
          IFNULL(bf.name, 'Markaziy ombor'),
          IFNULL(bt.name, 'Markaziy ombor')
        ) AS branch_name,
        printf('Transfer #%d', t.id) AS description,
        NULL AS amount,
        t.status AS status
      FROM transfers t
      LEFT JOIN branches bf ON bf.id = t.from_branch_id
      LEFT JOIN branches bt ON bt.id = t.to_branch_id
      ${where}
    `);

    params = params.concat(p);
  }

  /* ----------------------------------------------------
     4) RETURNS (VAZVRATLAR)
  ----------------------------------------------------- */
  if (type === 'all' || type === 'return') {
    const conds = [];
    const p = [];

    if (dateFrom) {
      conds.push('r.return_date >= ?');
      p.push(dateFrom);
    }
    if (dateTo) {
      conds.push('r.return_date <= ?');
      p.push(dateTo);
    }

    if (branchId && branchId !== 'all') {
      conds.push('r.branch_id = ?');
      p.push(branchId);
    }

    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

    unionParts.push(`
      SELECT
        r.id AS id,
        'return' AS type,
        r.return_date AS activity_date,
        b.name AS branch_name,
        COALESCE(r.comment, 'Vazvrat') AS description,
        NULL AS amount,
        r.status AS status
      FROM returns r
      LEFT JOIN branches b ON b.id = r.branch_id
      ${where}
    `);

    params = params.concat(p);
  }

  if (!unionParts.length) {
    return [];
  }

  const sql = `
    ${unionParts.join('\nUNION ALL\n')}
    ORDER BY activity_date DESC, id DESC
    LIMIT ? OFFSET ?
  `;

  params.push(limit, offset);

  const rows = await all(sql, params);
  return rows;
}

module.exports = {
  getActivities,
};
