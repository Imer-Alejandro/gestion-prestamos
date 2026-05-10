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

    // 5. Métricas de Riesgo y Eficiencia
    const riskMetrics = await this._getRiskMetrics(db, userId);
    const arrearsAging = await this._getArrearsAging(db, userId);
    const topDebtors = await this._getTopDebtors(db, userId, start, end);
    const recoveryRate = await this._getRecoveryRate(db, userId, start, end);
    const efficiency = await this._getPortfolioEfficiency(db, userId);
    const flowEfficiency = await this._getFlowEfficiency(db, userId, start, end);

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
      arrearsAging,
      topDebtors,
      recoveryRate,
      efficiency,
      flowEfficiency,
      comparative,
      range
    };
  },

  /**
   * Obtiene el reporte de ganancias para un periodo determinado.
   */
  async getProfitReport(userId, options) {
    const db = await getDb();
    const range = this._calculateDateRange(options.period, options.startDate, options.endDate);
    const prevRange = this._calculatePreviousDateRange(range);

    const start = range.start || "";
    const end = range.end || "";
    const pStart = prevRange.start || "";
    const pEnd = prevRange.end || "";

    // 1. Métricas de Utilidad (Actual vs Anterior)
    const currentMetrics = await this._getProfitMetrics(db, userId, start, end);
    const prevMetrics = await this._getProfitMetrics(db, userId, pStart, pEnd);

    // 2. ROI y Eficiencia Operativa
    const roi = await this._getROI(db, userId, start, end);
    const efficiency = await this._getCollectionEfficiency(db, userId, start, end);

    // 3. Embudo de Cobros
    const funnel = await this._getCollectionFunnel(db, userId, start, end);

    // 4. Proyecciones vs Realidad
    const projections = await this._getProfitProjections(db, userId, range);

    // 5. Distribución por Fuente de Ingreso
    const revenueSources = await this._getRevenueSources(db, userId, start, end);

    // 7. Distribución por Método de Pago
    const paymentMethods = await this._getPaymentMethodDistribution(db, userId, start, end);

    // 8. Rentabilidad por Tipo de Préstamo
    const profitByType = await this._getProfitByType(db, userId, start, end);

    // 9. Top Clientes Rentables
    const topProfitableClients = await this._getTopProfitableClients(db, userId, start, end);

    // 6. Comparativa de Periodos
    const comparative = {
      profitGrowth: prevMetrics.netProfit > 0 
        ? ((currentMetrics.netProfit - prevMetrics.netProfit) / prevMetrics.netProfit) * 100 
        : 100,
      roiDiff: roi.current - roi.previous
    };

    return {
      metrics: currentMetrics,
      previousMetrics: prevMetrics,
      roi,
      efficiency,
      funnel,
      projections,
      revenueSources,
      paymentMethods,
      profitByType,
      topProfitableClients,
      comparative,
      range
    };
  },

  /**
   * Obtiene el reporte detallado de clientes.
   */
  async getClientReport(userId, options) {
    const db = await getDb();
    const range = this._calculateDateRange(options.period, options.startDate, options.endDate);
    
    const start = range.start || "";
    const end = range.end || "";

    // 1. Métricas Generales
    const metrics = await this._getClientMetrics(db, userId, start, end);

    // 2. Tendencia de Adquisición (Nuevos clientes)
    const growthTrend = await this._getClientGrowthTrend(db, userId, range);

    // 3. Distribución Demográfica (Género)
    const genderDistribution = await this._getClientGenderDistribution(db, userId, start, end);

    // 4. Distribución por Ocupación
    const occupationDistribution = await this._getClientOccupationDistribution(db, userId, start, end);

    // 5. Distribución Geográfica (Provincias)
    const geographicDistribution = await this._getClientGeographicDistribution(db, userId, start, end);

    // 7. Distribución por Edad
    const ageDistribution = await this._getClientAgeDistribution(db, userId, start, end);

    // 8. Segmentación por Calidad Crediticia (A, B, C)
    const qualitySegmentation = await this._getClientQualitySegmentation(db, userId, start, end);

    // 9. Distribución de Ingresos
    const incomeDistribution = await this._getClientIncomeDistribution(db, userId, start, end);

    // 6. Top Clientes por Puntualidad (Fidelidad)
    const topLoyalClients = await this._getTopLoyalClients(db, userId, start, end);

    return {
      metrics,
      growthTrend,
      genderDistribution,
      occupationDistribution,
      geographicDistribution,
      ageDistribution,
      qualitySegmentation,
      incomeDistribution,
      topLoyalClients,
      range
    };
  },

  async _getClientQualitySegmentation(db, userId, start, end) {
    // Calculamos según la mora histórica de sus préstamos
    const query = `
      SELECT 
        CASE 
          WHEN max_late_fee IS NULL THEN 'Sin Historial'
          WHEN max_late_fee = 0 THEN 'Clase A'
          WHEN max_late_fee < 1000 THEN 'Clase B'
          ELSE 'Clase C'
        END as label,
        COUNT(*) as count
      FROM (
        SELECT c.id, MAX(l.total_late_fees) as max_late_fee
        FROM clients c
        LEFT JOIN loans l ON c.id = l.client_id AND l.status != 'voided'
        WHERE c.user_id = ? AND c.is_active = 1
        AND DATE(c.created_at) BETWEEN DATE(?) AND DATE(?)
        GROUP BY c.id
      )
      GROUP BY label
    `;
    return await db.getAllAsync(query, [userId, start, end]);
  },

  async _getClientIncomeDistribution(db, userId, start, end) {
    const query = `
      SELECT 
        CASE 
          WHEN monthly_income < 20000 THEN 'Bajo (<20k)'
          WHEN monthly_income < 50000 THEN 'Medio (20k-50k)'
          WHEN monthly_income < 100000 THEN 'Alto (50k-100k)'
          ELSE 'Premium (100k+)'
        END as label,
        COUNT(*) as count
      FROM clients
      WHERE user_id = ? AND is_active = 1 AND monthly_income IS NOT NULL
      AND DATE(created_at) BETWEEN DATE(?) AND DATE(?)
      GROUP BY label
      ORDER BY MIN(monthly_income) ASC
    `;
    return await db.getAllAsync(query, [userId, start, end]);
  },

  /**
   * Obtiene la lista de clientes y sus sectores para una provincia específica.
   */
  async getClientsByProvince(userId, province) {
    const db = await getDb();
    const query = `
      SELECT *
      FROM clients
      WHERE user_id = ? AND province = ? AND is_active = 1
      ORDER BY address_line ASC
    `;
    const rows = await db.getAllAsync(query, [userId, province]);
    // Mapear para compatibilidad si es necesario (ej: concatenar nombre)
    return rows.map(r => ({
      ...r,
      name: `${r.first_name} ${r.last_name}`
    }));
  },

  async _getClientAgeDistribution(db, userId, start, end) {
    const query = `
      SELECT 
        CASE 
          WHEN CAST(STRFTIME('%Y', 'now') - STRFTIME('%Y', birth_date) AS INT) < 25 THEN '18-24'
          WHEN CAST(STRFTIME('%Y', 'now') - STRFTIME('%Y', birth_date) AS INT) < 35 THEN '25-34'
          WHEN CAST(STRFTIME('%Y', 'now') - STRFTIME('%Y', birth_date) AS INT) < 45 THEN '35-44'
          WHEN CAST(STRFTIME('%Y', 'now') - STRFTIME('%Y', birth_date) AS INT) < 55 THEN '45-54'
          ELSE '55+'
        END as label,
        COUNT(*) as count
      FROM clients
      WHERE user_id = ? AND is_active = 1 AND birth_date IS NOT NULL
      AND DATE(created_at) BETWEEN DATE(?) AND DATE(?)
      GROUP BY label
      ORDER BY label ASC
    `;
    return await db.getAllAsync(query, [userId, start, end]);
  },

  async _getClientMetrics(db, userId, start, end) {
    const totalQuery = `SELECT COUNT(*) as total FROM clients WHERE user_id = ? AND is_active = 1`;
    const newQuery = `SELECT COUNT(*) as newClients FROM clients WHERE user_id = ? AND DATE(created_at) BETWEEN DATE(?) AND DATE(?)`;
    
    // Calcular tasa de retorno (clientes con > 1 préstamo en total)
    const loyalQuery = `
      SELECT COUNT(*) as loyalCount FROM (
        SELECT client_id
        FROM loans 
        WHERE user_id = ? AND status != 'voided'
        GROUP BY client_id 
        HAVING COUNT(id) > 1
      )
    `;

    const totalRes = await db.getFirstAsync(totalQuery, [userId]);
    const newRes = await db.getFirstAsync(newQuery, [userId, start, end]);
    const loyalRes = await db.getFirstAsync(loyalQuery, [userId]);
    
    const totalClients = totalRes?.total || 0;
    const loyalClients = loyalRes?.loyalCount || 0;
    const retentionRate = totalClients > 0 ? (loyalClients / totalClients) * 100 : 0;

    return {
      total: totalClients,
      newClients: newRes?.newClients || 0,
      retentionRate: Math.round(retentionRate)
    };
  },

  async _getClientGrowthTrend(db, userId, range) {
    const { start, end, type } = range;
    let groupBy = "STRFTIME('%m', created_at)";
    
    if (type === "monthly") groupBy = "STRFTIME('%d', created_at)";

    const query = `
      SELECT ${groupBy} as label, COUNT(*) as count
      FROM clients
      WHERE user_id = ? AND is_active = 1
      AND DATE(created_at) BETWEEN DATE(?) AND DATE(?)
      GROUP BY label
      ORDER BY label ASC
    `;
    const rows = await db.getAllAsync(query, [userId, start, end]);
    return rows;
  },

  async _getClientGenderDistribution(db, userId, start, end) {
    const query = `
      SELECT gender, COUNT(*) as count
      FROM clients
      WHERE user_id = ? AND is_active = 1
      AND DATE(created_at) BETWEEN DATE(?) AND DATE(?)
      GROUP BY gender
    `;
    return await db.getAllAsync(query, [userId, start, end]);
  },

  async _getClientOccupationDistribution(db, userId, start, end) {
    const query = `
      SELECT occupation as label, COUNT(*) as count
      FROM clients
      WHERE user_id = ? AND is_active = 1
      AND DATE(created_at) BETWEEN DATE(?) AND DATE(?)
      GROUP BY occupation
      ORDER BY count DESC
      LIMIT 5
    `;
    return await db.getAllAsync(query, [userId, start, end]);
  },

  async _getClientGeographicDistribution(db, userId, start, end) {
    const query = `
      SELECT province as label, COUNT(*) as count
      FROM clients
      WHERE user_id = ? AND is_active = 1
      AND DATE(created_at) BETWEEN DATE(?) AND DATE(?)
      GROUP BY province
      ORDER BY count DESC
      LIMIT 5
    `;
    return await db.getAllAsync(query, [userId, start, end]);
  },

  async _getTopProfitableClients(db, userId, start, end) {
    const query = `
      SELECT 
        c.first_name || ' ' || c.last_name as name,
        COUNT(p.id) as paymentCount,
        SUM(p.interest_portion + p.late_fee_portion) as profit
      FROM clients c
      JOIN payments p ON c.id = (SELECT client_id FROM loans WHERE id = p.loan_id)
      WHERE p.user_id = ? AND p.status = 'active'
      AND DATE(p.payment_date) BETWEEN DATE(?) AND DATE(?)
      GROUP BY c.id
      ORDER BY profit DESC
      LIMIT 5
    `;
    return await db.getAllAsync(query, [userId, start, end]);
  },

  async _getTopLoyalClients(db, userId, start, end) {
    // Clientes con más préstamos completados en el periodo (o activos si no hay completados)
    const query = `
      SELECT 
        c.first_name || ' ' || c.last_name as name,
        COUNT(l.id) as loanCount,
        SUM(l.total_paid) as totalValue
      FROM clients c
      JOIN loans l ON c.id = l.client_id
      WHERE c.user_id = ? AND l.status != 'voided'
      AND DATE(l.created_at) BETWEEN DATE(?) AND DATE(?)
      GROUP BY c.id
      ORDER BY loanCount DESC, totalValue DESC
      LIMIT 5
    `;
    return await db.getAllAsync(query, [userId, start, end]);
  },

  async _getPaymentMethodDistribution(db, userId, start, end) {
    const query = `
      SELECT payment_method as method, SUM(amount) as amount, COUNT(*) as count
      FROM payments
      WHERE user_id = ? AND status = 'active'
      AND DATE(payment_date) BETWEEN DATE(?) AND DATE(?)
      GROUP BY payment_method
    `;
    const rows = await db.getAllAsync(query, [userId, start, end]);
    return rows;
  },

  async _getProfitByType(db, userId, start, end) {
    const query = `
      SELECT l.loan_type as type, SUM(p.interest_portion + p.late_fee_portion) as profit
      FROM payments p
      JOIN loans l ON p.loan_id = l.id
      WHERE p.user_id = ? AND p.status = 'active'
      AND DATE(p.payment_date) BETWEEN DATE(?) AND DATE(?)
      GROUP BY l.loan_type
    `;
    const rows = await db.getAllAsync(query, [userId, start, end]);
    return rows;
  },

  async _getTopProfitableClients(db, userId, start, end) {
    const query = `
      SELECT 
        c.first_name || ' ' || c.last_name as name,
        SUM(p.interest_portion + p.late_fee_portion) as profit,
        COUNT(p.id) as paymentCount
      FROM payments p
      JOIN loans l ON p.loan_id = l.id
      JOIN clients c ON l.client_id = c.id
      WHERE p.user_id = ? AND p.status = 'active'
      AND DATE(p.payment_date) BETWEEN DATE(?) AND DATE(?)
      GROUP BY c.id
      ORDER BY profit DESC
      LIMIT 5
    `;
    return await db.getAllAsync(query, [userId, start, end]);
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

  async _getTopDebtors(db, userId, start, end) {
    const query = `
      SELECT 
        c.first_name, c.last_name, 
        SUM(l.current_balance) as totalDebt,
        COUNT(l.id) as loanCount
      FROM loans l
      JOIN clients c ON l.client_id = c.id
      WHERE l.user_id = ? AND l.status != 'voided'
      AND DATE(l.created_at) <= DATE(?)
      AND l.current_balance > 0
      GROUP BY c.id
      ORDER BY totalDebt DESC
      LIMIT 5
    `;
    return await db.getAllAsync(query, [userId, end]);
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

  async _getArrearsAging(db, userId) {
    const today = new Date().toISOString().split('T')[0];
    const query = `
      SELECT 
        CASE 
          WHEN (JULIANDAY(?) - JULIANDAY(due_date)) <= 30 THEN '1-30'
          WHEN (JULIANDAY(?) - JULIANDAY(due_date)) <= 60 THEN '31-60'
          WHEN (JULIANDAY(?) - JULIANDAY(due_date)) <= 90 THEN '61-90'
          ELSE '+90'
        END as bucket,
        SUM(current_balance) as amount
      FROM loans
      WHERE user_id = ? AND status = 'overdue'
      GROUP BY bucket
    `;
    const rows = await db.getAllAsync(query, [today, today, today, userId]);
    
    // Formatear para gráfica
    const buckets = { '1-30': 0, '31-60': 0, '61-90': 0, '+90': 0 };
    rows.forEach(r => buckets[r.bucket] = r.amount);
    
    return Object.keys(buckets).map(key => ({
      label: key,
      amount: buckets[key]
    }));
  },

  async _getPortfolioEfficiency(db, userId) {
    const query = `
      SELECT 
        AVG(interest_rate) as avgRate,
        AVG(principal_amount) as avgTicket
      FROM loans
      WHERE user_id = ? AND status != 'voided'
    `;
    const result = await db.getFirstAsync(query, [userId]);
    return {
      avgRate: result?.avgRate || 0,
      avgTicket: result?.avgTicket || 0
    };
  },

  async _getFlowEfficiency(db, userId, start, end) {
    // Dinero que salió (Préstamos nuevos)
    const outQuery = `SELECT SUM(disbursed_amount) as totalOut FROM loans WHERE user_id = ? AND status != 'voided' AND DATE(created_at) BETWEEN DATE(?) AND DATE(?)`;
    // Dinero que entró (Solo capital recuperado)
    const inQuery = `SELECT SUM(capital_portion) as totalIn FROM payments WHERE user_id = ? AND status = 'active' AND DATE(payment_date) BETWEEN DATE(?) AND DATE(?)`;
    
    const outRes = await db.getFirstAsync(outQuery, [userId, start, end]);
    const inRes = await db.getFirstAsync(inQuery, [userId, start, end]);
    
    return {
      disbursed: outRes?.totalOut || 0,
      collectedCapital: inRes?.totalIn || 0
    };
  },

  async _getProfitMetrics(db, userId, start, end) {
    const query = `
      SELECT 
        SUM(interest_portion) as interestProfit,
        SUM(late_fee_portion) as lateFeeProfit,
        SUM(amount) as totalCollected
      FROM payments 
      WHERE user_id = ? AND status = 'active'
      AND DATE(payment_date) BETWEEN DATE(?) AND DATE(?)
    `;
    const result = await db.getFirstAsync(query, [userId, start, end]);
    
    const interest = result?.interestProfit || 0;
    const lateFees = result?.lateFeeProfit || 0;
    
    return {
      netProfit: interest + lateFees,
      interestProfit: interest,
      lateFeeProfit: lateFees,
      totalCollected: result?.totalCollected || 0
    };
  },

  async _getROI(db, userId, start, end) {
    // ROI = (Utilidad / Capital en Riesgo o Desembolsado)
    // Para simplificar: (Intereses Cobrados / Capital Promedio en el periodo)
    const profitQuery = `SELECT SUM(interest_portion + late_fee_portion) as profit FROM payments WHERE user_id = ? AND status = 'active' AND DATE(payment_date) BETWEEN DATE(?) AND DATE(?)`;
    const capitalQuery = `SELECT SUM(principal_amount) as capital FROM loans WHERE user_id = ? AND status != 'voided' AND DATE(created_at) <= DATE(?)`;
    
    const profitRes = await db.getFirstAsync(profitQuery, [userId, start, end]);
    const capitalRes = await db.getFirstAsync(capitalQuery, [userId, end]);
    
    const profit = profitRes?.profit || 0;
    const capital = capitalRes?.capital || 1;
    
    return {
      current: (profit / capital) * 100,
      previous: 0 // Simplificado
    };
  },

  async _getCollectionEfficiency(db, userId, start, end) {
    const scheduledQuery = `
      SELECT SUM(scheduled_amount) as scheduled
      FROM loan_installments i
      JOIN loans l ON i.loan_id = l.id
      WHERE l.user_id = ? AND l.status != 'voided'
      AND DATE(i.due_date) BETWEEN DATE(?) AND DATE(?)
    `;
    const collectedQuery = `
      SELECT SUM(amount) as collected
      FROM payments
      WHERE user_id = ? AND status = 'active'
      AND DATE(payment_date) BETWEEN DATE(?) AND DATE(?)
    `;
    
    const schedRes = await db.getFirstAsync(scheduledQuery, [userId, start, end]);
    const collRes = await db.getFirstAsync(collectedQuery, [userId, start, end]);
    
    const scheduled = schedRes?.scheduled || 0;
    const collected = collRes?.collected || 0;
    
    return {
      rate: scheduled > 0 ? (collected / scheduled) * 100 : 100,
      scheduled,
      collected
    };
  },

  async _getCollectionFunnel(db, userId, start, end) {
    // Paso 1: Facturación (Lo que debía cobrarse)
    const step1 = await this._getCollectionEfficiency(db, userId, start, end);
    
    // Paso 2: Cobro de Capital
    const capQuery = `SELECT SUM(capital_portion) as cap FROM payments WHERE user_id = ? AND status = 'active' AND DATE(payment_date) BETWEEN DATE(?) AND DATE(?)`;
    const capRes = await db.getFirstAsync(capQuery, [userId, start, end]);
    
    // Paso 3: Utilidad (Intereses + Mora)
    const profQuery = `SELECT SUM(interest_portion + late_fee_portion) as prof FROM payments WHERE user_id = ? AND status = 'active' AND DATE(payment_date) BETWEEN DATE(?) AND DATE(?)`;
    const profRes = await db.getFirstAsync(profQuery, [userId, start, end]);
    
    return [
      { label: 'Facturación', value: step1.scheduled, color: '#13678A' },
      { label: 'Recuperado', value: step1.collected, color: '#10B981' },
      { label: 'Capital', value: capRes?.cap || 0, color: '#3B82F6' },
      { label: 'Utilidad', value: profRes?.prof || 0, color: '#F59E0B' }
    ];
  },

  async _getProfitProjections(db, userId, range) {
    const { start, end, type } = range;
    let groupBy = "";
    
    if (type === "monthly") groupBy = "STRFTIME('%W', payment_date)";
    else groupBy = "STRFTIME('%m', payment_date)";

    // Real: Intereses cobrados
    const realQuery = `
      SELECT ${groupBy} as label, SUM(interest_portion + late_fee_portion) as amount
      FROM payments
      WHERE user_id = ? AND status = 'active'
      AND DATE(payment_date) BETWEEN DATE(?) AND DATE(?)
      GROUP BY label
      ORDER BY label ASC
    `;
    
    // Proyectado: Intereses programados (de cuotas que vencen en el periodo)
    const projQuery = `
      SELECT ${groupBy === "STRFTIME('%W', payment_date)" ? "STRFTIME('%W', i.due_date)" : "STRFTIME('%m', i.due_date)"} as label, 
             SUM(interest_amount) as amount
      FROM loan_installments i
      JOIN loans l ON i.loan_id = l.id
      WHERE l.user_id = ? AND l.status != 'voided'
      AND DATE(i.due_date) BETWEEN DATE(?) AND DATE(?)
      GROUP BY label
      ORDER BY label ASC
    `;

    const realRows = await db.getAllAsync(realQuery, [userId, start, end]);
    const projRows = await db.getAllAsync(projQuery, [userId, start, end]);

    // Combinar datos
    const labels = Array.from(new Set([...realRows.map(r => r.label), ...projRows.map(r => r.label)])).sort();
    
    const monthNames = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

    return labels.map(label => {
      let displayLabel = label;
      if (range.type !== "monthly") {
        const monthIdx = parseInt(label) - 1;
        displayLabel = monthNames[monthIdx] || label;
      } else {
        displayLabel = "S" + label;
      }

      return {
        label: displayLabel,
        real: realRows.find(r => r.label === label)?.amount || 0,
        projected: projRows.find(r => r.label === label)?.amount || 0
      };
    });
  },

  async _getRevenueSources(db, userId, start, end) {
    const query = `
      SELECT 
        SUM(interest_portion) as interest,
        SUM(late_fee_portion) as lateFees
      FROM payments
      WHERE user_id = ? AND status = 'active'
      AND DATE(payment_date) BETWEEN DATE(?) AND DATE(?)
    `;
    const result = await db.getFirstAsync(query, [userId, start, end]);
    return [
      { label: 'Intereses', amount: result?.interest || 0, color: '#13678A' },
      { label: 'Mora', amount: result?.lateFees || 0, color: '#EF4444' }
    ];
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
