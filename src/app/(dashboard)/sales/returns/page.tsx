"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getClientLocale, t, fmtMoney, fmtInt, translateWithVars } from "@/lib/i18n";

interface OrderOption {
  id: string;
  invoice_no: string;
  source: "pos" | "web";
  date: string;
  total: number;
}

interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  product_name: string;
}

interface SalesReturn {
  id: string;
  date: string;
  quantity: number;
  reason: string | null;
  product_id: number;
  productName?: string;
}

function getProductName(products: { product_id: number; name: string }[], productId: number) {
  return products.find((p) => String(p.product_id) === String(productId))?.name ?? "—";
}

const makeColumns = (locale: "en" | "bn"): ColumnDef<SalesReturn>[] => [
  {
    accessorKey: "date",
    header: t("app.date", locale),
    cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
  },
  { header: t("sales.returns.product", locale), cell: ({ row }) => row.original.productName ?? "—" },
  { accessorKey: "quantity", header: t("app.qty", locale), cell: ({ row }) => fmtInt(row.original.quantity, locale) },
  { accessorKey: "reason", header: t("sales.reason", locale) },
];

export default function SalesReturnsPage() {
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [orderOptions, setOrderOptions] = useState<OrderOption[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<{ product_id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [form, setForm] = useState({
    order_key: "",
    product_id: "",
    quantity: "1",
    reason: "",
  });
  const locale = getClientLocale();
  const columns = makeColumns(locale);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const [returnsRes, posRes, webRes, productsRes, posItemsRes, webItemsRes] = await Promise.all([
      supabase
        .from("sales_returns")
        .select("*")
        .order("date", { ascending: false }),
      supabase
        .from("sales_invoices")
        .select("invoice_id, invoice_no, sale_date, total_amount"),
      supabase
        .from("web_orders")
        .select("order_id, order_no, created_at, total_amount"),
      supabase
        .from("products")
        .select("product_id, product_name"),
      supabase
        .from("sales_items")
        .select("invoice_id, product_id, quantity"),
      supabase
        .from("order_items")
        .select("order_id, product_id, quantity"),
    ]);

    setReturns(returnsRes.data ?? []);
    setProducts((productsRes.data ?? []).map(p => ({ product_id: p.product_id, name: p.product_name })));

    const allReturned = new Map<string, number>();
    (returnsRes.data ?? []).forEach((r) => {
      const key = String(r.product_id);
      allReturned.set(key, (allReturned.get(key) ?? 0) + Number(r.quantity));
    });

    const posItemMap = new Map<number, number>();
    (posItemsRes.data ?? []).forEach((item) => {
      const key = item.invoice_id;
      const remaining = Number(item.quantity) - (allReturned.get(String(item.product_id)) ?? 0);
      if (remaining > 0) posItemMap.set(key, (posItemMap.get(key) ?? 0) + 1);
    });

    const webItemMap = new Map<number, number>();
    (webItemsRes.data ?? []).forEach((item) => {
      const key = item.order_id;
      const remaining = Number(item.quantity) - (allReturned.get(String(item.product_id)) ?? 0);
      if (remaining > 0) webItemMap.set(key, (webItemMap.get(key) ?? 0) + 1);
    });

    const allOptions: OrderOption[] = [
      ...(posRes.data ?? [])
        .filter((inv) => posItemMap.has(inv.invoice_id))
        .map((inv) => ({
          id: String(inv.invoice_id),
          invoice_no: inv.invoice_no,
          source: "pos" as const,
          date: inv.sale_date,
          total: inv.total_amount,
        })),
      ...(webRes.data ?? [])
        .filter((ord) => webItemMap.has(ord.order_id))
        .map((ord) => ({
          id: String(ord.order_id),
          invoice_no: ord.order_no,
          source: "web" as const,
          date: ord.created_at,
          total: ord.total_amount,
        })),
    ];

    const seen = new Set<string>();
    const options = allOptions
      .filter((o) => {
        if (seen.has(o.invoice_no)) return false;
        seen.add(o.invoice_no);
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setOrderOptions(options);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadOrderItems = async (orderKey: string) => {
    const option = orderOptions.find((o) => `${o.source}-${o.id}` === orderKey);
    if (!option) return;

    const supabase = createClient();

    if (option.source === "pos") {
      const { data } = await supabase
        .from("sales_items")
        .select("product_id, quantity, unit_price, product_name_snapshot")
        .eq("invoice_id", option.id);
      setOrderItems(
        (data ?? []).map((item) => ({
          product_id: String(item.product_id),
          quantity: item.quantity,
          unit_price: item.unit_price,
          product_name: item.product_name_snapshot,
        }))
      );
    } else {
      const { data } = await supabase
        .from("order_items")
        .select("product_id, quantity, unit_price, product_name_snapshot")
        .eq("order_id", option.id);
      setOrderItems(
        (data ?? []).map((item) => ({
          product_id: String(item.product_id),
          quantity: item.quantity,
          unit_price: item.unit_price,
          product_name: item.product_name_snapshot,
        }))
      );
    }

    setForm((f) => ({ ...f, product_id: "", quantity: "1" }));
  };

  const selectedItem = orderItems.find((i) => i.product_id === form.product_id);
  const maxQty = selectedItem?.quantity ?? 1;

  const filteredReturns = returns.filter((r) => {
    const d = new Date(r.date);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const handleSave = async () => {
    if (!form.product_id || !form.quantity) return;
    setSaving(true);
    const supabase = createClient();

    const option = orderOptions.find((o) => `${o.source}-${o.id}` === form.order_key);
    const item = orderItems.find((i) => i.product_id === form.product_id);
    const returnQty = Number(form.quantity);
    const returnAmount = returnQty * Number(item?.unit_price ?? 0);

  const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("sales_returns").insert({
      product_id: form.product_id,
      quantity: returnQty,
      reason: form.reason || null,
      invoice_id: option?.source === "pos" ? Number(option.id) : null,
      source: option?.source ?? "pos",
    });
    if (error) {
      alert(`${t("pos.error", locale)} ${error.message}`);
      setSaving(false);
      return;
    }

    // Restore stock for the returned product
    const { error: stockError } = await supabase.rpc("add_stock", {
      p_product_id: Number(form.product_id),
      p_quantity: returnQty,
      p_movement_type: "Return_In",
      p_reference_id: option?.source === "pos" ? Number(option.id) : null,
      p_reference_no: option?.invoice_no ?? null,
      p_notes: "Sales return",
      p_created_by: user?.id ?? null,
    });
    if (stockError) {
      alert(`${t("sales.returns.stockFailed", locale)} ${stockError.message}`);
    }

    if (option?.source === "pos") {
      const { data: inv } = await supabase
        .from("sales_invoices")
        .select("total_amount, paid_amount, due_amount")
        .eq("invoice_id", option.id)
        .single();
      if (inv) {
        const newTotal = Math.max(0, Number(inv.total_amount) - returnAmount);
        const newPaid = Math.min(Number(inv.paid_amount), newTotal);
        const newDue = Math.max(0, newTotal - newPaid);
        await supabase
          .from("sales_invoices")
          .update({
            total_amount: newTotal,
            paid_amount: newPaid,
            due_amount: newDue,
            payment_status: newDue <= 0 ? "Cash" : newPaid > 0 ? "Partial Due" : "Due",
          })
          .eq("invoice_id", option.id);
      }
    } else if (option?.source === "web") {
      const { data: ord } = await supabase
        .from("web_orders")
        .select("total_amount, paid_amount")
        .eq("order_id", option.id)
        .single();
      if (ord) {
        const newTotal = Math.max(0, Number(ord.total_amount) - returnAmount);
        const newPaid = Math.min(Number(ord.paid_amount), newTotal);
        const newDue = Math.max(0, newTotal - newPaid);
        await supabase
          .from("web_orders")
          .update({
            total_amount: newTotal,
            payment_status: newDue <= 0 ? "Paid" : newPaid > 0 ? "Partial" : "Unpaid",
          })
          .eq("order_id", option.id);
      }
    }

    setForm({ order_key: "", product_id: "", quantity: "1", reason: "" });
    setOrderItems([]);
    setOpen(false);
    load();
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title={t("sales.returns.title", locale)} description={t("sales.returns.desc", locale)} />
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) {
              setForm({ order_key: "", product_id: "", quantity: "1", reason: "" });
              setOrderItems([]);
            }
          }}
        >
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4 mr-2" />
            {t("sales.returns.record", locale)}
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("sales.returns.recordTitle", locale)}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>{t("sales.returns.invoiceOrder", locale)}</Label>
                <select
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={form.order_key}
                  onChange={(e) => {
                    setForm({ ...form, order_key: e.target.value });
                    loadOrderItems(e.target.value);
                  }}
                >
                  <option value="">{t("sales.returns.selectInvoice", locale)}</option>
                  {orderOptions.map((opt) => (
                    <option key={`${opt.source}-${opt.id}`} value={`${opt.source}-${opt.id}`}>
                      {opt.invoice_no} ({opt.source === "pos" ? "POS" : "Online"}) — {fmtMoney(Number(opt.total), locale)}
                    </option>
                  ))}
                </select>
              </div>
              {form.order_key && orderItems.length > 0 && (
                <div className="grid gap-2">
                  <Label>{t("sales.returns.product", locale)}</Label>
                  <select
                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={form.product_id}
                    onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                  >
                    <option value="">{t("sales.returns.selectProduct", locale)}</option>
                    {orderItems.map((item) => (
                      <option key={item.product_id} value={item.product_id}>
                        {item.product_name} × {item.quantity}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {form.product_id && (
                <>
                  <div className="grid gap-2">
                    <Label>{translateWithVars(t("sales.returns.qtyMax", locale), { n: fmtInt(maxQty, locale) })}</Label>
                    <Input
                      type="number"
                      min={1}
                      max={maxQty}
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("sales.reason", locale)}</Label>
                    <Input
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      placeholder={t("sales.returns.reasonPh", locale)}
                    />
                  </div>
                </>
              )}
              <Button
                onClick={handleSave}
                disabled={saving || !form.product_id || !form.quantity}
              >
                {saving && <Loader2 className="size-4 animate-spin mr-2" />}
                {t("sales.returns.record", locale)}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">{t("sales.returns.from", locale)}</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">{t("sales.returns.to", locale)}</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[160px]"
              />
            </div>
            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>
                {t("sales.returns.clear", locale)}
              </Button>
            )}
          </div>
          <DataTable columns={columns} data={filteredReturns.map(r => ({ ...r, productName: getProductName(products, r.product_id) }))} searchKey="reason" />
        </div>
      )}
    </div>
  );
}
