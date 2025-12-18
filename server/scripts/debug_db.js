const { db } = require('../src/db/connection');

db.serialize(() => {
    console.log("--- Checking USERS table indices ---");
    db.all("PRAGMA index_list('users')", (err, rows) => {
        if (err) console.error(err);
        else console.log(rows);
    });

    console.log("--- Checking TENANTS table ---");
    db.all("SELECT * FROM tenants", (err, rows) => {
        if (err) console.error(err);
        else console.log(rows);
    });
});
