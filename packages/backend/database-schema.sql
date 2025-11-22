-- Example SQL schema for Neon PostgreSQL
-- This schema supports tickets, orders, and customers tables

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tickets_org_user ON tickets(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_org_status ON tickets(organization_id, status);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_org_user ON orders(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_orders_org_order_number ON orders(organization_id, order_number);

-- Seed data for testing
INSERT INTO organizations (id, name)
VALUES
  ('org_1', 'Test Organization 1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO customers (id, organization_id, name, email)
VALUES
  ('cust_1', 'org_1', 'John Doe', 'john@example.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tickets (id, user_id, organization_id, title, description, status, priority)
VALUES
  ('tick_1', 'user_1', 'org_1', 'Login issue', 'User cannot log in to the dashboard', 'open', 'high')
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, user_id, organization_id, order_number, status, total_amount, currency)
VALUES
  ('order_1', 'user_1', 'org_1', 'ORD-1001', 'delivered', 49.99, 'USD')
ON CONFLICT (id) DO NOTHING;
