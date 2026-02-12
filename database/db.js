import * as SQLite from "expo-sqlite";

let db = null;

export async function getDatabase() {
  if (!db) {
    db = await SQLite.openDatabaseAsync("loan_manager.db");
  }
  return db;
}

// Alias para compatibilidad con user.service.js
export async function getDb() {
  return await getDatabase();
}

export async function initializeDatabase() {
  const database = await getDatabase();

  // Activar claves foráneas (muy importante)
  await database.execAsync(`PRAGMA foreign_keys = ON;`);

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
      created_at TEXT NOT NULL,
      last_login TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_users_active
    ON users(is_active);

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

      contract_number TEXT UNIQUE,
      loan_type TEXT DEFAULT 'personal',

      principal_amount REAL NOT NULL,
      disbursed_amount REAL NOT NULL,

      interest_rate REAL NOT NULL,
      interest_calculation_base TEXT NOT NULL,

      late_fee_type TEXT NOT NULL,
      late_fee_value REAL NOT NULL,

      start_date TEXT NOT NULL,
      due_date TEXT NOT NULL,

      payment_frequency TEXT NOT NULL,
      grace_days INTEGER DEFAULT 0,

      status TEXT NOT NULL,
      total_paid REAL DEFAULT 0,

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

      FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE RESTRICT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_payments_loan
    ON payments(loan_id);

    CREATE INDEX IF NOT EXISTS idx_payments_date
    ON payments(payment_date);
  `);

  console.log("✅ Database initialized successfully");
}
