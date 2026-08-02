import { AlertTriangle } from "lucide-react";

interface Product {
  id: string;
  name: string;
  minimum_stock: number;
  product_variants: { stock_quantity: number }[];
}

export function LowStockList({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        All products are in good stock.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {products.slice(0, 6).map((p) => {
        const stock = (p.product_variants ?? []).reduce(
          (s, v) => s + Number(v.stock_quantity ?? 0),
          0
        );
        return (
          <li
            key={p.id}
            className="flex items-center justify-between gap-2 rounded-lg border p-2.5"
          >
            <div className="flex min-w-0 items-center gap-2">
              <AlertTriangle className="size-4 shrink-0 text-destructive" />
              <span className="truncate text-sm">{p.name}</span>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-destructive">{stock}</p>
              <p className="text-xs text-muted-foreground">
                min {Number(p.minimum_stock)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
