-- ============================================================
-- SEED: Insert user profiles (run after full-schema.sql)
-- ============================================================

-- First, ensure RLS allows service role operations
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Service role can do everything" ON users;
DROP POLICY IF EXISTS "Authenticated users can read" ON users;

-- Allow service role full access
CREATE POLICY "Service role can do everything" ON users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to read their own profile
CREATE POLICY "Authenticated users can read" ON users
    FOR SELECT
    TO authenticated
    USING (true);

-- Insert user profiles (auth users must exist first)
INSERT INTO users (user_id, username, full_name, role_id, salesperson_nickname, is_active)
VALUES
    ('7daf020a-e500-40ef-9f07-24c59a7ba939', 'admin', 'Super Admin', 3, 'Admin', true),
    ('c9681ef4-b044-4789-9491-9943f9c66265', 'manager', 'Branch Manager', 2, 'Manager', true),
    ('b417a1b0-e95c-4991-b908-f6a38d18cdfa', 'sales', 'Sales Person', 1, 'Sales', true)
ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role_id = EXCLUDED.role_id,
    salesperson_nickname = EXCLUDED.salesperson_nickname;

-- Also enable RLS on other tables and add policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_due_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hold_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE courier_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles_permissions ENABLE ROW LEVEL SECURITY;

-- Allow service role full access on all tables
DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'categories', 'brands', 'products', 'product_variants',
        'suppliers', 'purchases', 'purchase_items', 'stock_journal',
        'customers', 'sales_invoices', 'sales_items', 'customer_due_payments',
        'hold_carts', 'web_carts', 'web_cart_items', 'web_orders',
        'order_items', 'web_settings', 'page_sections', 'contact_submissions',
        'audit_log', 'notifications', 'courier_services', 'bulk_discount_rules',
        'stock_alert_rules', 'roles_permissions'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS "Service role full access" ON %I',
            tbl
        );
        EXECUTE format(
            'CREATE POLICY "Service role full access" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)',
            tbl
        );
        EXECUTE format(
            'DROP POLICY IF EXISTS "Public read access" ON %I',
            tbl
        );
        EXECUTE format(
            'CREATE POLICY "Public read access" ON %I FOR SELECT TO anon USING (true)',
            tbl
        );
        EXECUTE format(
            'DROP POLICY IF EXISTS "Authenticated read access" ON %I',
            tbl
        );
        EXECUTE format(
            'CREATE POLICY "Authenticated read access" ON %I FOR SELECT TO authenticated USING (true)',
            tbl
        );
    END LOOP;
END $$;

-- Allow authenticated users full access (for now, can be restricted later)
DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'categories', 'brands', 'products', 'product_variants',
        'suppliers', 'purchases', 'purchase_items', 'stock_journal',
        'customers', 'sales_invoices', 'sales_items', 'customer_due_payments',
        'hold_carts', 'web_carts', 'web_cart_items', 'web_orders',
        'order_items', 'web_settings', 'page_sections', 'contact_submissions',
        'audit_log', 'notifications', 'courier_services', 'bulk_discount_rules',
        'stock_alert_rules', 'roles_permissions'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS "Authenticated full access" ON %I',
            tbl
        );
        EXECUTE format(
            'CREATE POLICY "Authenticated full access" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
            tbl
        );
    END LOOP;
END $$;
