const { getDb, initializeDatabase } = require('./database/db.js');

async function verifySchema() {
  try {
    console.log("Initializing database...");
    await initializeDatabase();
    const db = await getDb();

    const tables = ['users', 'organizations', 'clients', 'loans', 'payments', 'loan_installments', 'activity_logs', 'sync_metadata'];

    for (const table of tables) {
      console.log(`\n--- Table: ${table} ---`);
      const info = await db.getAllAsync(`PRAGMA table_info(${table});`);
      info.forEach(col => {
        console.log(`  Column: ${col.name} (${col.type})`);
      });
    }

    console.log("\n✅ Schema verification completed.");
  } catch (error) {
    console.error("❌ Schema verification failed:", error);
  }
}

verifySchema();
