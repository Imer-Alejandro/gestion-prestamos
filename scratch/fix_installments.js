const SQLite = require('expo-sqlite/node');

async function fix() {
  try {
    const db = await SQLite.openDatabaseAsync("loan_manager.db");
    console.log("Conectado a la base de datos");
    
    const result = await db.runAsync(
      "UPDATE loan_installments SET remaining_interest = interest_amount WHERE status = 'pending' AND amount_paid = 0"
    );
    console.log("Intereses actualizados:", result.changes);

    const result2 = await db.runAsync(
      "UPDATE loan_installments SET remaining_capital = capital_amount WHERE status = 'pending' AND amount_paid = 0"
    );
    console.log("Capital actualizado:", result2.changes);

  } catch (e) {
    console.error(e);
  }
}

fix();
