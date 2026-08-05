import { redirect } from "next/navigation";

export default async function InventoryIndex() {
  redirect("/inventory/products");
}
