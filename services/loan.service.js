import { getDb } from "../database/db.js";

/* CREATE LOAN */
export async function createLoan(data) {
  const db = await getDb();

  const result = await db.runAsync(
    `INSERT INTO loans (
    user_id,  

    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.user_id,
      data.client_id,
      data.contract_number,
      data.loan_type || "personal",
      data.principal_amount,
      data.disbursed_amount,
      data.interest_rate,
      data.interest_calculation_base,
      data.late_fee_type,
      data.late_fee_value,
      data.start_date,
      data.due_date,
      data.payment_frequency,
      data.grace_days,
      "active",
      new Date().toISOString(),
    ],
  );

  return result.lastInsertRowId;
}

/* GET LOANS BY USER */
export async function getLoans(userId) {
  const db = await getDb();
  return await db.getAllAsync(`SELECT * FROM loans WHERE user_id = ?`, [
    userId,
  ]);
}

/* UPDATE STATUS */
export async function updateLoanStatus(id, status) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE loans SET status = ?, updated_at = ? WHERE id = ?`,
    [status, new Date().toISOString(), id],
  );
}
