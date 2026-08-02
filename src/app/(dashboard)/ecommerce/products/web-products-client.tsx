"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, TrendingUp, Clock, Loader2 } from "lucide-react";
import { useState } from "react";

type FlagKey = "is_popular" | "is_best_seller" | "is_coming_soon";

interface WebProduct {
  id: string;
  name: string;
  selling_price: number;
  image: string | null;
  status: string;
  is_popular: boolean;
  is_best_seller: boolean;
  is_coming_soon: boolean;
  categories?: { name: string }[] | { name: string } | null;
  brands?: { name: string }[] | { name: string } | null;
}

const getName = (v: { name: string }[] | { name: string } | null | undefined) =>
  Array.isArray(v) ? v[0]?.name : v?.name;

export function WebProductsClient({ products }: { products: WebProduct[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);

  const toggle = async (id: string, key: FlagKey) => {
    setSaving(id);
    const supabase = createClient();
    await supabase
      .from("products")
      .update({ [key]: !products.find((p) => p.id === id)?.[key] })
      .eq("id", id);
    setSaving(null);
    router.refresh();
  };

  const columns: ColumnDef<WebProduct>[] = [
    {
      header: "Product",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-lg">
            {row.original.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.original.image} alt={row.original.name} className="h-full w-full object-cover" />
            ) : (
              <span>📦</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">
              {getName(row.original.categories) ?? "—"} {getName(row.original.brands) ? `· ${getName(row.original.brands)}` : ""}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Price",
      cell: ({ row }) => `৳${Number(row.original.selling_price).toFixed(2)}`,
    },
    {
      header: "Popular",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          disabled={saving === row.original.id}
          onClick={() => toggle(row.original.id, "is_popular")}
        >
          <Star className={`size-4 ${row.original.is_popular ? "fill-amber-500 text-amber-500" : ""}`} />
        </Button>
      ),
    },
    {
      header: "Best Seller",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          disabled={saving === row.original.id}
          onClick={() => toggle(row.original.id, "is_best_seller")}
        >
          <TrendingUp className={`size-4 ${row.original.is_best_seller ? "fill-emerald-500 text-emerald-500" : ""}`} />
        </Button>
      ),
    },
    {
      header: "Coming Soon",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          disabled={saving === row.original.id}
          onClick={() => toggle(row.original.id, "is_coming_soon")}
        >
          <Clock className={`size-4 ${row.original.is_coming_soon ? "fill-primary text-primary" : ""}`} />
        </Button>
      ),
    },
    {
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "active" ? "default" : "outline"} className="capitalize">
          {row.original.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border p-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Star className="size-3.5 text-amber-500" /> Popular (home)</span>
        <span className="flex items-center gap-1"><TrendingUp className="size-3.5 text-emerald-500" /> Best Seller (home)</span>
        <span className="flex items-center gap-1"><Clock className="size-3.5 text-primary" /> Coming Soon (home)</span>
        {saving && <Loader2 className="size-3.5 animate-spin" />}
      </div>
      <DataTable columns={columns} data={products} searchKey="name" />
    </div>
  );
}
