"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
      <h1 className="text-2xl font-semibold">Purchase History</h1>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Invoice #</th>
                <th className="p-3 text-left font-medium">Date</th>
                <th className="p-3 text-left font-medium">Supplier</th>
                <th className="p-3 text-center font-medium">Payment</th>
                <th className="p-3 text-right font-medium">Total</th>
                <th className="p-3 text-center font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.purchase_id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => viewDetails(p)}>
                  <td className="p-3 font-medium">{p.invoice_no}</td>
                  <td className="p-3 text-muted-foreground">{p.purchase_date}</td>
                  <td className="p-3">{(p.suppliers as { supplier_name?: string })?.supplier_name ?? "-"}</td>
                  <td className="p-3 text-center">{p.payment_type}</td>
                  <td className="p-3 text-right">৳{Number(p.total_amount).toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); viewDetails(p); }}>View</Button>
                  </td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No purchases recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected?.invoice_no} — Purchase Items</DialogTitle>
          </DialogHeader>
          {loadingItems ? (
            <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                <div>Date: {selected?.purchase_date}</div>
                <div>Payment: {selected?.payment_type}</div>
                <div>Total: ৳{Number(selected?.total_amount ?? 0).toFixed(2)}</div>
              </div>
              {selected?.notes && <div className="text-xs text-muted-foreground">Notes: {selected.notes}</div>}
              <div className="rounded-lg border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">Product</th>
                      <th className="p-2 text-left">SKU</th>
                      <th className="p-2 text-left">Size</th>
                      <th className="p-2 text-left">Unit</th>
                      <th className="p-2 text-left">Location</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Cost</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={item.purchase_item_id} className="border-b last:border-0">
                        <td className="p-2 text-muted-foreground">{i + 1}</td>
                        <td className="p-2 font-medium">{item.products?.product_name ?? "-"}</td>
                        <td className="p-2 text-xs">{item.products?.sku ?? "-"}</td>
                        <td className="p-2 text-xs">{item.products?.size ?? "-"}</td>
                        <td className="p-2 text-xs">{item.products?.unit ?? "-"}</td>
                        <td className="p-2 text-xs">{item.products?.storage_location ?? "-"}</td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        <td className="p-2 text-right">৳{Number(item.unit_cost).toFixed(2)}</td>
                        <td className="p-2 text-right font-medium">৳{Number(item.total_cost).toFixed(2)}</td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr><td colSpan={9} className="p-4 text-center text-muted-foreground">No items found.</td></tr>
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
