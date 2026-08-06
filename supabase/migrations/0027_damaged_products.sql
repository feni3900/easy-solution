-- Create damaged_products table (run in Supabase SQL Editor)
CREATE TABLE IF NOT EXISTS damaged_products (
    id BIGSERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(product_id),
    quantity INT NOT NULL,
    reason TEXT NULL,
    date TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NULL REFERENCES users(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_damaged_products_product ON damaged_products(product_id);
CREATE INDEX IF NOT EXISTS idx_damaged_products_date ON damaged_products(date);

ALTER TABLE damaged_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON damaged_products;
CREATE POLICY "Service role full access" ON damaged_products FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read access" ON damaged_products;
CREATE POLICY "Public read access" ON damaged_products FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Authenticated full access" ON damaged_products;
CREATE POLICY "Authenticated full access" ON damaged_products FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.damaged_products TO authenticated;
GRANT SELECT ON public.damaged_products TO anon;
GRANT ALL ON public.damaged_products TO service_role;
