-- Generic audit trigger function (no hardcoded column references)
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  rec_id INT;
  row_data JSONB;
BEGIN
  row_data := to_jsonb(CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END);

  -- Extract the primary key generically from the row JSON.
  -- ->'key' returns NULL for missing keys, so this never errors
  -- regardless of which table the trigger is attached to.
  rec_id := COALESCE(
    (row_data->>'product_id')::INT,
    (row_data->>'invoice_id')::INT,
    (row_data->>'order_id')::INT,
    (row_data->>'purchase_id')::INT,
    (row_data->>'customer_id')::INT,
    (row_data->>'supplier_id')::INT,
    (row_data->>'id')::INT
  );

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (action, table_name, record_id, new_value)
    VALUES ('INSERT', TG_TABLE_NAME, rec_id, row_data);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (action, table_name, record_id, old_value, new_value)
    VALUES ('UPDATE', TG_TABLE_NAME, rec_id, to_jsonb(OLD), row_data);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (action, table_name, record_id, old_value)
    VALUES ('DELETE', TG_TABLE_NAME, rec_id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_products ON public.products;
DROP TRIGGER IF EXISTS audit_sales_invoices ON public.sales_invoices;
DROP TRIGGER IF EXISTS audit_web_orders ON public.web_orders;
DROP TRIGGER IF EXISTS audit_purchases ON public.purchases;
DROP TRIGGER IF EXISTS audit_customers ON public.customers;
DROP TRIGGER IF EXISTS audit_suppliers ON public.suppliers;

CREATE TRIGGER audit_products
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_sales_invoices
  AFTER INSERT OR UPDATE OR DELETE ON public.sales_invoices
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_web_orders
  AFTER INSERT OR UPDATE OR DELETE ON public.web_orders
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_purchases
  AFTER INSERT OR UPDATE OR DELETE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_customers
  AFTER INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_suppliers
  AFTER INSERT OR UPDATE OR DELETE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
