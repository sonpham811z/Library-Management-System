-- ============================================================
-- LIBRARY MANAGEMENT SYSTEM - SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ───────────────────────────────────────────────────
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'STAFF', 'READER')),
  phone VARCHAR(20),
  date_of_birth DATE,
  is_active BOOLEAN DEFAULT true,
  refresh_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── READER CARDS ────────────────────────────────────────────
CREATE TABLE reader_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'SUSPENDED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CATEGORIES ──────────────────────────────────────────────
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AUTHORS ─────────────────────────────────────────────────
CREATE TABLE authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PUBLISHERS ──────────────────────────────────────────────
CREATE TABLE publishers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BOOKS ───────────────────────────────────────────────────
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  cover_image TEXT,
  publish_year INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  available_quantity INTEGER NOT NULL DEFAULT 1,
  borrow_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BORROWED', 'RESERVED', 'LOST')),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES authors(id) ON DELETE SET NULL,
  publisher_id UUID REFERENCES publishers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BORROW RECORDS ──────────────────────────────────────────
CREATE TABLE borrow_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reader_id UUID NOT NULL REFERENCES users(id),
  book_id UUID NOT NULL REFERENCES books(id),
  staff_id UUID REFERENCES users(id),           -- staff who processed borrow
  staff_return_id UUID REFERENCES users(id),    -- staff who processed return
  borrow_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE,
  status VARCHAR(20) DEFAULT 'BORROWING' CHECK (status IN ('BORROWING', 'RETURNED', 'OVERDUE')),
  renewal_count INTEGER DEFAULT 0,
  fine_amount NUMERIC(10,0) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FINES ───────────────────────────────────────────────────
CREATE TABLE fines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reader_id UUID NOT NULL REFERENCES users(id),
  borrow_id UUID NOT NULL REFERENCES borrow_records(id),
  amount NUMERIC(10,0) NOT NULL,
  days_late INTEGER NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  paid_amount NUMERIC(10,0) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FINE RECEIPTS ───────────────────────────────────────────
CREATE TABLE fine_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reader_id UUID NOT NULL REFERENCES users(id),
  staff_id UUID NOT NULL REFERENCES users(id),
  amount NUMERIC(10,0) NOT NULL,
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RESERVATIONS ────────────────────────────────────────────
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reader_id UUID NOT NULL REFERENCES users(id),
  book_id UUID NOT NULL REFERENCES books(id),
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'HOLDING', 'CANCELLED', 'COMPLETED')),
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── LIBRARY POLICIES ────────────────────────────────────────
CREATE TABLE library_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value NUMERIC NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DEFAULT POLICY VALUES ───────────────────────────────────
INSERT INTO library_policies (key, value, description) VALUES
  ('MIN_READER_AGE',       18,   'Minimum age for reader card'),
  ('MAX_READER_AGE',       55,   'Maximum age for reader card'),
  ('CARD_VALIDITY_MONTHS', 6,    'Reader card validity in months'),
  ('MAX_BOOK_AGE_YEARS',   8,    'Maximum years since publication for book intake'),
  ('MAX_BORROW_BOOKS',     5,    'Maximum number of books a reader can borrow at once'),
  ('BORROW_DURATION_DAYS', 4,    'Default borrow duration in days'),
  ('FINE_PER_DAY',         1000, 'Fine per day for overdue books (VND)'),
  ('MAX_RENEWAL_TIMES',    1,    'Maximum number of renewals per borrow');

-- ─── DEFAULT ADMIN ACCOUNT ───────────────────────────────────
-- Password: Admin@123 (bcrypt hash — regenerate in production!)
INSERT INTO users (id, full_name, email, password_hash, role, is_active)
VALUES (
  uuid_generate_v4(),
  'System Administrator',
  'admin@library.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6o.5OmEqvW',
  'ADMIN',
  true
);

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_books_category ON books(category_id);
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_borrow_reader ON borrow_records(reader_id);
CREATE INDEX idx_borrow_book ON borrow_records(book_id);
CREATE INDEX idx_borrow_status ON borrow_records(status);
CREATE INDEX idx_borrow_due_date ON borrow_records(due_date);
CREATE INDEX idx_reservations_book ON reservations(book_id);
CREATE INDEX idx_reservations_reader ON reservations(reader_id);
CREATE INDEX idx_fines_reader ON fines(reader_id);

-- ─── DISABLE RLS (Backend handles auth) ──────────────────────
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE reader_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE books DISABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE fines DISABLE ROW LEVEL SECURITY;
ALTER TABLE fine_receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE library_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE authors DISABLE ROW LEVEL SECURITY;
ALTER TABLE publishers DISABLE ROW LEVEL SECURITY;
