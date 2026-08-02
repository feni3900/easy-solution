import { redirect } from "next/navigation";

export default async function AccountsIndex() {
  redirect("/accounts/cashbook");
}
