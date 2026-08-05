"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface ResultSection {
  title: string;
  empty: string;
  items: { id: string; title: string; subtitle: string; href: string }[];
}

export function SearchResults({
  query,
  products,
  customers,
  suppliers,
  sales,
  purchases,
}: {
  query: string;
  products: { id: string; name: string; sku: string | null; barcode: string | null; selling_price: number }[];
  customers: { id: string; name: string; mobile: string }[];
  suppliers: { id: string; name: string; company: string | null }[];
  sales: { id: string; invoice_no: string | null; total: number; order_date: string }[];
  purchases: { id: string; purchase_no: string | null; total: number; purchase_date: string }[];
}) {
  if (!query) {
    return (
      <p className="rounded-lg border py-16 text-center text-sm text-muted-foreground">
        Type a search term above to search products, customers, suppliers, invoices, purchases and sales.
      </p>
    );
  }

  const sections: ResultSection[] = [
    {
      title: "Products",
      empty: "No products found",
      items: products.map((p) => ({
        id: p.id,
        title: p.name,
        subtitle: `${p.sku ?? ""} · ৳${Number(p.selling_price).toFixed(2)}`,
        href: "/inventory/products",
      })),
    },
    {
      title: "Customers",
      empty: "No customers found",
      items: customers.map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: c.mobile,
        href: "/customers",
      })),
    },
    {
      title: "Suppliers",
      empty: "No suppliers found",
      items: suppliers.map((s) => ({
        id: s.id,
        title: s.name,
        subtitle: s.company ?? "",
        href: "/purchases/suppliers",
      })),
    },
    {
      title: "Sales Orders",
      empty: "No sales found",
      items: sales.map((o) => ({
        id: o.id,
        title: o.invoice_no ?? "—",
        subtitle: `৳${Number(o.total).toFixed(2)} · ${new Date(o.order_date).toLocaleDateString()}`,
        href: "/sales/invoices",
      })),
    },
    {
      title: "Purchases",
      empty: "No purchases found",
      items: purchases.map((p) => ({
        id: p.id,
        title: p.purchase_no ?? "—",
        subtitle: `৳${Number(p.total).toFixed(2)} · ${new Date(p.purchase_date).toLocaleDateString()}`,
        href: "/purchases/history",
      })),
    },
  ];

  const totalResults = sections.reduce((s, sec) => s + sec.items.length, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">
            {totalResults} result{totalResults === 1 ? "" : "s"} found
          </CardTitle>
        </CardHeader>
      </Card>
      {sections.map((sec) => (
        <Card key={sec.title}>
          <CardHeader>
            <CardTitle className="text-sm">{sec.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {sec.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">{sec.empty}</p>
            ) : (
              <ul className="divide-y">
                {sec.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="flex items-center justify-between gap-2 py-2 text-sm hover:underline"
                    >
                      <span className="font-medium">{item.title}</span>
                      <span className="text-muted-foreground">{item.subtitle}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
