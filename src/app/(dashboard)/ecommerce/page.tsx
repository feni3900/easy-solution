import { redirect } from "next/navigation";

export default async function EcommerceIndex() {
  redirect("/ecommerce/products");
}
