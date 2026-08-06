import { createClient } from "@/lib/supabase/client";

interface JournalLineRow {
  debit: number;
  credit: number;
  account_id: number;
  description: string;
  journal_entries: { entry_date: string; entry_no: string }[] | null;
}

interface AccountRow {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
}

export interface LedgerRow {
  entry_date: string;
  entry_no: string;
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  debit: number;
  credit: number;
  description: string;
}

export interface AccountSummary {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  debit: number;
  credit: number;
  balance: number; // debit - credit
}

export async function fetchLedger(from: string, to: string): Promise<LedgerRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journal_entry_lines")
    .select("debit, credit, account_id, description, journal_entries(entry_date, entry_no)")
    .gte("journal_entries.entry_date", from)
    .lte("journal_entries.entry_date", to)
    .order("entry_date", { referencedTable: "journal_entries" });

  if (error) throw error;

  const accounts = await fetchAccounts();

  return (data ?? []).map((l: JournalLineRow) => {
    const entry = (l.journal_entries ?? [])[0] ?? {};
    const account = accounts.get(l.account_id);
    return {
      entry_date: entry.entry_date ?? from,
      entry_no: entry.entry_no ?? "",
      account_id: l.account_id,
      account_code: account?.account_code ?? "-",
      account_name: account?.account_name ?? "Deleted account",
      account_type: account?.account_type ?? "Expense",
      debit: Number(l.debit || 0),
      credit: Number(l.credit || 0),
      description: l.description ?? "",
    };
  });
}

export async function fetchAccounts(): Promise<Map<number, { account_code: string; account_name: string; account_type: string }>> {
  const supabase = createClient();
  const { data } = await supabase.from("chart_of_accounts").select("account_id, account_code, account_name, account_type");
  const map = new Map<number, { account_code: string; account_name: string; account_type: string }>();
  (data ?? []).forEach((a: AccountRow) => map.set(a.account_id, a));
  return map;
}

export function summarize(rows: LedgerRow[]): AccountSummary[] {
  const map = new Map<number, AccountSummary>();
  for (const r of rows) {
    const existing = map.get(r.account_id);
    if (existing) {
      existing.debit += r.debit;
      existing.credit += r.credit;
      existing.balance = existing.debit - existing.credit;
    } else {
      map.set(r.account_id, {
        account_id: r.account_id,
        account_code: r.account_code,
        account_name: r.account_name,
        account_type: r.account_type,
        debit: r.debit,
        credit: r.credit,
        balance: r.debit - r.credit,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.account_code.localeCompare(b.account_code));
}

export const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
