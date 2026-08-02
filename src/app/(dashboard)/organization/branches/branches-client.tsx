"use client";

import { CrudManager, type CrudConfig } from "@/components/crud-manager";
import type { ColumnDef } from "@tanstack/react-table";

interface Branch {
  id: string;
  name: string;
  country: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  companies?: { name: string } | null;
}

const columns: ColumnDef<Branch>[] = [
  { accessorKey: "name", header: "Name" },
  {
    header: "Company",
    cell: ({ row }) => row.original.companies?.name ?? "—",
  },
  { accessorKey: "country", header: "Country" },
  { accessorKey: "city", header: "City" },
  { accessorKey: "status", header: "Status" },
];

const config: CrudConfig<Branch> = {
  table: "branches",
  title: "Branch",
  description: "A branch belongs to a company and has its own stock locations.",
  searchKey: "name",
  columns,
  defaultForm: {
    company_id: "",
    name: "",
    country: "",
    city: "",
    phone: "",
    email: "",
    address: "",
    status: "active",
  },
  toForm: (b) => ({
    name: b.name,
    country: b.country ?? "",
    city: b.city ?? "",
    phone: b.phone ?? "",
    email: b.email ?? "",
    status: b.status,
  }),
  fields: [
    { name: "name", label: "Branch Name", required: true, placeholder: "e.g. Dhaka Main" },
    { name: "country", label: "Country" },
    { name: "city", label: "City" },
    { name: "phone", label: "Phone" },
    { name: "email", label: "Email" },
    { name: "status", label: "Status", type: "select", options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ]},
  ],
};

export function BranchesClient({
  branches,
  companies,
}: {
  branches: Branch[];
  companies: { id: string; name: string }[];
}) {
  const configWithCompanies: CrudConfig<Branch> = {
    ...config,
    fields: [
      {
        name: "company_id",
        label: "Company",
        type: "select",
        required: true,
        options: companies.map((c) => ({ value: c.id, label: c.name })),
      },
      ...config.fields,
    ],
    defaultForm: {
      ...config.defaultForm,
      company_id: companies[0]?.id ?? "",
    },
  };

  return <CrudManager config={configWithCompanies} rows={branches} />;
}
