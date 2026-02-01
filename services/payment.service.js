import { getDb } from "../database/db.js";

/* CREATE PAYMENT */
export async function createPayment(data) {
  const db = await getDb();

  const result = await db.runAsync(
    `INSERT INTO payments (
      loan_id, user_id,
      amount,
      capital_portion,
      interest_portion,
      late_fee_portion,
      payment_method,
      reference_number,
      payment_date,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.loan_id,
      data.user_id,
      data.amount,
      data.capital_portion,
      data.interest_portion,
      data.late_fee_portion,
      data.payment_method,
      data.reference_number,
      data.payment_date,
      new Date().toISOString(),
    ],
  );

  /* ACTUALIZAR TOTAL PAGADO */
  await db.runAsync(
    `UPDATE loans 
     SET total_paid = total_paid + ?
     WHERE id = ?`,
    [data.amount, data.loan_id],
  );

  return result.lastInsertRowId;
}

/* GET PAYMENTS BY LOAN */
export async function getPaymentsByLoan(loanId) {
  const db = await getDb();
  return await db.getAllAsync(`SELECT * FROM payments WHERE loan_id = ?`, [
    loanId,
  ]);
}
