import { getDb } from "../database/db.js";

/* CREATE LOAN */
export async function createLoan(data) {
  const db = await getDb();

  const result = await db.runAsync(
    `INSERT INTO loans (
      user_id, client_id,
      contract_number,
      loan_type,
      principal_amount, disbursed_amount,
      interest_rate, interest_calculation_base,
      late_fee_type, late_fee_value,
      start_date, due_date,
      payment_frequency,
      grace_days,
      status,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.user_id,
      data.client_id,
      data.contract_number,
      data.loan_type || 'personal',
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
