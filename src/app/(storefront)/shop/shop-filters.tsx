"use client";

import { useRouter } from "next/navigation";

interface FilterOption {
  id: number;
  label: string;
}

export default function ShopFilters({
  categories,
  brands,
  category,
  brand,
}: {
  categories: FilterOption[];
  brands: FilterOption[];
  category: string;
  brand: string;
}) {
  const router = useRouter();

  const apply = (cat: string, br: string) => {
    const params = new URLSearchParams();
    if (cat) params.set("category", cat);
    if (br) params.set("brand", br);
    const qs = params.toString();
    router.push(qs ? `/shop?${qs}` : "/shop");
  };

  return (
    <div className="flex gap-2">
      <select
        className="rounded-lg border bg-card px-3 py-2 text-sm"
        defaultValue={category}
        onChange={(e) => apply(e.target.value, brand)}
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.label}</option>
        ))}
      </select>
      <select
        className="rounded-lg border bg-card px-3 py-2 text-sm"
        defaultValue={brand}
        onChange={(e) => apply(category, e.target.value)}
      >
        <option value="">All Brands</option>
        {brands.map((b) => (
          <option key={b.id} value={b.id}>{b.label}</option>
        ))}
      </select>
    </div>
  );
}