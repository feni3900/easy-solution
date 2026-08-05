import { redirect } from "next/navigation";

export default async function PurchasesIndex() {
  redirect("/purchases/history");
}
