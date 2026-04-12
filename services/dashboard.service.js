import { getDb } from "../database/db.js";

export async function getDailyDashboardData(userId) {
  const db = await getDb();
  
  // Prefix for today's date (YYYY-MM-DD), compatible with toISOString() 
  // which is how the existing services save created_at
  const todayStr = new Date().toISOString().split("T")[0];
  const datePattern = `${todayStr}%`;

  // 1. Total loans (general)
  const loansResult = await db.getFirstAsync(
    `SELECT SUM(disbursed_amount) as total FROM loans WHERE user_id = ?`,
    [userId]
  );
  
  // 2. Total payments (general)
  const paymentsResult = await db.getFirstAsync(
    `SELECT SUM(amount) as total FROM payments WHERE user_id = ?`,
    [userId]
  );

  const totalLoans = loansResult?.total || 0;
  const totalPayments = paymentsResult?.total || 0;

  // Format currency
  const formatMoney = (amount) => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // 3. Combined operations (loans and payments)
  const loansForOps = await db.getAllAsync(
    `SELECT 
      l.id as raw_id,
      l.disbursed_amount as amount,
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

  // Combine and sort by recent time
  const combined = [...loansForOps, ...paymentsForOps].sort((a, b) => {
    return new Date(b.timeRaw) - new Date(a.timeRaw);
  });

  // Map to UI shape
  const operations = combined.map(op => {
    const d = new Date(op.timeRaw);
    let hours = d.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const mins = d.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${mins} ${ampm}`;

    return {
      id: `${op.type}-${op.raw_id}`,
      amount: formatMoney(op.amount),
      clientName: op.clientName,
      time: timeStr,
      type: op.type
    };
  });

  return {
    dailyTotals: {
      loans: formatMoney(totalLoans),
      payments: formatMoney(totalPayments),
    },
    operations
  };
}
