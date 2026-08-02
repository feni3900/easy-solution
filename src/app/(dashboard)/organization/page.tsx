import { redirect } from "next/navigation";

export default async function OrganizationIndex() {
  redirect("/organization/companies");
}
