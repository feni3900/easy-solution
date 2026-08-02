import { redirect } from "next/navigation";

export default async function ReportsIndex() {
  redirect("/reports/sales");
}
