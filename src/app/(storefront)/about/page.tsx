import { Store, Truck, BadgePercent, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">About Us</h1>
      <p className="mt-4 text-muted-foreground">
        Maruf Enterprise runs a multi-company retail operation. Our storefront
        is powered directly by the ERP catalog — every product you see is synced
        live from our inventory, so pricing and availability are always accurate.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {[
          { icon: Store, title: "Live Catalog", desc: "Products, pricing and stock come straight from the ERP." },
          { icon: Truck, title: "Cash on Delivery", desc: "Order now and pay when your products arrive." },
          { icon: BadgePercent, title: "Bulk Discounts", desc: "Automatic discounts from 5% to 15% on larger orders." },
          { icon: ShieldCheck, title: "Trusted Retailer", desc: "Established brands across perfume, electronics and stationery." },
        ].map((f) => (
          <div key={f.title} className="flex items-start gap-3 rounded-lg border p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <f.icon className="size-5" />
            </div>
            <div>
              <p className="font-medium">{f.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl bg-primary/5 p-6 text-center">
        <h2 className="text-xl font-semibold">Ready to shop?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse our catalog and order with cash on delivery.
        </p>
        <Link
          href="/shop"
          className="mt-4 inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to Shop
        </Link>
      </div>
    </div>
  );
}
