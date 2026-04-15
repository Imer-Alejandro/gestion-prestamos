import { getDb } from "../database/db.js";

/* CREATE PAYMENT */
export async function createPayment(data) {
  const db = await getDb();

  // Por ahora, asumir que todo el pago va a capital
  const capitalPortion = data.amount;
  const interestPortion = 0;
  const lateFeePortion = 0;

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
      capitalPortion,
      interestPortion,
      lateFeePortion,
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

  /* ACTUALIZAR BALANCE ACTUAL */
  await db.runAsync(
    `UPDATE loans 
     SET current_balance = current_balance - ?
     WHERE id = ?`,
    [capitalPortion, data.loan_id],
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

/* GET ALL PAYMENTS FOR A USER */
export async function getAllPayments(userId) {
  const db = await getDb();
  return await db.getAllAsync(
    `SELECT 
      p.*, 
      c.first_name || ' ' || c.last_name as client_name,
      l.contract_number as loan_contract_number
    FROM payments p
    JOIN loans l ON p.loan_id = l.id
    JOIN clients c ON l.client_id = c.id
    WHERE p.user_id = ?
    ORDER BY p.payment_date DESC, p.created_at DESC`,
    [userId]
  );
}
