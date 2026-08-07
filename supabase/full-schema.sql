-- ============================================================
-- ERP Inventory, POS & E-Commerce Platform — Full Schema
-- PostgreSQL (Supabase) — Version 1.0
-- ============================================================

-- Clean slate
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================

CREATE TYPE payment_type_enum AS ENUM ('Cash', 'Credit', 'Partial');
CREATE TYPE sale_channel_enum AS ENUM ('POS', 'ONLINE');
CREATE TYPE payment_status_enum AS ENUM ('Cash', 'Due', 'Partial Due', 'COD');
CREATE TYPE web_payment_method_enum AS ENUM ('COD', 'Instant Payment');
CREATE TYPE web_payment_status_enum AS ENUM ('Unpaid', 'Paid', 'Refunded');
CREATE TYPE order_status_enum AS ENUM ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Return_Requested', 'Returned');
CREATE TYPE order_item_status_enum AS ENUM ('Pending', 'Picked', 'Packed', 'Shipped', 'Delivered', 'Returned');
CREATE TYPE stock_movement_enum AS ENUM ('Purchase', 'Sale_POS', 'Sale_Online', 'Adjustment', 'Return_In', 'Damage', 'Write_Off');
CREATE TYPE alert_channel_enum AS ENUM ('In-App', 'Email', 'SMS', 'All');
CREATE TYPE account_status_enum AS ENUM ('Active', 'Blocked');
CREATE TYPE due_payment_mode_enum AS ENUM ('Cash', 'Bank Transfer', 'Mobile Banking', 'Other');

-- ============================================================
-- 2. ROLES & PERMISSIONS
-- ============================================================

CREATE TABLE roles_permissions (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    max_discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    allow_due BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO roles_permissions (role_name, max_discount_percentage, allow_due) VALUES
('Salesperson', 5.00, FALSE),
('Branch Manager', 15.00, TRUE),
('Admin', 100.00, TRUE),
('Guest', 0.00, FALSE);

-- ============================================================
-- 3. USERS (extends Supabase auth.users)
-- ============================================================

CREATE TABLE users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role_id INT NOT NULL REFERENCES roles_permissions(role_id),
    salesperson_nickname VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ NULL,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_active ON users(is_active);

-- ============================================================
-- 4. BULK DISCOUNT RULES
-- ============================================================

CREATE TABLE bulk_discount_rules (
    rule_id SERIAL PRIMARY KEY,
    min_quantity INT NOT NULL UNIQUE,
    discount_percentage DECIMAL(5,2) NOT NULL
);

INSERT INTO bulk_discount_rules (min_quantity, discount_percentage) VALUES
(2, 5.00),
(5, 10.00),
(12, 20.00);

-- ============================================================
-- 5. CATEGORIES (supports sub-categories)
-- ============================================================

CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    parent_category_id INT NULL REFERENCES categories(category_id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_categories_name ON categories(category_name);

-- ============================================================
-- 6. BRANDS
-- ============================================================

CREATE TABLE brands (
    brand_id SERIAL PRIMARY KEY,
    brand_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_brands_name ON brands(brand_name);

-- ============================================================
-- 7. PRODUCTS
-- ============================================================

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    category_id INT NOT NULL REFERENCES categories(category_id),
    brand_id INT NOT NULL REFERENCES brands(brand_id),
    product_name VARCHAR(200) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    variant_details VARCHAR(200) NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    current_stock INT NOT NULL DEFAULT 0,
    min_stock_threshold INT NOT NULL DEFAULT 5,
    description TEXT NULL,
    image_url VARCHAR(500) NULL,
    additional_images JSONB NULL,
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name ON products(product_name);
CREATE INDEX idx_products_active_stock ON products(is_active, current_stock);
CREATE INDEX idx_products_category ON products(category_id);

-- ============================================================
-- 8. PRODUCT VARIANTS
-- ============================================================

CREATE TABLE product_variants (
    variant_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    variant_key VARCHAR(50) NOT NULL,
    variant_value VARCHAR(100) NOT NULL,
    sku_override VARCHAR(100) NULL,
    stock_adjustment INT DEFAULT 0,
    price_adjustment DECIMAL(10,2) DEFAULT 0.00,
    UNIQUE (product_id, variant_key, variant_value)
);

CREATE INDEX idx_variants_sku_override ON product_variants(sku_override);

-- ============================================================
-- 9. SUPPLIERS
-- ============================================================

CREATE TABLE suppliers (
    supplier_id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    company_name VARCHAR(100),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suppliers_phone ON suppliers(phone);

-- ============================================================
-- 10. PURCHASES
-- ============================================================

CREATE TABLE purchases (
    purchase_id SERIAL PRIMARY KEY,
    supplier_id INT NOT NULL REFERENCES suppliers(supplier_id) ON DELETE RESTRICT,
    invoice_no VARCHAR(100) UNIQUE NOT NULL,
    purchase_date DATE NOT NULL,
    payment_type payment_type_enum NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    notes TEXT NULL,
    created_by UUID NULL REFERENCES users(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchases_invoice ON purchases(invoice_no);
CREATE INDEX idx_purchases_date ON purchases(purchase_date);

-- ============================================================
-- 11. PURCHASE ITEMS
-- ============================================================

CREATE TABLE purchase_items (
    purchase_item_id SERIAL PRIMARY KEY,
    purchase_id INT NOT NULL REFERENCES purchases(purchase_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(product_id),
    quantity INT NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NULL,
    total_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED
);

CREATE INDEX idx_purchase_items_product ON purchase_items(product_id);

-- ============================================================
-- 12. STOCK JOURNAL
-- ============================================================

CREATE TABLE stock_journal (
    journal_id BIGSERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(product_id),
    movement_type stock_movement_enum NOT NULL,
    quantity_change INT NOT NULL,
    stock_before INT NOT NULL,
    stock_after INT NOT NULL,
    reference_id INT NULL,
    reference_no VARCHAR(100) NULL,
    notes TEXT NULL,
    created_by UUID NULL REFERENCES users(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_journal_product_date ON stock_journal(product_id, created_at);
CREATE INDEX idx_stock_journal_type ON stock_journal(movement_type);

-- ============================================================
-- 13. STOCK ALERT RULES
-- ============================================================

CREATE TABLE stock_alert_rules (
    rule_id SERIAL PRIMARY KEY,
    product_id INT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    min_stock INT NOT NULL DEFAULT 5,
    alert_channel alert_channel_enum DEFAULT 'In-App',
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_stock_alert_active ON stock_alert_rules(is_active, product_id);

-- ============================================================
-- 14. CUSTOMERS
-- ============================================================

CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    mobile_number VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(150),
    address TEXT,
    city VARCHAR(100),
    previous_due DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_lifetime_spent DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    account_status account_status_enum DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_mobile ON customers(mobile_number);
CREATE INDEX idx_customers_name ON customers(full_name);

-- ============================================================
-- 15. SALES INVOICES (POS)
-- ============================================================

CREATE TABLE sales_invoices (
    invoice_id SERIAL PRIMARY KEY,
    invoice_no VARCHAR(100) UNIQUE NOT NULL,
    sale_date TIMESTAMPTZ DEFAULT NOW(),
    channel sale_channel_enum NOT NULL DEFAULT 'POS',
    salesperson_nickname VARCHAR(100) NOT NULL,
    customer_id INT NULL REFERENCES customers(customer_id),
    subtotal DECIMAL(12,2) NOT NULL,
    bulk_discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    manual_discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    courier_charge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    due_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    previous_due_added DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    payment_status payment_status_enum NOT NULL,
    discount_override_reason TEXT NULL,
    notes TEXT NULL,
    created_by UUID NULL REFERENCES users(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_no ON sales_invoices(invoice_no);
CREATE INDEX idx_invoices_date_channel ON sales_invoices(sale_date, channel);
CREATE INDEX idx_invoices_customer ON sales_invoices(customer_id);

-- ============================================================
-- 16. SALES ITEMS
-- ============================================================

CREATE TABLE sales_items (
    sales_item_id SERIAL PRIMARY KEY,
    invoice_id INT NOT NULL REFERENCES sales_invoices(invoice_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(product_id),
    product_name_snapshot VARCHAR(200) NOT NULL,
    variant_id INT NULL REFERENCES product_variants(variant_id) ON DELETE SET NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    discount_applied DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(12,2) NOT NULL
);

CREATE INDEX idx_sales_items_invoice ON sales_items(invoice_id);

-- ============================================================
-- 17. CUSTOMER DUE PAYMENTS
-- ============================================================

CREATE TABLE customer_due_payments (
    payment_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(customer_id),
    invoice_id INT NULL REFERENCES sales_invoices(invoice_id) ON DELETE SET NULL,
    amount_paid DECIMAL(12,2) NOT NULL,
    payment_mode due_payment_mode_enum NOT NULL,
    transaction_ref VARCHAR(100) NULL,
    remarks TEXT NULL,
    recorded_by UUID NULL REFERENCES users(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_due_payments_customer ON customer_due_payments(customer_id);
CREATE INDEX idx_due_payments_invoice ON customer_due_payments(invoice_id);

-- ============================================================
-- 18. HOLD CARTS (POS temporary storage)
-- ============================================================

CREATE TABLE hold_carts (
    hold_id SERIAL PRIMARY KEY,
    session_token VARCHAR(128) UNIQUE NOT NULL,
    salesperson_nickname VARCHAR(100) NOT NULL,
    customer_mobile VARCHAR(20) NULL,
    customer_name_snapshot VARCHAR(150) NULL,
    cart_payload_json JSONB NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    restored_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_hold_carts_session ON hold_carts(session_token);
CREATE INDEX idx_hold_carts_salesperson ON hold_carts(salesperson_nickname, created_at);

-- ============================================================
-- 19. COURIER SERVICES
-- ============================================================

CREATE TABLE courier_services (
    service_id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    base_rate DECIMAL(10,2) NOT NULL,
    per_kg_rate DECIMAL(10,2) DEFAULT 0.00,
    max_weight_kg DECIMAL(5,2) DEFAULT 50.00,
    min_delivery_days INT,
    max_delivery_days INT,
    coverage_zones JSONB NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 20. WEB CARTS
-- ============================================================

CREATE TABLE web_carts (
    cart_id VARCHAR(128) PRIMARY KEY,
    customer_id INT NULL REFERENCES customers(customer_id),
    guest_email VARCHAR(200) NULL,
    total_items INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_web_carts_customer ON web_carts(customer_id);
CREATE INDEX idx_web_carts_updated ON web_carts(updated_at);

-- ============================================================
-- 21. WEB CART ITEMS
-- ============================================================

CREATE TABLE web_cart_items (
    id SERIAL PRIMARY KEY,
    cart_id VARCHAR(128) NOT NULL REFERENCES web_carts(cart_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(product_id),
    variant_id INT NULL REFERENCES product_variants(variant_id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_web_cart_items_cart ON web_cart_items(cart_id);

-- ============================================================
-- 22. WEB ORDERS
-- ============================================================

CREATE TABLE web_orders (
    order_id SERIAL PRIMARY KEY,
    order_no VARCHAR(100) UNIQUE NOT NULL,
    web_cart_id VARCHAR(128) NULL,
    customer_id INT REFERENCES customers(customer_id),
    shipping_full_name VARCHAR(150) NOT NULL,
    shipping_phone VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100) NOT NULL,
    shipping_postal_code VARCHAR(20) NULL,
    courier_service_id INT NULL REFERENCES courier_services(service_id),
    courier_charge DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    bulk_discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL,
    payment_method web_payment_method_enum NOT NULL,
    payment_status web_payment_status_enum DEFAULT 'Unpaid',
    order_status order_status_enum DEFAULT 'Pending',
    cancel_reason TEXT NULL,
    tracking_number VARCHAR(100) NULL,
    delivered_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_web_orders_no ON web_orders(order_no);
CREATE INDEX idx_web_orders_customer ON web_orders(customer_id);
CREATE INDEX idx_web_orders_status_created ON web_orders(order_status, created_at);

-- ============================================================
-- 23. ORDER ITEMS
-- ============================================================

CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES web_orders(order_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(product_id),
    product_name_snapshot VARCHAR(200) NOT NULL,
    variant_id INT NULL REFERENCES product_variants(variant_id) ON DELETE SET NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    status order_item_status_enum DEFAULT 'Pending',
    returned_quantity INT DEFAULT 0
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================================
-- 24. WEB SETTINGS (CMS)
-- ============================================================

CREATE TABLE web_settings (
    setting_id SERIAL PRIMARY KEY,
    store_name VARCHAR(150) DEFAULT 'My ERP Store',
    tagline TEXT NULL,
    logo_url VARCHAR(500) NULL,
    favicon_url VARCHAR(500) NULL,
    courier_flat_rate DECIMAL(10,2) DEFAULT 60.00,
    free_shipping_threshold DECIMAL(12,2) NULL,
    online_cod_enabled BOOLEAN DEFAULT TRUE,
    online_payment_gateway_enabled BOOLEAN DEFAULT FALSE,
    seo_title VARCHAR(255) NULL,
    seo_description TEXT NULL,
    contact_email VARCHAR(150) NULL,
    contact_phone VARCHAR(20) NULL,
    whatsapp_number VARCHAR(20) NULL,
    operating_hours TEXT NULL,
    facebook_url VARCHAR(255) NULL,
    instagram_url VARCHAR(255) NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 25. PAGE SECTIONS (CMS)
-- ============================================================

CREATE TABLE page_sections (
    section_id SERIAL PRIMARY KEY,
    page_name VARCHAR(20) NOT NULL,
    section_number INT NOT NULL,
    hero_title VARCHAR(255) NULL,
    hero_subtitle TEXT NULL,
    banner_image_url VARCHAR(500) NULL,
    col1_title VARCHAR(150),
    col1_desc TEXT,
    col1_icon VARCHAR(100),
    col2_title VARCHAR(150),
    col2_desc TEXT,
    col2_icon VARCHAR(100),
    col3_title VARCHAR(150),
    col3_desc TEXT,
    col3_icon VARCHAR(100),
    featured_products_tab_label VARCHAR(100) NULL,
    best_sellers_tab_label VARCHAR(100) NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (page_name, section_number)
);

-- ============================================================
-- 26. CONTACT SUBMISSIONS
-- ============================================================

CREATE TABLE contact_submissions (
    submission_id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(200) NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 27. AUDIT LOG
-- ============================================================

CREATE TABLE audit_log (
    log_id BIGSERIAL PRIMARY KEY,
    user_id UUID NULL REFERENCES users(user_id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id INT,
    old_value JSONB NULL,
    new_value JSONB NULL,
    ip_address VARCHAR(45) NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- ============================================================
-- 28. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id UUID NULL REFERENCES users(user_id),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(500) NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ============================================================
-- 29. AUTO-UPDATE TRIGGERS
-- ============================================================

-- Update products.updated_at on change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_customers_updated
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_web_orders_updated
    BEFORE UPDATE ON web_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_web_carts_updated
    BEFORE UPDATE ON web_carts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_web_settings_updated
    BEFORE UPDATE ON web_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 30. STOCK DEDUCTION FUNCTION (atomic)
-- ============================================================

CREATE OR REPLACE FUNCTION deduct_stock(
    p_product_id INT,
    p_quantity INT,
    p_movement_type stock_movement_enum,
    p_reference_id INT DEFAULT NULL,
    p_reference_no VARCHAR DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_stock INT;
    v_new_stock INT;
BEGIN
    SELECT current_stock INTO v_current_stock
    FROM products WHERE product_id = p_product_id FOR UPDATE;

    IF v_current_stock IS NULL THEN
        RAISE EXCEPTION 'Product not found: %', p_product_id;
    END IF;

    IF v_current_stock < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock for product %: available %, requested %',
            p_product_id, v_current_stock, p_quantity;
    END IF;

    v_new_stock := v_current_stock - p_quantity;

    UPDATE products SET current_stock = v_new_stock WHERE product_id = p_product_id;

    INSERT INTO stock_journal (product_id, movement_type, quantity_change, stock_before, stock_after,
                               reference_id, reference_no, notes, created_by)
    VALUES (p_product_id, p_movement_type, -p_quantity, v_current_stock, v_new_stock,
            p_reference_id, p_reference_no, p_notes, p_created_by);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 31. ADD STOCK FUNCTION (from purchases)
-- ============================================================

CREATE OR REPLACE FUNCTION add_stock(
    p_product_id INT,
    p_quantity INT,
    p_movement_type stock_movement_enum DEFAULT 'Purchase',
    p_reference_id INT DEFAULT NULL,
    p_reference_no VARCHAR DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_stock INT;
    v_new_stock INT;
BEGIN
    SELECT current_stock INTO v_current_stock
    FROM products WHERE product_id = p_product_id FOR UPDATE;

    IF v_current_stock IS NULL THEN
        RAISE EXCEPTION 'Product not found: %', p_product_id;
    END IF;

    v_new_stock := v_current_stock + p_quantity;

    UPDATE products SET current_stock = v_new_stock WHERE product_id = p_product_id;

    INSERT INTO stock_journal (product_id, movement_type, quantity_change, stock_before, stock_after,
                               reference_id, reference_no, notes, created_by)
    VALUES (p_product_id, p_movement_type, p_quantity, v_current_stock, v_new_stock,
            p_reference_id, p_reference_no, p_notes, p_created_by);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 32. SEED DATA
-- ============================================================

-- Web Settings
INSERT INTO web_settings (store_name, tagline, contact_email, contact_phone, whatsapp_number, operating_hours)
VALUES ('Smart ERP Store', 'Quality Products, Best Prices', 'info@smarterp.com', '+880 1700-000000', '+880 1700-000000', 'Sat-Thu: 9AM - 9PM');

-- Page Sections — Home
INSERT INTO page_sections (page_name, section_number, hero_title, hero_subtitle, col1_title, col1_desc, col1_icon, col2_title, col2_desc, col2_icon, col3_title, col3_desc, col3_icon)
VALUES ('home', 1, 'Welcome to Smart ERP Store', 'Your one-stop shop for quality products', 'Fast Delivery', 'Quick and reliable courier delivery nationwide', 'fa-truck-fast', 'Authentic Products', '100% genuine products with warranty', 'fa-certificate', 'Secure Payment', 'Cash on delivery and online payment options', 'fa-shield-halved');

-- Page Sections — About
INSERT INTO page_sections (page_name, section_number, hero_title, hero_subtitle, col1_title, col1_desc, col1_icon, col2_title, col2_desc, col2_icon, col3_title, col3_desc, col3_icon)
VALUES ('about', 1, 'Our Story', 'Building trust through quality', 'Direct Sourcing', 'We source directly from manufacturers', 'fa-industry', 'Quality Control', 'Every product passes rigorous QC', 'fa-magnifying-glass', 'Customer Care', 'Dedicated support for every customer', 'fa-heart');

-- Page Sections — Contact
INSERT INTO page_sections (page_name, section_number, hero_title, hero_subtitle, col1_title, col1_desc, col1_icon, col2_title, col2_desc, col2_icon, col3_title, col3_desc, col3_icon)
VALUES ('contact', 1, 'Get In Touch', 'We are here to help', 'Visit Us', '123 Business Road, Dhaka 1000', 'fa-location-dot', 'Call Us', '+880 1700-000000', 'fa-phone', 'Email Us', 'info@smarterp.com', 'fa-envelope');

-- Courier Services
INSERT INTO courier_services (service_name, base_rate, per_kg_rate, min_delivery_days, max_delivery_days)
VALUES ('Standard Delivery', 60.00, 10.00, 2, 5),
       ('Express Delivery', 120.00, 15.00, 1, 2),
       ('Same Day Delivery', 200.00, 20.00, 0, 0);
