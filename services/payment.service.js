import { getDb } from "../database/db.js";
import { 
  getPendingInstallments, 
  applyPaymentToInstallment, 
  refreshInstallmentMora,
  getInstallmentById
} from "./installment.service.js";


/* CREATE PAYMENT (Chronological Installment Distribution) */
export async function createPayment(data) {
  const db = await getDb();
  let remainingPayment = data.amount;
  let totalMoraApplied = 0;

  // 1. Obtener cuotas pendientes/parciales/mora
  const installments = await getPendingInstallments(data.loan_id);

  // 2. Distribuir el pago entre las cuotas
  for (const inst of installments) {
    if (remainingPayment <= 0) break;

    // Asegurar que la mora esté actualizada antes de procesar
    const updatedInst = await refreshInstallmentMora(inst.id);
    
    const totalCuota = updatedInst.scheduled_amount + (updatedInst.late_fee_accrued || 0);
    const pendingInCuota = totalCuota - (updatedInst.amount_paid || 0);

    if (pendingInCuota > 0) {
      const amountToApply = Math.min(remainingPayment, pendingInCuota);
      
      // Registrar cuánto de esto es mora (opcional para el registro de portions)
      // Por simplicidad en este paso, distribuimos el monto total a la cuota
      await applyPaymentToInstallment(inst.id, amountToApply);
      
      remainingPayment -= amountToApply;
    }
  }

  // 3. Registrar el pago en el historial
  const result = await db.runAsync(
    `INSERT INTO payments (
      loan_id, user_id,
      amount,
      payment_method,
      reference_number,
      payment_date,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.loan_id,
      data.user_id,
      data.amount,
      data.payment_method,
      data.reference_number || null,
      data.payment_date,
      new Date().toISOString(),
    ],
  );

  // 4. Actualizar el préstamo
  await db.runAsync(
    `UPDATE loans 
     SET total_paid = total_paid + ?,
         current_balance = current_balance - ?,
         status = CASE WHEN (current_balance - ?) <= 0 THEN 'completed' ELSE status END,
         updated_at = ?
     WHERE id = ?`,
    [data.amount, data.amount, data.amount, new Date().toISOString(), data.loan_id],
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
