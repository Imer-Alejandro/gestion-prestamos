/**
 * quota.service.js
 * Sistema de control de planes y cuotas de uso.
 * Arquitectura en 3 capas:
 *   1. PLAN_DEFINITIONS  — catálogo de planes (escalable)
 *   2. StorageService    — acceso a SQLite
 *   3. QuotaService      — cálculos y validaciones
 *   4. PlanManager       — API pública que consumen los demás servicios
 */

import { getDb } from '../database/db.js';
import { sendLocalNotification } from './notification.service.js';

// ─────────────────────────────────────────────────────────────
// 1. CATÁLOGO DE PLANES
// ─────────────────────────────────────────────────────────────
export const PLAN_DEFINITIONS = {
  basic: {
    id: 'basic',
    name: 'Plan Básico',
    maxClients: 20,
    maxOpsMonth: 120,
    maxInvoicesMonth: 50,
  },
  standard: {
    id: 'standard',
    name: 'Plan Estándar',
    maxClients: 150,
    maxOpsMonth: 600,
    maxInvoicesMonth: 200,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Plan Empresarial',
    maxClients: 99999, // Ilimitado
    maxOpsMonth: 99999,
    maxInvoicesMonth: 99999,
  },
};

// ─────────────────────────────────────────────────────────────
// 2. TIPOS DE ACCIÓN
// Define qué contadores incrementa cada tipo de acción.
// ─────────────────────────────────────────────────────────────
const ACTION_TYPES = {
  registerClient:  { isOperation: true,  isInvoice: false, isClient: true  },
  editClient:      { isOperation: true,  isInvoice: false, isClient: false },
  deactivateClient:{ isOperation: true,  isInvoice: false, isClient: false },
  registerLoan:    { isOperation: true,  isInvoice: false, isClient: false },
  voidLoan:        { isOperation: true,  isInvoice: false, isClient: false },
  registerPayment: { isOperation: true,  isInvoice: false, isClient: false },
  editPayment:     { isOperation: true,  isInvoice: false, isClient: false },
  deletePayment:   { isOperation: true,  isInvoice: false, isClient: false },
  generateReceipt: { isOperation: true, isInvoice: true,  isClient: false },
  generateReport:  { isOperation: true, isInvoice: true,  isClient: false },
  updateUserData:  { isOperation: true, isInvoice: false, isClient: false },
};

// Umbrales de alerta (porcentaje de operaciones mensuales)
const ALERT_THRESHOLDS = [70, 85, 100];

// ─────────────────────────────────────────────────────────────
// 3. STORAGE SERVICE — Acceso a SQLite
// ─────────────────────────────────────────────────────────────
const StorageService = {
  /**
   * Obtiene el registro de cuota del usuario.
   * Si no existe, lo crea con el ciclo iniciando hoy.
   */
  async getQuota(userId) {
    const db = await getDb();
    let quota = await db.getFirstAsync(
      'SELECT * FROM quota_usage WHERE user_id = ?',
      [userId]
    );

    if (!quota) {
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT OR IGNORE INTO quota_usage (user_id, cycle_start_date, total_clients, operations_this_month, invoices_this_month, historical_operations)
         VALUES (?, ?, 0, 0, 0, 0)`,
        [userId, now]
      );
      quota = await db.getFirstAsync(
        'SELECT * FROM quota_usage WHERE user_id = ?',
        [userId]
      );
    }

    return quota;
  },

  /**
   * Actualiza el registro de cuota del usuario.
   */
  async saveQuota(userId, data) {
    const db = await getDb();
    await db.runAsync(
      `UPDATE quota_usage SET
        cycle_start_date      = ?,
        total_clients         = ?,
        operations_this_month = ?,
        invoices_this_month   = ?,
        historical_operations = ?
       WHERE user_id = ?`,
      [
        data.cycle_start_date,
        data.total_clients,
        data.operations_this_month,
        data.invoices_this_month,
        data.historical_operations,
        userId,
      ]
    );
  },

  /**
   * Obtiene el tipo de plan activo del usuario desde la tabla organizations.
   */
  async getPlanType(userId) {
    const db = await getDb();
    const org = await db.getFirstAsync(
      'SELECT plan_type FROM organizations WHERE user_id = ?',
      [userId]
    );
    return org?.plan_type || 'basic';
  },

  /**
   * Actualiza el tipo de plan activo en la tabla organizations.
   */
  async setPlanType(userId, planId) {
    const db = await getDb();
    await db.runAsync(
      'UPDATE organizations SET plan_type = ? WHERE user_id = ?',
      [planId, userId]
    );
  },
};

// ─────────────────────────────────────────────────────────────
// 4. QUOTA SERVICE — Cálculos y validaciones
// ─────────────────────────────────────────────────────────────
const QuotaService = {
  /**
   * Verifica si el ciclo mensual expiró (30 días desde cycle_start_date).
   * Si expiró, resetea los contadores mensuales y guarda.
   */
  async checkAndResetCycle(userId, quota) {
    const cycleStart = new Date(quota.cycle_start_date);
    const now = new Date();
    const diffDays = Math.floor((now - cycleStart) / (1000 * 60 * 60 * 24));

    if (diffDays >= 30) {
      const updated = {
        ...quota,
        cycle_start_date: now.toISOString(),
        operations_this_month: 0,
        invoices_this_month: 0,
        // total_clients e historical_operations NO se resetean
      };
      await StorageService.saveQuota(userId, updated);
      return updated;
    }

    return quota;
  },

  /**
   * Valida si una acción puede ejecutarse según los límites del plan.
   * Retorna { allowed: boolean, reason: string | null }
   */
  validate(quota, plan, actionType) {
    const actionDef = ACTION_TYPES[actionType];
    if (!actionDef) {
      return { allowed: true, reason: null }; // Acción no controlada → permitida
    }

    // Límite de clientes registrados
    if (actionDef.isClient && quota.total_clients >= plan.maxClients) {
      return {
        allowed: false,
        reason: `Has alcanzado el límite de ${plan.maxClients} clientes del ${plan.name}. Considera mejorar tu plan.`,
      };
    }

    // Límite de operaciones mensuales
    if (actionDef.isOperation && quota.operations_this_month >= plan.maxOpsMonth) {
      return {
        allowed: false,
        reason: `Has agotado las ${plan.maxOpsMonth} operaciones mensuales del ${plan.name}. Tu cuota se renueva en 30 días.`,
      };
    }

    // Límite de comprobantes mensuales
    if (actionDef.isInvoice && quota.invoices_this_month >= plan.maxInvoicesMonth) {
      return {
        allowed: false,
        reason: `Has agotado los ${plan.maxInvoicesMonth} comprobantes mensuales del ${plan.name}. Tu cuota se renueva en 30 días.`,
      };
    }

    return { allowed: true, reason: null };
  },

  /**
   * Calcula las estadísticas de uso para la UI.
   */
  getStats(quota, plan) {
    const pctOps      = Math.min(100, Math.round((quota.operations_this_month / plan.maxOpsMonth) * 100));
    const pctInvoices = Math.min(100, Math.round((quota.invoices_this_month / plan.maxInvoicesMonth) * 100));
    const pctClients  = Math.min(100, Math.round((quota.total_clients / plan.maxClients) * 100));

    let status = 'normal';
    if (pctOps >= 100 || pctClients >= 100) status = 'critical';
    else if (pctOps >= 85 || pctClients >= 85) status = 'critical';
    else if (pctOps >= 70 || pctClients >= 70) status = 'warning';

    return {
      plan,
      ops: {
        used: quota.operations_this_month,
        max: plan.maxOpsMonth,
        remaining: Math.max(0, plan.maxOpsMonth - quota.operations_this_month),
        pct: pctOps,
      },
      invoices: {
        used: quota.invoices_this_month,
        max: plan.maxInvoicesMonth,
        remaining: Math.max(0, plan.maxInvoicesMonth - quota.invoices_this_month),
        pct: pctInvoices,
      },
      clients: {
        used: quota.total_clients,
        max: plan.maxClients,
        remaining: Math.max(0, plan.maxClients - quota.total_clients),
        pct: pctClients,
      },
      historical: quota.historical_operations,
      cycleStart: quota.cycle_start_date,
      status, // 'normal' | 'warning' | 'critical'
    };
  },

  /**
   * Envía notificaciones de alerta al cruzar umbrales de operaciones.
   * Usa doble canal: push nativa + interna (campana en la app).
   */
  async notifyIfThreshold(userId, quota, plan) {
    const pct = Math.round((quota.operations_this_month / plan.maxOpsMonth) * 100);

    for (const threshold of ALERT_THRESHOLDS) {
      // Detectar si cruzamos el umbral en esta operación exacta
      const prevPct = Math.round(((quota.operations_this_month - 1) / plan.maxOpsMonth) * 100);
      if (prevPct < threshold && pct >= threshold) {
        let title, body;
        if (threshold === 100) {
          title = '🚫 Cuota mensual agotada';
          body  = `Has usado el 100% de tus operaciones del ${plan.name}. No podrás registrar más operaciones este mes.`;
        } else {
          title = `⚠️ ${threshold}% de tu cuota mensual usada`;
          body  = `Llevas ${quota.operations_this_month} de ${plan.maxOpsMonth} operaciones del ${plan.name}.`;
        }

        await sendLocalNotification(
          title,
          body,
          { screen: '/configuracion', type: 'quota_warning' },
          userId,
          'quota_warning'
        );
        break; // Solo un umbral por operación
      }
    }
  },
};

// ─────────────────────────────────────────────────────────────
// 5. PLAN MANAGER — API pública
// ─────────────────────────────────────────────────────────────
export const PlanManager = {
  /**
   * Verifica si una acción puede ejecutarse según el plan del usuario.
   * LLAMAR ANTES de ejecutar la acción en el servicio de negocio.
   * @returns {{ allowed: boolean, reason: string | null }}
   */
  async canExecute(userId, actionType) {
    try {
      const planId = await StorageService.getPlanType(userId);
      const plan   = PLAN_DEFINITIONS[planId] || PLAN_DEFINITIONS.basic;
      let quota    = await StorageService.getQuota(userId);
      quota        = await QuotaService.checkAndResetCycle(userId, quota);

      return QuotaService.validate(quota, plan, actionType);
    } catch (error) {
      console.error('[PlanManager] canExecute error:', error);
      return { allowed: true, reason: null }; // Fail open en caso de error inesperado
    }
  },

  /**
   * Registra una operación completada, incrementa contadores y notifica si hay umbral.
   * LLAMAR DESPUÉS de ejecutar exitosamente la acción en el servicio de negocio.
   */
  async registerOperation(userId, actionType) {
    try {
      const planId = await StorageService.getPlanType(userId);
      const plan   = PLAN_DEFINITIONS[planId] || PLAN_DEFINITIONS.basic;
      let quota    = await StorageService.getQuota(userId);
      quota        = await QuotaService.checkAndResetCycle(userId, quota);

      const actionDef = ACTION_TYPES[actionType];
      if (!actionDef) {
        console.warn(`[PlanManager] Action type not found: ${actionType}`);
        return;
      }

      console.log(`[PlanManager] Registering ${actionType} for user ${userId}`);
      const updated = { ...quota };
      if (actionDef.isOperation) {
        updated.operations_this_month += 1;
        updated.historical_operations += 1;
      }
      if (actionDef.isInvoice) {
        updated.invoices_this_month += 1;
        console.log(`[PlanManager] Incremented invoices_this_month to ${updated.invoices_this_month} for user ${userId}`);
      }
      if (actionDef.isClient) {
        updated.total_clients += 1;
      }

      await StorageService.saveQuota(userId, updated);
      console.log(`[PlanManager] Quota saved successfully for user ${userId}`);

      // Verificar y emitir alertas de umbral
      if (actionDef.isOperation) {
        await QuotaService.notifyIfThreshold(userId, updated, plan);
      }
    } catch (error) {
      console.error('[PlanManager] registerOperation error:', error);
    }
  },

  /**
   * Decrementa el conteo de clientes (para uso en eliminación/baja permanente).
   * Nota: deactivateClient no decrementa porque el cliente sigue en la BD.
   * Usar solo si el cliente es eliminado físicamente.
   */
  async decrementClientCount(userId) {
    try {
      const quota = await StorageService.getQuota(userId);
      if (quota.total_clients > 0) {
        const updated = { ...quota, total_clients: quota.total_clients - 1 };
        await StorageService.saveQuota(userId, updated);
      }
    } catch (error) {
      console.error('[PlanManager] decrementClientCount error:', error);
    }
  },

  /**
   * Obtiene las estadísticas de uso para mostrar en la UI.
   * @returns {object} stats con pct, used, max, remaining por categoría
   */
  async getUsageStats(userId) {
    try {
      const planId = await StorageService.getPlanType(userId);
      const plan   = PLAN_DEFINITIONS[planId] || PLAN_DEFINITIONS.basic;
      let quota    = await StorageService.getQuota(userId);
      quota        = await QuotaService.checkAndResetCycle(userId, quota);

      return QuotaService.getStats(quota, plan);
    } catch (error) {
      console.error('[PlanManager] getUsageStats error:', error);
      return null;
    }
  },

  /**
   * Obtiene los límites del plan activo del usuario.
   */
  async getPlanLimits(userId) {
    try {
      const planId = await StorageService.getPlanType(userId);
      return PLAN_DEFINITIONS[planId] || PLAN_DEFINITIONS.basic;
    } catch (error) {
      console.error('[PlanManager] getPlanLimits error:', error);
      return PLAN_DEFINITIONS.basic;
    }
  },

  /**
   * Cambia el plan activo del usuario.
   * Si es upgrade, resetea los contadores mensuales (pero conserva histórico y clientes).
   */
  async updatePlan(userId, newPlanId) {
    try {
      const currentPlanId = await StorageService.getPlanType(userId);
      const currentPlan   = PLAN_DEFINITIONS[currentPlanId] || PLAN_DEFINITIONS.basic;
      const newPlan       = PLAN_DEFINITIONS[newPlanId];

      if (!newPlan) throw new Error(`Plan desconocido: ${newPlanId}`);

      const isUpgrade =
        newPlan.maxClients      > currentPlan.maxClients      ||
        newPlan.maxOpsMonth     > currentPlan.maxOpsMonth     ||
        newPlan.maxInvoicesMonth > currentPlan.maxInvoicesMonth;

      await StorageService.setPlanType(userId, newPlanId);

      if (isUpgrade) {
        // Resetear contadores mensuales al hacer upgrade
        const quota   = await StorageService.getQuota(userId);
        const updated = {
          ...quota,
          cycle_start_date:       new Date().toISOString(),
          operations_this_month:  0,
          invoices_this_month:    0,
          // total_clients e historical_operations se conservan
        };
        await StorageService.saveQuota(userId, updated);
      }

      return { success: true, isUpgrade, newPlan };
    } catch (error) {
      console.error('[PlanManager] updatePlan error:', error);
      throw error;
    }
  },

  /**
   * Recalcula total_clients desde la BD real (para sincronización).
   * Útil si hay discrepancia entre el contador y la realidad.
   */
  async syncClientCount(userId) {
    try {
      const db     = await getDb();
      const result = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM clients WHERE user_id = ? AND is_active = 1',
        [userId]
      );
      const quota   = await StorageService.getQuota(userId);
      const updated = { ...quota, total_clients: result?.count || 0 };
      await StorageService.saveQuota(userId, updated);
    } catch (error) {
      console.error('[PlanManager] syncClientCount error:', error);
    }
  },
};
