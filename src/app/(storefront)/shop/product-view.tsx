"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, LayoutGrid, Rows3 } from "lucide-react";
import { t, fmtMoney, fmtInt, translateWithVars, type Locale } from "@/lib/i18n";

export interface ShopProduct {
  product_id: number;
  product_name: string;
  sku: string;
  selling_price: number;
  image_url: string | null;
  current_stock: number;
  size: string | null;
  unit: string | null;
  categories:
    | { category_name: string }
    | { category_name: string }[]
    | null;
  brands: { brand_name: string } | { brand_name: string }[] | null;
}

type ViewMode = "gallery" | "table";

function categoryName(c: ShopProduct["categories"]): string {
  return (Array.isArray(c) ? c[0]?.category_name : c?.category_name) ?? "";
}

function brandName(b: ShopProduct["brands"]): string {
  return (Array.isArray(b) ? b[0]?.brand_name : b?.brand_name) ?? "";
}

export default function ProductView({
  products,
  locale,
  bulkDiscountPct,
  bulkDiscountMin,
}: {
  products: ShopProduct[];
  locale: Locale;
  bulkDiscountPct: number;
  bulkDiscountMin: number;
}) {
  const [view, setView] = useState<ViewMode>("gallery");

  useEffect(() => {
    const saved = localStorage.getItem("shopView");
    if (saved === "gallery" || saved === "table") setView(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("shopView", view);
  }, [view]);

  const toggleButton = (mode: ViewMode) =>
    `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
      view === mode
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-muted"
    }`;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{fmtInt(products.length, locale)}</p>
        <div className="flex rounded-lg border bg-card p-0.5">
          <button type="button" onClick={() => setView("gallery")} className={toggleButton("gallery")}>
            <LayoutGrid className="size-3.5" />
            {t("store.shop.viewGallery", locale)}
          </button>
          <button type="button" onClick={() => setView("table")} className={toggleButton("table")}>
            <Rows3 className="size-3.5" />
            {t("store.shop.viewTable", locale)}
          </button>
        </div>
      </div>

      {view === "gallery" ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {products.map((p) => (
            <Link
              key={p.product_id}
              href={`/product/${p.product_id}`}
              className="group rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <div className="aspect-square rounded-md bg-muted mb-3 flex items-center justify-center overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.product_name} className="h-full w-full object-cover" />
                ) : (
                  <Package className="size-8 text-muted-foreground" />
                )}
              </div>
              <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary">
                {p.product_name}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {categoryName(p.categories)}
                {brandName(p.brands) ? ` · ${brandName(p.brands)}` : ""}
                {p.size ? ` · ${p.size}` : ""}
                {p.unit ? ` ${p.unit}` : ""}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{fmtMoney(Number(p.selling_price), locale)}</p>
                  <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                    {translateWithVars(t("store.bulkOff", locale), { p: fmtInt(bulkDiscountPct, locale), m: fmtInt(bulkDiscountMin, locale) })}
                  </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.current_stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {p.current_stock > 0 ? t("store.inStock", locale) : t("store.outOfStock", locale)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="p-3 font-medium">{t("pos.item", locale)}</th>
                <th className="p-3 font-medium">{t("pos.price", locale)}</th>
                <th className="p-3 font-medium">{t("pos.currentStock", locale)}</th>
                <th className="p-3 font-medium text-right">{t("pos.action", locale)}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.product_id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-3">
                    <Link href={`/product/${p.product_id}`} className="flex items-center gap-3">
                      <div className="size-12 shrink-0 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.product_name} className="h-full w-full object-cover" />
                        ) : (
                          <Package className="size-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium line-clamp-1">{p.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[categoryName(p.categories), brandName(p.brands), p.size ? `${p.size}${p.unit ? ` ${p.unit}` : ""}` : p.unit]
                            .filter(Boolean)
                            .join(" · ") || p.sku}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="font-semibold">{fmtMoney(Number(p.selling_price), locale)}</span>
                    <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                      {translateWithVars(t("store.bulkOff", locale), { p: fmtInt(bulkDiscountPct, locale), m: fmtInt(bulkDiscountMin, locale) })}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.current_stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {p.current_stock > 0 ? t("store.inStock", locale) : t("store.outOfStock", locale)}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/product/${p.product_id}`} className="text-sm font-medium text-primary hover:underline">
                      {t("store.view", locale)}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
