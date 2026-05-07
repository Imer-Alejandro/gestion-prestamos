import * as SQLite from "expo-sqlite";

let db = null;
let initPromise = null;

export async function getDatabase() {
  if (!db) {
    db = await SQLite.openDatabaseAsync("loan_manager.db");
    // Optimizaciones de concurrencia
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      PRAGMA synchronous = NORMAL;
      PRAGMA busy_timeout = 5000;
    `);
  }
  return db;
}

// Alias para compatibilidad
export async function getDb() {
  return await getDatabase();
}

export async function initializeDatabase() {
  // Evitar múltiples inicializaciones simultáneas
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const database = await getDatabase();

      await database.execAsync(`
    -------------------------------------------------------
    -- USERS
    -------------------------------------------------------
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      password_hash TEXT NOT NULL,
      pin_hash TEXT,
      email_verified INTEGER DEFAULT 0,
      email_verified_at TEXT,
      created_at TEXT NOT NULL,
      last_login TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_users_active
    ON users(is_active);

    -------------------------------------------------------
    -- EMAIL VALIDATIONS
    -------------------------------------------------------
    CREATE TABLE IF NOT EXISTS email_validations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      validation_code TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 5,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      is_used INTEGER DEFAULT 0,
      used_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_email_validations_user
    ON email_validations(user_id);

    CREATE INDEX IF NOT EXISTS idx_email_validations_email
    ON email_validations(email);

    -------------------------------------------------------
    -- PASSWORD RESETS
    -------------------------------------------------------
    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      reset_code TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 5,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      is_used INTEGER DEFAULT 0,
      used_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_password_resets_user
    ON password_resets(user_id);

    CREATE INDEX IF NOT EXISTS idx_password_resets_email
    ON password_resets(email);

    -------------------------------------------------------
    -- CLIENTS
    -------------------------------------------------------
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,

      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      document_type TEXT NOT NULL,
      document_number TEXT NOT NULL UNIQUE,

      birth_date TEXT,
      gender TEXT,

      phone_primary TEXT NOT NULL,
      phone_secondary TEXT,
      email TEXT,

      address_line TEXT NOT NULL,
      city TEXT,
      province TEXT,
      country TEXT,

      occupation TEXT,
      workplace TEXT,
      monthly_income REAL,

      reference_name TEXT,
      reference_phone TEXT,

      credit_limit REAL DEFAULT 0,
      notes TEXT,

      created_at TEXT NOT NULL,
      updated_at TEXT,
      is_active INTEGER DEFAULT 1,

      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_clients_user
    ON clients(user_id);

    CREATE INDEX IF NOT EXISTS idx_clients_document
    ON clients(document_number);

    -------------------------------------------------------
    -- LOANS
    -------------------------------------------------------
    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      user_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,

      current_balance REAL NOT NULL,
      total_interest REAL DEFAULT 0,
      total_late_fees REAL DEFAULT 0,

      contract_number TEXT UNIQUE,
      loan_type TEXT DEFAULT 'personal',

      principal_amount REAL NOT NULL,
      disbursed_amount REAL NOT NULL,

      interest_rate REAL NOT NULL,
      interest_calculation_base TEXT NOT NULL,
      interest_rate_period TEXT NOT NULL,

      late_fee_type TEXT NOT NULL,
      late_fee_value REAL NOT NULL,

      amortization_type TEXT NOT NULL,
      installments INTEGER NOT NULL,

      start_date TEXT NOT NULL,
      due_date TEXT NOT NULL,

      payment_frequency TEXT NOT NULL,
      grace_days INTEGER DEFAULT 0,

      status TEXT NOT NULL,
      total_paid REAL DEFAULT 0,
      comments TEXT,

      created_at TEXT NOT NULL,
      updated_at TEXT,
      closed_at TEXT,

      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_loans_client
    ON loans(client_id);

    CREATE INDEX IF NOT EXISTS idx_loans_status
    ON loans(status);

    -------------------------------------------------------
    -- PAYMENTS
    -------------------------------------------------------
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      loan_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,

      amount REAL NOT NULL,
      capital_portion REAL,
      interest_portion REAL,
      late_fee_portion REAL,

      payment_method TEXT,
      reference_number TEXT,

      payment_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      status TEXT DEFAULT 'active', -- active | voided | replaced


      FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE RESTRICT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
    );

    -------------------------------------------------------
    -- payment_distributions
    -------------------------------------------------------
    CREATE TABLE IF NOT EXISTS payment_distributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_id INTEGER NOT NULL,
      installment_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      created_at TEXT NOT NULL,

      FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
      FOREIGN KEY (installment_id) REFERENCES loan_installments(id) ON DELETE RESTRICT
    );


    CREATE INDEX IF NOT EXISTS idx_payments_loan
    ON payments(loan_id);

    CREATE INDEX IF NOT EXISTS idx_payments_date
    ON payments(payment_date);


    -------------------------------------------------------
    -- loan_installments 
    -------------------------------------------------------

    CREATE TABLE IF NOT EXISTS loan_installments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_id INTEGER NOT NULL,

  installment_number INTEGER NOT NULL,
  due_date TEXT NOT NULL,

  scheduled_amount REAL NOT NULL,

  capital_amount REAL NOT NULL,
  interest_amount REAL NOT NULL,

  remaining_capital REAL NOT NULL,
  remaining_interest REAL NOT NULL,
  remaining_late_fee REAL DEFAULT 0,

  late_fee_accrued REAL DEFAULT 0,
  amount_paid REAL DEFAULT 0,

  status TEXT NOT NULL, -- pending | partial | paid | overdue

  created_at TEXT NOT NULL,
  updated_at TEXT,

  FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
);

    -------------------------------------------------------
    -- NOTIFICATIONS
    -------------------------------------------------------
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      data TEXT,
      created_at TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      is_dismissed INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_user
    ON notifications(user_id);

    CREATE INDEX IF NOT EXISTS idx_notifications_dismissed
    ON notifications(is_dismissed);

    -------------------------------------------------------
    -- ORGANIZATIONS (Business Data)
    -------------------------------------------------------
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      slogan TEXT,
      logo_path TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      rnc TEXT,
      currency TEXT DEFAULT 'DOP',
      created_at TEXT NOT NULL,
      updated_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_org_user
    ON organizations(user_id);

    -------------------------------------------------------
    -- QUOTA USAGE (Plan Control)
    -------------------------------------------------------
    CREATE TABLE IF NOT EXISTS quota_usage (
      id                       INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id                  INTEGER NOT NULL UNIQUE,
      cycle_start_date         TEXT    NOT NULL,
      total_clients            INTEGER DEFAULT 0,
      operations_this_month    INTEGER DEFAULT 0,
      invoices_this_month      INTEGER DEFAULT 0,
      historical_operations    INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_quota_user
    ON quota_usage(user_id);
    `);

      async function ensureColumns(tableName, expectedColumns) {
        const existingColumns = await database.getAllAsync(`PRAGMA table_info(${tableName});`);
        const existingNames = new Set(existingColumns.map(col => col.name));

        for (const column of expectedColumns) {
          if (!existingNames.has(column.name)) {
            try {
              await database.execAsync(
                `ALTER TABLE ${tableName} ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.defaultValue};`
              );
            } catch (error) {
              console.warn(`No se pudo agregar columna ${column.name} en ${tableName}:`, error);
            }
          }
        }
      }

      await ensureColumns('loans', [
        { name: 'user_id', type: 'INTEGER', defaultValue: 0 },
        { name: 'client_id', type: 'INTEGER', defaultValue: 0 },
        { name: 'current_balance', type: 'REAL', defaultValue: 0 },
        { name: 'total_interest', type: 'REAL', defaultValue: 0 },
        { name: 'total_late_fees', type: 'REAL', defaultValue: 0 },
        { name: 'contract_number', type: 'TEXT', defaultValue: "''" },
        { name: 'loan_type', type: 'TEXT', defaultValue: "'personal'" },
        { name: 'principal_amount', type: 'REAL', defaultValue: 0 },
        { name: 'disbursed_amount', type: 'REAL', defaultValue: 0 },
        { name: 'interest_rate', type: 'REAL', defaultValue: 0 },
        { name: 'interest_calculation_base', type: 'TEXT', defaultValue: "'monthly'" },
        { name: 'interest_rate_period', type: 'TEXT', defaultValue: "'monthly'" },
        { name: 'late_fee_type', type: 'TEXT', defaultValue: "'percentage'" },
        { name: 'late_fee_value', type: 'REAL', defaultValue: 0 },
        { name: 'amortization_type', type: 'TEXT', defaultValue: "'francesa'" },
        { name: 'installments', type: 'INTEGER', defaultValue: 0 },
        { name: 'start_date', type: 'TEXT', defaultValue: "''" },
        { name: 'due_date', type: 'TEXT', defaultValue: "''" },
        { name: 'payment_frequency', type: 'TEXT', defaultValue: "'monthly'" },
        { name: 'grace_days', type: 'INTEGER', defaultValue: 0 },
        { name: 'status', type: 'TEXT', defaultValue: "'active'" },
        { name: 'total_paid', type: 'REAL', defaultValue: 0 },
        { name: 'comments', type: 'TEXT', defaultValue: "''" },
        { name: 'created_at', type: 'TEXT', defaultValue: "''" },
        { name: 'updated_at', type: 'TEXT', defaultValue: "''" },
        { name: 'closed_at', type: 'TEXT', defaultValue: "''" },
      ]);

      await ensureColumns('clients', [
        { name: 'signature_svg', type: 'TEXT', defaultValue: "NULL" },
      ]);

      await ensureColumns('loan_installments', [
        { name: 'loan_id', type: 'INTEGER', defaultValue: 0 },
        { name: 'installment_number', type: 'INTEGER', defaultValue: 0 },
        { name: 'due_date', type: 'TEXT', defaultValue: "''" },
        { name: 'scheduled_amount', type: 'REAL', defaultValue: 0 },
        { name: 'capital_amount', type: 'REAL', defaultValue: 0 },
        { name: 'interest_amount', type: 'REAL', defaultValue: 0 },
        { name: 'remaining_capital', type: 'REAL', defaultValue: 0 },
        { name: 'remaining_interest', type: 'REAL', defaultValue: 0 },
        { name: 'remaining_late_fee', type: 'REAL', defaultValue: 0 },
        { name: 'late_fee_accrued', type: 'REAL', defaultValue: 0 },
        { name: 'amount_paid', type: 'REAL', defaultValue: 0 },
        { name: 'status', type: 'TEXT', defaultValue: "'pending'" },
        { name: 'created_at', type: 'TEXT', defaultValue: "''" },
        { name: 'updated_at', type: 'TEXT', defaultValue: "''" },
      ]);

      await ensureColumns('payments', [
        { name: 'status', type: 'TEXT', defaultValue: "'active'" },
        { name: 'updated_at', type: 'TEXT', defaultValue: "''" },
      ]);

      await ensureColumns('organizations', [
        { name: 'plan_type', type: 'TEXT', defaultValue: "'basic'" },
        { name: 'plan_hash', type: 'TEXT', defaultValue: "''" },
      ]);

      await ensureColumns('quota_usage', [
        { name: 'cycle_start_date', type: 'TEXT', defaultValue: "''" },
        { name: 'total_clients', type: 'INTEGER', defaultValue: 0 },
        { name: 'operations_this_month', type: 'INTEGER', defaultValue: 0 },
        { name: 'invoices_this_month', type: 'INTEGER', defaultValue: 0 },
        { name: 'historical_operations', type: 'INTEGER', defaultValue: 0 },
      ]);

      console.log("✅ Database initialized successfully");
    } catch (error) {
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}
