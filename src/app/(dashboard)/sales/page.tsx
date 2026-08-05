import { redirect } from "next/navigation";

export default async function SalesIndex() {
  redirect("/sales/invoices");
}
