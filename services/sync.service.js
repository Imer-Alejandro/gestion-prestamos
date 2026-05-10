import { db } from '../firebaseConfig';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  where, 
  Timestamp, 
  writeBatch,
  getDocs,
  limit,
  orderBy
} from 'firebase/firestore';
import { getDb } from '../database/db';

/**
 * SyncService
 * Handles bi-directional synchronization between SQLite and Firestore.
 */
class SyncService {
  constructor() {
    this.listeners = [];
    this.isSyncing = false;
  }

  /**
   * Initializes real-time listeners for the given organization.
   * @param {string} orgId The organization ID.
   * @param {string} plan The current plan type.
   * @param {number} userId The current user ID.
   */
  async startSync(orgId, plan, userId) {
    if (plan === 'basic' || !orgId) return;

    console.log(`🔄 Starting sync for org: ${orgId}`);
    
    // 1. Setup listeners for remote changes
    this.setupRemoteListeners(orgId);
    
    // 2. Perform initial push of local dirty changes
    this.pushLocalChanges(orgId, userId);
  }

  stopSync() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];
    console.log('🛑 Sync stopped');
  }

  setupRemoteListeners(orgId) {
    const tables = ['clients', 'loans', 'payments', 'loan_installments'];
    
    tables.forEach(table => {
      const q = query(
        collection(db, `organizations/${orgId}/${table}`),
        // In production, add a where clause for updatedAt > lastLocalSync
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added' || change.type === 'modified') {
            await this.updateLocalRecord(table, change.doc.data());
          }
          // Soft delete is handled as a modification where deleted_at != null
        });
      });

      this.listeners.push(unsubscribe);
    });
  }

  async performInitialPull(orgId, userId) {
    if (!orgId) return;
    console.log(`📥 Performing initial pull for org: ${orgId}`);
    try {
      const sqlite = await getDb();
      const tables = ['clients']; // TODO: Add 'loans', 'payments', 'loan_installments' later
      
      for (const table of tables) {
        const q = query(collection(db, `organizations/${orgId}/${table}`));
        const snapshot = await getDocs(q);
        
        console.log(`📥 Downloaded ${snapshot.size} records for ${table}`);
        
        for (const doc of snapshot.docs) {
          await this.updateLocalRecord(table, doc.data(), userId);
        }
      }
      console.log(`✅ Initial pull complete`);
    } catch (error) {
      console.error('❌ Error in initial pull:', error);
    }
  }

  async updateLocalRecord(tableName, data, currentUserId) {
    if (!data.id) return;
    
    try {
      if (tableName === 'clients') {
        await this.processClientPull(data, currentUserId);
      } else if (tableName === 'loans') {
        await this.processLoanPull(data, currentUserId);
      } else if (tableName === 'payments') {
        await this.processPaymentPull(data, currentUserId);
      } else if (tableName === 'loan_installments') {
        await this.processInstallmentPull(data, currentUserId);
      }
    } catch (error) {
      console.error(`❌ Error updating local record for ${tableName}:`, error);
    }
  }

  async processClientPull(data, currentUserId) {
    const sqlite = await getDb();
    
    // 1. Verificar si ya existe localmente
    const localByRemoteId = await sqlite.getFirstAsync(
      `SELECT id, version FROM clients WHERE remote_id = ?`,
      [data.id]
    );

    if (localByRemoteId && localByRemoteId.version >= (data.version || 1)) {
      return; // El local es más reciente o igual
    }

    // 2. Si no existe por remote_id, buscar por document_number (prevención de duplicados offline)
    let localId = localByRemoteId ? localByRemoteId.id : null;
    
    if (!localId && data.document_number) {
      const localByDoc = await sqlite.getFirstAsync(
        `SELECT id, version FROM clients WHERE document_number = ?`,
        [data.document_number]
      );
      if (localByDoc) {
        localId = localByDoc.id;
        // Si el local tiene una versión mayor (fue editado offline), ignoramos el remoto 
        // pero le asignamos el remote_id para que se suba en el próximo push.
        if (localByDoc.version > (data.version || 1)) {
          await sqlite.runAsync(
            `UPDATE clients SET remote_id = ? WHERE id = ?`,
            [data.id, localId]
          );
          return;
        }
      }
    }

    // 3. Preparar datos para SQLite
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1;
    const updatedAt = data.updatedAt || new Date().toISOString();
    const version = data.version || 1;
    const userId = data.user_id || currentUserId; // Mantener el dueño original si existe

    if (localId) {
      // UPDATE
      await sqlite.runAsync(
        `UPDATE clients SET 
          remote_id = ?, version = ?, is_dirty = 0, is_active = ?, updated_at = ?,
          first_name = ?, last_name = ?, document_type = ?, document_number = ?,
          birth_date = ?, gender = ?, phone_primary = ?, phone_secondary = ?,
          email = ?, address_line = ?, city = ?, province = ?, country = ?,
          occupation = ?, workplace = ?, monthly_income = ?, reference_name = ?,
          reference_phone = ?, credit_limit = ?, notes = ?, signature_svg = ?
         WHERE id = ?`,
        [
          data.id, version, isActive, updatedAt,
          data.first_name, data.last_name, data.document_type, data.document_number,
          data.birth_date, data.gender, data.phone_primary, data.phone_secondary,
          data.email, data.address_line, data.city, data.province, data.country,
          data.occupation, data.workplace, data.monthly_income, data.reference_name,
          data.reference_phone, data.credit_limit, data.notes, data.signature_svg,
          localId
        ]
      );
    } else {
      // INSERT
      await sqlite.runAsync(
        `INSERT INTO clients (
          remote_id, version, is_dirty, is_active, updated_at, created_at, user_id,
          first_name, last_name, document_type, document_number, birth_date, gender,
          phone_primary, phone_secondary, email, address_line, city, province, country,
          occupation, workplace, monthly_income, reference_name, reference_phone,
          credit_limit, notes, signature_svg
        ) VALUES (
          ?, ?, 0, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?
        )`,
        [
          data.id, version, isActive, updatedAt, data.created_at || new Date().toISOString(), userId,
          data.first_name, data.last_name, data.document_type, data.document_number, data.birth_date, data.gender,
          data.phone_primary, data.phone_secondary, data.email, data.address_line, data.city, data.province, data.country,
          data.occupation, data.workplace, data.monthly_income, data.reference_name, data.reference_phone,
          data.credit_limit || 0, data.notes, data.signature_svg
        ]
      );
    }
  }

  async processLoanPull(data, currentUserId) {
    const sqlite = await getDb();
    
    const local = await sqlite.getFirstAsync(
      `SELECT id, version FROM loans WHERE remote_id = ?`,
      [data.id]
    );

    if (local && local.version >= (data.version || 1)) return;

    const updatedAt = data.updatedAt || new Date().toISOString();
    const version = data.version || 1;
    const userId = data.user_id || currentUserId;

    // Buscar client_id local basado en el client_id remoto
    // NOTA: Para que esto funcione 100%, los clientes ya debieron descargarse.
    let localClientId = data.client_id;
    if (data.client_remote_id) {
       const c = await sqlite.getFirstAsync(`SELECT id FROM clients WHERE remote_id = ?`, [data.client_remote_id]);
       if (c) localClientId = c.id;
    }

    if (local) {
      await sqlite.runAsync(
        `UPDATE loans SET 
          remote_id = ?, version = ?, is_dirty = 0, updated_at = ?,
          client_id = ?, current_balance = ?, total_interest = ?, total_late_fees = ?,
          contract_number = ?, loan_type = ?, principal_amount = ?, disbursed_amount = ?,
          interest_rate = ?, interest_calculation_base = ?, interest_rate_period = ?,
          late_fee_type = ?, late_fee_value = ?, amortization_type = ?, installments = ?,
          start_date = ?, due_date = ?, payment_frequency = ?, grace_days = ?,
          status = ?, total_paid = ?, comments = ?
         WHERE id = ?`,
        [
          data.id, version, updatedAt,
          localClientId, data.current_balance, data.total_interest, data.total_late_fees,
          data.contract_number, data.loan_type, data.principal_amount, data.disbursed_amount,
          data.interest_rate, data.interest_calculation_base, data.interest_rate_period,
          data.late_fee_type, data.late_fee_value, data.amortization_type, data.installments,
          data.start_date, data.due_date, data.payment_frequency, data.grace_days,
          data.status, data.total_paid, data.comments,
          local.id
        ]
      );
    } else {
      await sqlite.runAsync(
        `INSERT INTO loans (
          remote_id, version, is_dirty, updated_at, created_at, user_id,
          client_id, current_balance, total_interest, total_late_fees,
          contract_number, loan_type, principal_amount, disbursed_amount,
          interest_rate, interest_calculation_base, interest_rate_period,
          late_fee_type, late_fee_value, amortization_type, installments,
          start_date, due_date, payment_frequency, grace_days, status, total_paid, comments
        ) VALUES (
          ?, ?, 0, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?
        )`,
        [
          data.id, version, updatedAt, data.created_at || new Date().toISOString(), userId,
          localClientId, data.current_balance, data.total_interest, data.total_late_fees,
          data.contract_number, data.loan_type, data.principal_amount, data.disbursed_amount,
          data.interest_rate, data.interest_calculation_base, data.interest_rate_period,
          data.late_fee_type, data.late_fee_value, data.amortization_type, data.installments,
          data.start_date, data.due_date, data.payment_frequency, data.grace_days,
          data.status, data.total_paid, data.comments
        ]
      );
    }
  }

  async processPaymentPull(data, currentUserId) {
    const sqlite = await getDb();
    
    const local = await sqlite.getFirstAsync(
      `SELECT id, version FROM payments WHERE remote_id = ?`,
      [data.id]
    );

    if (local && local.version >= (data.version || 1)) return;

    const updatedAt = data.updatedAt || new Date().toISOString();
    const version = data.version || 1;
    const userId = data.user_id || currentUserId;

    let localLoanId = data.loan_id;
    if (data.loan_remote_id) {
       const l = await sqlite.getFirstAsync(`SELECT id FROM loans WHERE remote_id = ?`, [data.loan_remote_id]);
       if (l) localLoanId = l.id;
    }

    if (local) {
      await sqlite.runAsync(
        `UPDATE payments SET 
          remote_id = ?, version = ?, is_dirty = 0, updated_at = ?,
          loan_id = ?, amount = ?, capital_portion = ?, interest_portion = ?,
          late_fee_portion = ?, payment_method = ?, reference_number = ?,
          payment_date = ?, status = ?
         WHERE id = ?`,
        [
          data.id, version, updatedAt,
          localLoanId, data.amount, data.capital_portion, data.interest_portion,
          data.late_fee_portion, data.payment_method, data.reference_number,
          data.payment_date, data.status,
          local.id
        ]
      );
    } else {
      await sqlite.runAsync(
        `INSERT INTO payments (
          remote_id, version, is_dirty, updated_at, created_at, user_id,
          loan_id, amount, capital_portion, interest_portion, late_fee_portion,
          payment_method, reference_number, payment_date, status
        ) VALUES (
          ?, ?, 0, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )`,
        [
          data.id, version, updatedAt, data.created_at || new Date().toISOString(), userId,
          localLoanId, data.amount, data.capital_portion, data.interest_portion, data.late_fee_portion,
          data.payment_method, data.reference_number, data.payment_date, data.status
        ]
      );
    }
  }

  async processInstallmentPull(data, currentUserId) {
    const sqlite = await getDb();
    
    const local = await sqlite.getFirstAsync(
      `SELECT id, version FROM loan_installments WHERE remote_id = ?`,
      [data.id]
    );

    if (local && local.version >= (data.version || 1)) return;

    const updatedAt = data.updatedAt || new Date().toISOString();
    const version = data.version || 1;

    let localLoanId = data.loan_id;
    if (data.loan_remote_id) {
       const l = await sqlite.getFirstAsync(`SELECT id FROM loans WHERE remote_id = ?`, [data.loan_remote_id]);
       if (l) localLoanId = l.id;
    }

    if (local) {
      await sqlite.runAsync(
        `UPDATE loan_installments SET 
          remote_id = ?, version = ?, is_dirty = 0, updated_at = ?,
          loan_id = ?, installment_number = ?, due_date = ?, scheduled_amount = ?,
          capital_amount = ?, interest_amount = ?, remaining_capital = ?,
          remaining_interest = ?, remaining_late_fee = ?, late_fee_accrued = ?,
          amount_paid = ?, status = ?
         WHERE id = ?`,
        [
          data.id, version, updatedAt,
          localLoanId, data.installment_number, data.due_date, data.scheduled_amount,
          data.capital_amount, data.interest_amount, data.remaining_capital,
          data.remaining_interest, data.remaining_late_fee, data.late_fee_accrued,
          data.amount_paid, data.status,
          local.id
        ]
      );
    } else {
      await sqlite.runAsync(
        `INSERT INTO loan_installments (
          remote_id, version, is_dirty, updated_at, created_at,
          loan_id, installment_number, due_date, scheduled_amount,
          capital_amount, interest_amount, remaining_capital, remaining_interest,
          remaining_late_fee, late_fee_accrued, amount_paid, status
        ) VALUES (
          ?, ?, 0, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?
        )`,
        [
          data.id, version, updatedAt, data.created_at || new Date().toISOString(),
          localLoanId, data.installment_number, data.due_date, data.scheduled_amount,
          data.capital_amount, data.interest_amount, data.remaining_capital, data.remaining_interest,
          data.remaining_late_fee, data.late_fee_accrued, data.amount_paid, data.status
        ]
      );
    }
  }

  async pushLocalChanges(orgId, userId) {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const sqlite = await getDb();
      const tables = ['clients', 'loans', 'payments', 'loan_installments'];

      for (const table of tables) {
        const dirtyRecords = await sqlite.getAllAsync(
          `SELECT * FROM ${table} WHERE is_dirty = 1`
        );

        if (dirtyRecords.length === 0) continue;

        const batch = writeBatch(db);

        for (const record of dirtyRecords) {
          const docId = record.remote_id || doc(collection(db, `organizations/${orgId}/${table}`)).id;
          const docRef = doc(db, `organizations/${orgId}/${table}`, docId);
          
          // Prepare data for Firestore
          const { id, is_dirty, ...firestoreData } = record;
          firestoreData.id = docId;
          firestoreData.updatedAt = new Date().toISOString();
          firestoreData.updatedBy = userId;
          
          // Only increment version if it's an update
          if (record.remote_id) {
            firestoreData.version = (record.version || 1) + 1;
          }

          batch.set(docRef, firestoreData, { merge: true });
          
          // Update local record
          await sqlite.runAsync(
            `UPDATE ${table} SET remote_id = ?, is_dirty = 0, version = ? WHERE id = ?`,
            [docId, firestoreData.version || 1, id]
          );
        }

        await batch.commit();
        console.log(`✅ Pushed ${dirtyRecords.length} records for ${table}`);
      }
    } catch (error) {
      console.error('❌ Error pushing local changes:', error);
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncService = new SyncService();
