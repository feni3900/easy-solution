import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderNo } = await searchParams;

  if (!orderNo) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-muted-foreground">No order number provided.</p>
        <Link href="/shop"><Button className="mt-4">Browse Shop</Button></Link>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("web_orders")
    .select("*, courier_services(service_name)")
    .eq("order_no", orderNo)
    .single();

  if (!order) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Order not found.</p>
        <Link href="/shop"><Button className="mt-4">Browse Shop</Button></Link>
      </div>
    );
  }

  const courier = order.courier_services as { service_name?: string } | null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <CheckCircle className="mx-auto size-16 text-green-500" />
      <h1 className="mt-4 text-2xl font-bold">Order Placed Successfully!</h1>
      <p className="mt-2 text-muted-foreground">Thank you for your order.</p>

      <div className="mt-8 rounded-lg border bg-card p-6 text-left space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Order Number</span>
          <span className="font-mono font-medium">{orderNo}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Name</span>
          <span>{order.shipping_full_name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Phone</span>
          <span>{order.shipping_phone}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Address</span>
          <span className="text-right">{order.shipping_address}, {order.shipping_city}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Courier</span>
          <span>{courier?.service_name || "N/A"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Payment</span>
          <span>{order.payment_method}</span>
        </div>
        <div className="border-t pt-2 flex justify-between font-semibold">
          <span>Total</span>
          <span>৳{Number(order.total_amount).toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-6 flex gap-3 justify-center">
        <Link href="/shop">
          <Button>Continue Shopping <ArrowRight className="size-4 ml-2" /></Button>
        </Link>
      </div>
    </div>
  );
}
