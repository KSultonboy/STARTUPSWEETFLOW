const { db } = require('../db/connection');

db.serialize(() => {
    console.log("Adding contract_end_date to tenants table...");
    db.run("ALTER TABLE tenants ADD COLUMN contract_end_date TEXT", (err) => {
        if (err) {
            if (err.message.includes("duplicate column")) {
                console.log("Column already exists.");
            } else {
                console.error("Error adding column:", err.message);
            }
        } else {
            console.log("Column added successfully.");
        }
    });
});
