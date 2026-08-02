import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Order {
  id: string;
  invoice_no: string | null;
  total: number;
  status: string;
  sales_channel: string;
  order_date: string;
  customers: { name: string }[] | { name: string } | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  approved: "bg-blue-500/10 text-blue-600",
  completed: "bg-emerald-500/10 text-emerald-600",
  cancelled: "bg-red-500/10 text-red-600",
};

export function RecentOrders({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No orders yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Channel</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((o) => (
          <TableRow key={o.id}>
            <TableCell className="font-medium">{o.invoice_no ?? "—"}</TableCell>
            <TableCell>
              {Array.isArray(o.customers)
                ? o.customers[0]?.name ?? "Walk-in"
                : o.customers?.name ?? "Walk-in"}
            </TableCell>
            <TableCell className="uppercase">{o.sales_channel}</TableCell>
            <TableCell>
              <Badge
                className={`${statusColors[o.status] ?? ""} border-0 capitalize`}
              >
                {o.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">৳{Number(o.total).toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
