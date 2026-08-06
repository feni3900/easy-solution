"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";
import { getClientLocale, t, fmtMoney, fmtInt, translateWithVars } from "@/lib/i18n";

interface Purchase {
  purchase_id: number;
  invoice_no: string;
  purchase_date: string;
  payment_type: string;
  total_amount: number;
  notes: string | null;
  suppliers: { supplier_name: string } | null;
}

interface PurchaseItem {
  purchase_item_id: number;
  quantity: number;
  unit_cost: number;
  selling_price: number | null;
  total_cost: number;
  products: {
    product_name: string;
    sku: string;
    size: string | null;
    unit: string | null;
    storage_location: string | null;
  } | null;
}

export default function PurchasesHistoryPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Purchase | null>(null);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const locale = getClientLocale();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("purchases")
        .select("*, suppliers(supplier_name)")
        .order("created_at", { ascending: false });
      setPurchases(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const viewDetails = async (purchase: Purchase) => {
    setSelected(purchase);
    setLoadingItems(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("purchase_items")
      .select("*, products(product_name, sku, size, unit, storage_location)")
      .eq("purchase_id", purchase.purchase_id);
    setItems(data ?? []);
    setLoadingItems(false);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("purchases.history.title", locale)}</h1>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">{t("purchases.purchaseNo", locale)}</th>
                <th className="p-3 text-left font-medium">{t("app.date", locale)}</th>
                <th className="p-3 text-left font-medium">{t("purchases.supplier", locale)}</th>
                <th className="p-3 text-center font-medium">{t("purchases.payment", locale)}</th>
                <th className="p-3 text-right font-medium">{t("app.total", locale)}</th>
                <th className="p-3 text-center font-medium">{t("purchases.details", locale)}</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.purchase_id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => viewDetails(p)}>
                  <td className="p-3 font-medium">
                    <span>{p.invoice_no}</span>
                    <Link
                      href={`/purchases/new?edit=${p.purchase_id}`}
                      title={translateWithVars(t("purchases.editTitle", locale), { no: p.invoice_no })}
                      className="ml-2 inline-flex items-center text-muted-foreground hover:text-primary"
                    >
                      <Pencil className="size-3.5" />
                    </Link>
                  </td>
                  <td className="p-3 text-muted-foreground">{p.purchase_date}</td>
                  <td className="p-3">{(p.suppliers as { supplier_name?: string })?.supplier_name ?? "-"}</td>
                  <td className="p-3 text-center">{p.payment_type}</td>
                  <td className="p-3 text-right">{fmtMoney(Number(p.total_amount), locale)}</td>
                  <td className="p-3 text-center">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); viewDetails(p); }}>{t("app.view", locale)}</Button>
                  </td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t("purchases.noPurchases", locale)}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex-row items-center justify-between">
            <DialogTitle>{selected?.invoice_no} — {t("purchases.purchaseItemsTitle", locale)}</DialogTitle>            {selected && (
              <Link href={`/purchases/new?edit=${selected.purchase_id}`}>
                <Button size="sm" variant="outline">
                  <Pencil className="size-3.5 mr-1" />{t("purchases.edit", locale)}
                </Button>
              </Link>
            )}
          </DialogHeader>
          {loadingItems ? (
            <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                <div>{t("purchases.dateLabel", locale)} {selected?.purchase_date}</div>
                <div>{t("purchases.paymentLabel", locale)} {selected?.payment_type}</div>
                <div>{t("purchases.totalLabel", locale)} {fmtMoney(Number(selected?.total_amount ?? 0), locale)}</div>
              </div>
              {selected?.notes && <div className="text-xs text-muted-foreground">{t("purchases.notesLabel", locale)} {selected.notes}</div>}
              <div className="rounded-lg border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">{t("sales.returns.product", locale)}</th>
                      <th className="p-2 text-left">{t("app.sku", locale)}</th>
                      <th className="p-2 text-left">{t("app.size", locale)}</th>
                      <th className="p-2 text-left">{t("app.unit", locale)}</th>
                      <th className="p-2 text-left">{t("app.location", locale)}</th>
                      <th className="p-2 text-center">{t("app.qty", locale)}</th>
                      <th className="p-2 text-right">{t("app.cost", locale)}</th>
                      <th className="p-2 text-right">{t("app.total", locale)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={item.purchase_item_id} className="border-b last:border-0">
                        <td className="p-2 text-muted-foreground">{fmtInt(i + 1, locale)}</td>
                        <td className="p-2 font-medium">{item.products?.product_name ?? "-"}</td>
                        <td className="p-2 text-xs">{item.products?.sku ?? "-"}</td>
                        <td className="p-2 text-xs">{item.products?.size ?? "-"}</td>
                        <td className="p-2 text-xs">{item.products?.unit ?? "-"}</td>
                        <td className="p-2 text-xs">{item.products?.storage_location ?? "-"}</td>
                        <td className="p-2 text-center">{fmtInt(item.quantity, locale)}</td>
                        <td className="p-2 text-right">{fmtMoney(Number(item.unit_cost), locale)}</td>
                        <td className="p-2 text-right font-medium">{fmtMoney(Number(item.total_cost), locale)}</td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr><td colSpan={9} className="p-4 text-center text-muted-foreground">{t("purchases.noItems", locale)}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
