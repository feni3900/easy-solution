"use client";

import { CrudManager, type CrudConfig } from "@/components/crud-manager";
import type { ColumnDef } from "@tanstack/react-table";

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string | null;
  balance: number;
  status: string;
}

const columns: ColumnDef<BankAccount>[] = [
  { accessorKey: "bank_name", header: "Bank" },
  { accessorKey: "account_number", header: "Account No." },
  {
    accessorKey: "balance",
    header: "Balance",
    cell: ({ row }) => `৳${Number(row.original.balance).toFixed(2)}`,
  },
  { accessorKey: "status", header: "Status" },
];

const config: CrudConfig<BankAccount> = {
  table: "bank_accounts",
  title: "Bank Account",
  description: "Bank accounts linked to branches.",
  searchKey: "bank_name",
  columns,
  defaultForm: { bank_name: "", account_number: "", balance: "0", status: "active" },
  toForm: (b) => ({
    bank_name: b.bank_name,
    account_number: b.account_number ?? "",
    balance: String(b.balance),
    status: b.status,
  }),
  fields: [
    { name: "bank_name", label: "Bank Name", required: true },
    { name: "account_number", label: "Account Number" },
    { name: "balance", label: "Balance" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ],
};

export function BanksClient({ rows }: { rows: BankAccount[] }) {
  return <CrudManager config={config} rows={rows} />;
}
