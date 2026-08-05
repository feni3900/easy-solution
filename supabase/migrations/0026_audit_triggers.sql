-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (action, table_name, record_id, new_value)
    VALUES ('INSERT', TG_TABLE_NAME, NEW.product_id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (action, table_name, record_id, old_value, new_value)
    VALUES ('UPDATE', TG_TABLE_NAME, NEW.product_id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (action, table_name, record_id, old_value)
    VALUES ('DELETE', TG_TABLE_NAME, OLD.product_id, to_jsonb(OLD));
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
