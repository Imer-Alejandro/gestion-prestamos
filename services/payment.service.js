import { getDb } from "../database/db.js";
import {
  getPendingInstallments,
  applyPaymentToInstallment,
  refreshInstallmentMora,
  getInstallmentById
} from "./installment.service.js";
import { PlanManager } from "./quota.service.js";


/* CREATE PAYMENT (Chronological Installment Distribution) */
export async function createPayment(data) {
  // ── Validación de cuota ──────────────────────────────────
  const actionType = data.replace_payment_id ? 'editPayment' : 'registerPayment';
  const quotaCheck = await PlanManager.canExecute(data.user_id, actionType);
  if (!quotaCheck.allowed) throw new Error(quotaCheck.reason);
  // ─────────────────────────────────────────────────────────

  const db = await getDb();

  // Si es una edición, anular el pago previo primero de forma atómica
  if (data.replace_payment_id) {
    await voidPayment(data.replace_payment_id);
    // Cambiar a 'replaced' para diferenciar de una anulación manual
    await db.runAsync(
      `UPDATE payments SET status = 'replaced', updated_at = ? WHERE id = ?`,
      [new Date().toISOString(), data.replace_payment_id]
    );
  }

  let remainingPayment = data.amount;
  let totalMoraApplied = 0;

  const distributions = [];


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

      await applyPaymentToInstallment(inst.id, amountToApply);

      distributions.push({
        installment_id: inst.id,
        amount: amountToApply
      });

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
      created_at,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
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

  const paymentId = result.lastInsertRowId;

  // 3.5. Guardar la bitácora de reparto
  const now = new Date().toISOString();
  for (const dist of distributions) {
    await db.runAsync(
      `INSERT INTO payment_distributions (payment_id, installment_id, amount, created_at)
       VALUES (?, ?, ?, ?)`,
      [paymentId, dist.installment_id, dist.amount, now]
    );
  }


  // 4. Actualizar el préstamo
  await db.runAsync(
    `UPDATE loans 
     SET total_paid = ROUND(total_paid + ?, 2),
         current_balance = MAX(0, ROUND(current_balance - ?, 2)),
         status = CASE WHEN ROUND(current_balance - ?, 2) <= 0 THEN 'completed' ELSE status END,
         updated_at = ?
     WHERE id = ?`,
    [data.amount, data.amount, data.amount, new Date().toISOString(), data.loan_id],
  );


  // Notificación de éxito (Feedback inmediato silencioso)
  try {
    const { sendLocalNotification } = await import("./notification.service");
    await sendLocalNotification(
      "✅ Cobro Registrado",
      `Se han recibido $${data.amount.toLocaleString()} exitosamente.`,
      { screen: '/prestamos_abonos', params: { initialTab: 'abonos' } },
      data.user_id,
      'success',
      true // Silent: solo interna
    );
  } catch (error) {
    console.error("Error enviando notificación de pago:", error);
  }

  // ── Registrar operación exitosa ──────────────────────────
  await PlanManager.registerOperation(data.user_id, actionType);
  // ─────────────────────────────────────────────────────────

  return result.lastInsertRowId;
}


/* GET PAYMENTS BY LOAN (Only active) */
export async function getPaymentsByLoan(loanId) {
  const db = await getDb();
  return await db.getAllAsync(
    `SELECT * FROM payments 
     WHERE loan_id = ? AND status = 'active'
     ORDER BY payment_date DESC, created_at DESC`,
    [loanId]
  );
}


/* GET ALL PAYMENTS FOR A USER (Only active for display) */
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
    WHERE p.user_id = ? AND p.status = 'active'
    ORDER BY p.payment_date DESC, p.created_at DESC`,
    [userId]
  );
}



/* VOID PAYMENT (With reversal) */
export async function voidPayment(paymentId, userId = null) {
  const db = await getDb();

  // ── Validación de cuota (solo cuando es anulación manual, no interna) ──
  if (userId) {
    const quotaCheck = await PlanManager.canExecute(userId, 'deletePayment');
    if (!quotaCheck.allowed) throw new Error(quotaCheck.reason);
  }
  // ─────────────────────────────────────────────────────────

  // 1. Obtener datos del pago
  const payment = await db.getFirstAsync(`SELECT * FROM payments WHERE id = ?`, [paymentId]);
  if (!payment) throw new Error("Pago no encontrado");
  if (payment.status !== 'active') throw new Error("Este pago ya ha sido anulado o reemplazado");

  // 2. Validar regla de 24 horas
  const createdAt = new Date(payment.created_at);
  const now = new Date();
  const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

  if (diffHours > 24) {
    throw new Error("No se pueden anular pagos registrados hace más de 24 horas");
  }

  // 3. Obtener bitácora de reparto
  const distributions = await db.getAllAsync(
    `SELECT * FROM payment_distributions WHERE payment_id = ?`,
    [paymentId]
  );

  // 4. Revertir impacto en cada cuota
  for (const dist of distributions) {
    const instId = dist.installment_id;
    const amountToReverse = dist.amount;

    await db.runAsync(
      `UPDATE loan_installments 
       SET amount_paid = MAX(0, amount_paid - ?),
           status = CASE 
                      WHEN (MAX(0, amount_paid - ?)) <= 0 THEN 'pending' 
                      ELSE 'partial' 
                    END,
           updated_at = ?
       WHERE id = ?`,
      [amountToReverse, amountToReverse, new Date().toISOString(), instId]
    );

    // Si la cuota tenía mora aplicada, refresh para asegurar que vuelva a overdue si aplica
    await refreshInstallmentMora(instId);
  }

  // 5. Revertir impacto en el préstamo
  await db.runAsync(
    `UPDATE loans
     SET total_paid = MAX(0, ROUND(total_paid - ?, 2)),
         current_balance = ROUND(current_balance + ?, 2),
         status = 'active', -- Siempre regresa a activo al anular un pago
         updated_at = ?
     WHERE id = ?`,
    [payment.amount, payment.amount, new Date().toISOString(), payment.loan_id]
  );


  // 6. Marcar pago como anulado
  await db.runAsync(
    `UPDATE payments SET status = 'voided', updated_at = ? WHERE id = ?`,
    [new Date().toISOString(), paymentId]
  );

  // ── Registrar operación exitosa ──────────────────────────
  if (userId) await PlanManager.registerOperation(userId, 'deletePayment');
  // ─────────────────────────────────────────────────────────

  return { success: true };
}

/* GET PAYMENT BY ID */
export async function getPaymentById(id) {
  const db = await getDb();
  return await db.getFirstAsync(`SELECT * FROM payments WHERE id = ?`, [id]);
}

