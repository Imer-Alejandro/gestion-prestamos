import { getDb } from "../database/db.js";

/**
 * Servicio centralizado para la generación de datos de reportes.
 * Realiza agregaciones pesadas en la base de datos para mantener la UI fluida.
 */
export const ReportService = {
  /**
   * Obtiene el reporte de préstamos para un periodo determinado.
   */
  async getLoanReport(userId, options) {
    const db = await getDb();
    const range = this._calculateDateRange(options.period, options.startDate, options.endDate);
    const prevRange = this._calculatePreviousDateRange(range);

    // Asegurar que las fechas no sean undefined para SQLite
    const start = range.start || "";
    const end = range.end || "";
    const pStart = prevRange.start || "";
    const pEnd = prevRange.end || "";

    // 1. Métricas Principales (Actual vs Anterior)
    const currentMetrics = await this._getBasicLoanMetrics(db, userId, start, end);
    const prevMetrics = await this._getBasicLoanMetrics(db, userId, pStart, pEnd);

    // 2. Distribución por Estatus (Pie Chart)
    const statusDistribution = await this._getLoanStatusDistribution(db, userId, start, end);

    // 3. Distribución por Tipo de Préstamo (Nuevo)
    const typeDistribution = await this._getLoanTypeDistribution(db, userId, start, end);

    // 4. Distribución por Tiempo (Bar Chart)
    const timeDistribution = await this._getLoanTimeDistribution(db, userId, range);

    // 5. Métricas de Riesgo (PAR, Recovery, Top Debtors)
    const riskMetrics = await this._getRiskMetrics(db, userId);
    const topDebtors = await this._getTopDebtors(db, userId);
    const recoveryRate = await this._getRecoveryRate(db, userId, start, end);

    // 6. Comparativa detallada
    const comparative = {
      growth: prevMetrics.totalAmount > 0 
        ? ((currentMetrics.totalAmount - prevMetrics.totalAmount) / prevMetrics.totalAmount) * 100 
        : 100,
      countGrowth: prevMetrics.totalCount > 0
        ? ((currentMetrics.totalCount - prevMetrics.totalCount) / prevMetrics.totalCount) * 100
        : 100
    };

    return {
      metrics: currentMetrics,
      previousMetrics: prevMetrics,
      statusDistribution,
      typeDistribution,
      timeDistribution,
      riskMetrics,
      topDebtors,
      recoveryRate,
      comparative,
      range
    };
  },

  async _getBasicLoanMetrics(db, userId, start, end) {
    const query = `
      SELECT 
        COUNT(*) as totalCount,
        SUM(principal_amount) as totalAmount,
        SUM(total_interest) as totalInterest,
        AVG(principal_amount) as avgAmount
      FROM loans 
      WHERE user_id = ? AND status != 'voided'
      AND DATE(created_at) BETWEEN DATE(?) AND DATE(?)
    `;
    const result = await db.getFirstAsync(query, [userId, start, end]);
    return {
      totalCount: result?.totalCount || 0,
      totalAmount: result?.totalAmount || 0,
      totalInterest: result?.totalInterest || 0,
      avgAmount: result?.avgAmount || 0
    };
  },

  async _getLoanStatusDistribution(db, userId, start, end) {
    const query = `
      SELECT status, COUNT(*) as count
      FROM loans
      WHERE user_id = ? AND status != 'voided'
      AND DATE(created_at) BETWEEN DATE(?) AND DATE(?)
      GROUP BY status
    `;
    const rows = await db.getAllAsync(query, [userId, start, end]);
    const total = rows.reduce((sum, r) => sum + r.count, 0);
    
    return rows.map(r => ({
      status: r.status,
      count: r.count,
      percentage: total > 0 ? (r.count / total) * 100 : 0
    }));
  },

  async _getLoanTypeDistribution(db, userId, start, end) {
    const query = `
      SELECT loan_type as type, COUNT(*) as count, SUM(principal_amount) as amount
      FROM loans
      WHERE user_id = ? AND status != 'voided'
      AND DATE(created_at) BETWEEN DATE(?) AND DATE(?)
      GROUP BY loan_type
    `;
    const rows = await db.getAllAsync(query, [userId, start, end]);
    return rows;
  },

  async _getLoanTimeDistribution(db, userId, range) {
    const { start, end, type } = range;
    let groupBy = "";
    let format = "";

    // Lógica de agrupación según el tipo de periodo
    if (type === "monthly") {
      groupBy = "STRFTIME('%W', created_at)";
      format = "Sem ";
    } else if (type === "quarterly") {
      groupBy = "STRFTIME('%m', created_at)";
      format = "Mes ";
    } else if (type === "annual") {
      groupBy = "STRFTIME('%m', created_at)";
      format = "Mes ";
    } else {
      const diffDays = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24);
      if (diffDays <= 7) {
        groupBy = "STRFTIME('%d/%m', created_at)";
        format = "";
      } else {
        groupBy = "STRFTIME('%W', created_at)";
        format = "S";
      }
    }

    const query = `
      SELECT ${groupBy} as label, SUM(principal_amount) as amount
      FROM loans
      WHERE user_id = ? AND status != 'voided'
      AND DATE(created_at) BETWEEN DATE(?) AND DATE(?)
      GROUP BY label
      ORDER BY label ASC
      LIMIT 8
    `;
    
    const rows = await db.getAllAsync(query, [userId, start, end]);
    return rows.map(r => ({ ...r, label: `${format}${r.label}` }));
  },

  async _getRiskMetrics(db, userId) {
    const query = `
      SELECT 
        SUM(CASE WHEN status = 'overdue' THEN current_balance ELSE 0 END) as overdueBalance,
        SUM(CASE WHEN status IN ('active', 'overdue') THEN current_balance ELSE 0 END) as totalActiveBalance
      FROM loans
      WHERE user_id = ? AND status != 'voided'
    `;
    const result = await db.getFirstAsync(query, [userId]);
    const overdue = result?.overdueBalance || 0;
    const total = result?.totalActiveBalance || 1; // Evitar division por cero
    return {
      overdueBalance: overdue,
      totalActiveBalance: total,
      parPercentage: (overdue / total) * 100
    };
  },

  async _getTopDebtors(db, userId) {
    const query = `
      SELECT 
        c.first_name, c.last_name, 
        SUM(l.current_balance) as totalDebt,
        COUNT(l.id) as loanCount
      FROM loans l
      JOIN clients c ON l.client_id = c.id
      WHERE l.user_id = ? AND l.status IN ('active', 'overdue')
      GROUP BY c.id
      ORDER BY totalDebt DESC
      LIMIT 3
    `;
    return await db.getAllAsync(query, [userId]);
  },

  async _getRecoveryRate(db, userId, start, end) {
    // Pagos realizados en el periodo (solo pagos activos)
    const paymentsQuery = `
      SELECT SUM(amount) as totalPaid
      FROM payments
      WHERE user_id = ? 
      AND DATE(payment_date) BETWEEN DATE(?) AND DATE(?)
      AND status = 'active'
    `;
    // Cuotas que vencían en el periodo
    const installmentsQuery = `
      SELECT SUM(scheduled_amount) as totalScheduled
      FROM loan_installments i
      JOIN loans l ON i.loan_id = l.id
      WHERE l.user_id = ? 
      AND DATE(i.due_date) BETWEEN DATE(?) AND DATE(?) 
      AND l.status != 'voided'
    `;

    const paidResult = await db.getFirstAsync(paymentsQuery, [userId, start, end]);
    const schedResult = await db.getFirstAsync(installmentsQuery, [userId, start, end]);

    const paid = paidResult?.totalPaid || 0;
    const scheduled = schedResult?.totalScheduled || 0;

    // Si no hay nada programado, la tasa es 0 o 100? Pondremos 0 para evitar inflar.
    const rate = scheduled > 0 ? (paid / scheduled) * 100 : 0;

    return {
      paid,
      scheduled,
      rate
    };
  },

  _calculateDateRange(period, startDate, endDate) {
    const now = new Date();
    let start, end;
    let type = period;

    if (startDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = endDate ? new Date(endDate) : new Date(startDate);
      end.setHours(23, 59, 59, 999);
      type = "custom";
    } else {
      end = new Date();
      start = new Date();
      if (period === "MENSUAL") {
        start.setMonth(now.getMonth() - 1);
        type = "monthly";
      } else if (period === "TRIMESTRAL") {
        start.setMonth(now.getMonth() - 3);
        type = "quarterly";
      } else if (period === "ANUAL") {
        start.setFullYear(now.getFullYear() - 1);
        type = "annual";
      }
    }

    return { 
      start: start.toISOString(), 
      end: end.toISOString(), 
      type 
    };
  },

  _calculatePreviousDateRange(currentRange) {
    const start = new Date(currentRange.start);
    const end = new Date(currentRange.end);
    const diff = end.getTime() - start.getTime();

    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - diff);

    return {
      start: prevStart.toISOString(),
      end: prevEnd.toISOString()
    };
  }
};
