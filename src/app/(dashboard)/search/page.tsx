import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { SearchResults } from "./search-results";

export const metadata = { title: "Search | Smart Solution ERP" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const supabase = await createClient();

  let products: { id: string; name: string; sku: string | null; barcode: string | null; selling_price: number }[] = [];
  let customers: { id: string; name: string; mobile: string }[] = [];
  let suppliers: { id: string; name: string; company: string | null }[] = [];
  let sales: { id: string; invoice_no: string | null; total: number; order_date: string }[] = [];
  let purchases: { id: string; purchase_no: string | null; total: number; purchase_date: string }[] = [];

  if (query) {
    const pattern = `%${query}%`;
    const [pRes, cRes, sRes, saRes, puRes] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, sku, barcode, selling_price")
        .or(`name.ilike.${pattern},sku.ilike.${pattern},barcode.ilike.${pattern}`)
        .limit(10),
      supabase
        .from("customers")
        .select("id, name, mobile")
        .or(`name.ilike.${pattern},mobile.ilike.${pattern}`)
        .limit(10),
      supabase
        .from("suppliers")
        .select("id, name, company")
        .or(`name.ilike.${pattern},company.ilike.${pattern}`)
        .limit(10),
      supabase
        .from("sales_orders")
        .select("id, invoice_no, total, order_date")
        .or(`invoice_no.ilike.${pattern}`)
        .limit(10),
      supabase
        .from("purchases")
        .select("id, purchase_no, total, purchase_date")
        .or(`purchase_no.ilike.${pattern}`)
        .limit(10),
    ]);
    products = pRes.data ?? [];
    customers = cRes.data ?? [];
    suppliers = sRes.data ?? [];
    sales = saRes.data ?? [];
    purchases = puRes.data ?? [];
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Global Search" description={`Results for "${query || "—"}"`} />
      <SearchResults
        query={query}
        products={products}
        customers={customers}
        suppliers={suppliers}
        sales={sales}
        purchases={purchases}
      />
    </div>
  );
}
