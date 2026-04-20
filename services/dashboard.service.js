import { getDb } from "../database/db.js";

/* GET DAILY DASHBOARD DATA */
export async function getDailyDashboardData(userId) {
  const db = await getDb();
  
  const todayStr = new Date().toISOString().split("T")[0];
  const datePattern = `${todayStr}%`;

  // 1. Capital en la Calle (Saldo total pendiente de préstamos activos/mora)
  const portfolioResult = await db.getFirstAsync(
    `SELECT SUM(current_balance) as total FROM loans WHERE user_id = ? AND status != 'voided' AND status != 'completed'`,
    [userId]
  );
  
  // 2. Recaudo de Hoy (Lo cobrado efectivamente hoy)
  const paymentsTodayResult = await db.getFirstAsync(
    `SELECT SUM(amount) as total FROM payments WHERE user_id = ? AND created_at LIKE ?`,
    [userId, datePattern]
  );

  // 3. Agenda del Día (Cuotas que vencen hoy y no han sido pagadas)
  const agendaResult = await db.getAllAsync(
    `SELECT 
      li.id,
      li.scheduled_amount as amount,
      li.status,
      c.first_name || ' ' || c.last_name as clientName,
      l.id as loanId
     FROM loan_installments li
     JOIN loans l ON li.loan_id = l.id
     JOIN clients c ON l.client_id = c.id
     WHERE l.user_id = ? AND li.due_date = ? AND li.status IN ('pending', 'partial', 'overdue')`,
    [userId, todayStr]
  );

  // 4. Conteo de Préstamos Activos
  const activeLoansCount = await db.getFirstAsync(
    `SELECT COUNT(*) as count FROM loans WHERE user_id = ? AND status IN ('active', 'mora')`,
    [userId]
  );

  const totalPortfolio = portfolioResult?.total || 0;
  const totalPaymentsToday = paymentsTodayResult?.total || 0;

  // Format currency helper
  const formatMoney = (amount) => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // 5. Historial de operaciones de hoy (Combinado prestamos y pagos)
  const loansForOps = await db.getAllAsync(
    `SELECT 
      l.id as raw_id,
      l.principal_amount as amount,
      c.first_name || ' ' || c.last_name as clientName,
      l.created_at as timeRaw,
      'prestamo' as type
     FROM loans l
     JOIN clients c ON l.client_id = c.id
     WHERE l.user_id = ? AND l.created_at LIKE ?`,
    [userId, datePattern]
  );

  const paymentsForOps = await db.getAllAsync(
    `SELECT 
      p.id as raw_id,
      p.amount as amount,
      c.first_name || ' ' || c.last_name as clientName,
      p.created_at as timeRaw,
      'abono' as type
     FROM payments p
     JOIN loans l ON p.loan_id = l.id
     JOIN clients c ON l.client_id = c.id
     WHERE p.user_id = ? AND p.created_at LIKE ?`,
    [userId, datePattern]
  );

  const combined = [...loansForOps, ...paymentsForOps].sort((a, b) => new Date(b.timeRaw) - new Date(a.timeRaw));

  const operations = combined.map(op => {
    const d = new Date(op.timeRaw);
    let hours = d.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    const mins = d.getMinutes().toString().padStart(2, '0');
    return {
      id: `${op.type}-${op.raw_id}`,
      amount: formatMoney(op.amount),
      clientName: op.clientName,
      time: `${hours}:${mins} ${ampm}`,
      type: op.type
    };
  });

  return {
    summary: {
      portfolioValue: formatMoney(totalPortfolio),
      dailyCollection: formatMoney(totalPaymentsToday),
      activeLoans: activeLoansCount?.count || 0,
      pendingAgendaCount: agendaResult.length
    },
    agenda: agendaResult.map(item => ({
      ...item,
      amount: formatMoney(item.amount)
    })),
    operations
  };
}
