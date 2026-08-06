"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowDownToLine, ArrowUpFromLine, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Account {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
}

interface Entry {
  entry_id: number;
  entry_no: string;
  entry_date: string;
  description: string;
  amount: number;
  direction: "in" | "out";
  account_name: string;
}

interface Customer {
  customer_id: number;
  full_name: string | null;
  mobile_number: string;
}

interface Supplier {
  supplier_id: number;
  supplier_name: string;
  phone: string;
}

export default function CashRegisterPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingIn, setSavingIn] = useState(false);
  const [savingOut, setSavingOut] = useState(false);

  const [inDate, setInDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [inAmount, setInAmount] = useState("");
  const [inAccount, setInAccount] = useState("");
  const [inNote, setInNote] = useState("");
  const [inCustomerSearch, setInCustomerSearch] = useState("");
  const [inCustomerResults, setInCustomerResults] = useState<Customer[]>([]);
  const [inCustomer, setInCustomer] = useState<Customer | null>(null);
  const [inCustomerDue, setInCustomerDue] = useState(0);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [outDate, setOutDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [outAmount, setOutAmount] = useState("");
  const [outAccount, setOutAccount] = useState("");
  const [outNote, setOutNote] = useState("");
  const [outSupplierSearch, setOutSupplierSearch] = useState("");
  const [outSupplierResults, setOutSupplierResults] = useState<Supplier[]>([]);
  const [outSupplier, setOutSupplier] = useState<Supplier | null>(null);
  const [outSupplierDue, setOutSupplierDue] = useState(0);
  const [searchingSuppliers, setSearchingSuppliers] = useState(false);
  const supplierSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const revenueAccounts = accounts.filter((a) => a.account_type === "Revenue");
  const expenseAccounts = accounts.filter((a) => a.account_type === "Expense");

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [accRes, entryRes] = await Promise.all([
      supabase.from("chart_of_accounts").select("*").eq("is_active", true).order("account_code"),
      supabase.from("journal_entries").select("*, journal_entry_lines(*), chart_of_accounts!journal_entry_lines(account_code, account_name, account_type)").order("entry_id", { ascending: false }).limit(100),
    ]);
    setAccounts(accRes.data ?? []);
    const rows: Entry[] = (entryRes.data ?? []).map((e: any) => {
      const lines = e.journal_entry_lines ?? [];
      const cashLine = lines.find((l: any) => l.credit > 0 && l.debit === 0);
      const opposite = lines.find((l: any) => l.account_id !== cashLine?.account_id);
      const dir = cashLine ? "out" : "in";
      const amount = dir === "out"
        ? (lines.find((l: any) => l.debit > 0)?.debit ?? 0)
        : (lines.find((l: any) => l.credit > 0)?.credit ?? 0);
      const account = (e.chart_of_accounts ?? []).find((a: any) => a.account_id === opposite?.account_id);
      return {
        entry_id: e.entry_id,
        entry_no: e.entry_no,
        entry_date: e.entry_date,
        description: e.description,
        amount: Number(amount),
        direction: dir,
        account_name: account?.account_name ?? "Cash",
      };
    });
    setEntries(rows);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const searchCustomers = (value: string) => {
    setInCustomerSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!value.trim()) {
      setInCustomerResults([]);
      setSearchingCustomers(false);
      return;
    }
    setSearchingCustomers(true);
    searchTimer.current = setTimeout(async () => {
      const supabase = createClient();
      const term = `%${value.trim()}%`;
      const { data } = await supabase
        .from("customers")
        .select("customer_id, full_name, mobile_number")
        .or(`full_name.ilike.${term},mobile_number.ilike.${term}`)
        .order("full_name", { ascending: true })
        .limit(10);
      setInCustomerResults(data ?? []);
      setSearchingCustomers(false);
    }, 300);
  };

  const selectCustomer = async (customer: Customer) => {
    setInCustomer(customer);
    setInCustomerSearch("");
    setInCustomerResults([]);
    setInCustomerDue(0);
    const supabase = createClient();
    const { data } = await supabase
      .from("sales_invoices")
      .select("due_amount")
      .eq("customer_id", customer.customer_id)
      .gt("due_amount", 0);
    setInCustomerDue((data ?? []).reduce((s, i) => s + Number(i.due_amount), 0));
  };

  const getCustomerDue = async (customerId: number) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("sales_invoices")
      .select("invoice_id, due_amount, paid_amount, payment_status")
      .eq("customer_id", customerId)
      .gt("due_amount", 0)
      .order("sale_date", { ascending: true });
    return data ?? [];
  };

  const searchSuppliers = (value: string) => {
    setOutSupplierSearch(value);
    if (supplierSearchTimer.current) clearTimeout(supplierSearchTimer.current);
    if (!value.trim()) {
      setOutSupplierResults([]);
      setSearchingSuppliers(false);
      return;
    }
    setSearchingSuppliers(true);
    supplierSearchTimer.current = setTimeout(async () => {
      const supabase = createClient();
      const term = `%${value.trim()}%`;
      const { data } = await supabase
        .from("suppliers")
        .select("supplier_id, supplier_name, phone")
        .or(`supplier_name.ilike.${term},phone.ilike.${term}`)
        .order("supplier_name", { ascending: true })
        .limit(10);
      setOutSupplierResults(data ?? []);
      setSearchingSuppliers(false);
    }, 300);
  };

  const selectSupplier = async (supplier: Supplier) => {
    setOutSupplier(supplier);
    setOutSupplierSearch("");
    setOutSupplierResults([]);
    setOutSupplierDue(0);
    const supabase = createClient();
    const { data } = await supabase
      .from("purchases")
      .select("due_amount")
      .eq("supplier_id", supplier.supplier_id)
      .gt("due_amount", 0);
    setOutSupplierDue((data ?? []).reduce((s, p) => s + Number(p.due_amount), 0));
  };

  const getSupplierDue = async (supplierId: number) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("purchases")
      .select("purchase_id, due_amount, paid_amount, payment_type, invoice_no")
      .eq("supplier_id", supplierId)
      .gt("due_amount", 0)
      .order("purchase_date", { ascending: true });
    return data ?? [];
  };

  const postEntry = async (direction: "in" | "out") => {
    const date = direction === "in" ? inDate : outDate;
    const amount = direction === "in" ? parseFloat(inAmount) : parseFloat(outAmount);
    const inCat = inAccount; // may be "due" | "owner" | "loan" | numeric account id
    const accountId = direction === "in" ? (isNaN(parseInt(inCat)) ? 0 : parseInt(inCat)) : parseInt(outAccount);
    const note = (direction === "in" ? inNote : outNote).trim();

    if (!amount || amount <= 0) { alert("Please enter an amount."); return; }
    if (direction === "in" ? !inCat : !outAccount) { alert("Please choose a category."); return; }

    direction === "in" ? setSavingIn(true) : setSavingOut(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const entryNo = "JE-" + date.replace(/-/g, "") + "-" + Math.floor(1000 + Math.random() * 9000);

    const cashAccount = accounts.find((a) => a.account_code === "1000")?.account_id;
    if (!cashAccount) { alert("Cash account not found."); direction === "in" ? setSavingIn(false) : setSavingOut(false); return; }

    // Special handling: customer due received (by customer, no invoice number)
    if (direction === "in" && inCat === "due") {
      if (!inCustomer) { alert("Please select a customer."); setSavingIn(false); return; }
      if (inCustomerDue <= 0) { alert("This customer has no due remaining."); setSavingIn(false); return; }
      if (amount > inCustomerDue) { alert(`Amount exceeds the customer's total due (৳${inCustomerDue.toFixed(2)}).`); setSavingIn(false); return; }

      const arAccount = accounts.find((a) => a.account_code === "1200")?.account_id;
      if (!arAccount) { alert("Accounts Receivable account not found."); setSavingIn(false); return; }

      const desc = note || `Customer due payment from ${inCustomer.full_name ?? ""}`.trim();
      const { data: entry, error: entryError } = await supabase
        .from("journal_entries")
        .insert([{ entry_no: entryNo, entry_date: date, description: desc, reference_type: "CustomerDue", created_by: user?.id ?? null }])
        .select("entry_id")
        .single();
      if (entryError) { alert("Error: " + entryError.message); setSavingIn(false); return; }

      const { error: linesError } = await supabase.from("journal_entry_lines").insert([
        { entry_id: entry.entry_id, account_id: cashAccount, debit: amount, credit: 0 },
        { entry_id: entry.entry_id, account_id: arAccount, debit: 0, credit: amount },
      ]);
      if (linesError) { alert("Lines error: " + linesError.message); setSavingIn(false); return; }

      // Deduct from the customer's total due across invoices (oldest first)
      const dueInvoices = await getCustomerDue(inCustomer.customer_id);
      let remaining = amount;
      for (const inv of dueInvoices) {
        if (remaining <= 0) break;
        const invoiceDue = Number(inv.due_amount);
        if (invoiceDue <= 0) continue;
        const apply = Math.min(remaining, invoiceDue);
        const newPaid = Number(inv.paid_amount) + apply;
        const newDue = Math.max(0, invoiceDue - apply);
        const newStatus = newDue <= 0 ? "Cash" : "Partial Due";
        await supabase
          .from("sales_invoices")
          .update({ paid_amount: newPaid, due_amount: newDue, payment_status: newStatus })
          .eq("invoice_id", inv.invoice_id);
        await supabase.from("customer_due_payments").insert([{
          customer_id: inCustomer.customer_id,
          invoice_id: inv.invoice_id,
          amount_paid: apply,
          payment_mode: "Cash",
          transaction_ref: null,
          remarks: desc,
          recorded_by: user?.id ?? null,
        }]);
        remaining = Number((remaining - apply).toFixed(2));
      }

      setInAmount(""); setInAccount(""); setInNote(""); setInCustomer(null); setInCustomerSearch(""); setInCustomerResults([]); setInCustomerDue(0);
      setInDate(new Date().toISOString().slice(0, 10));
      setSavingIn(false);
      load();
      return;
    }

    // Special handling: owner investment, loan received, bank withdrawal
    if (direction === "in" && (inCat === "owner" || inCat === "loan" || inCat === "bank_withdrawal")) {
      const otherCode = inCat === "owner" ? "3200" : inCat === "loan" ? "2100" : "1100";
      const otherAccount = accounts.find((a) => a.account_code === otherCode)?.account_id;
      if (!otherAccount) { alert("Account not found."); setSavingIn(false); return; }

      const desc = note || (inCat === "owner" ? "Owner investment" : inCat === "loan" ? "Loan received" : "Bank withdrawal");
      const { data: entry, error: entryError } = await supabase
        .from("journal_entries")
        .insert([{ entry_no: entryNo, entry_date: date, description: desc, reference_type: "CashRegister", created_by: user?.id ?? null }])
        .select("entry_id")
        .single();
      if (entryError) { alert("Error: " + entryError.message); setSavingIn(false); return; }

      const { error: linesError } = await supabase.from("journal_entry_lines").insert([
        { entry_id: entry.entry_id, account_id: cashAccount, debit: amount, credit: 0 },
        { entry_id: entry.entry_id, account_id: otherAccount, debit: 0, credit: amount },
      ]);
      if (linesError) { alert("Lines error: " + linesError.message); setSavingIn(false); return; }

      setInAmount(""); setInAccount(""); setInNote("");
      setInDate(new Date().toISOString().slice(0, 10));
      setSavingIn(false);
      load();
      return;
    }

    // Special handling: supplier due paid (by supplier, cash out)
    if (direction === "out" && outAccount === "supplier_due") {
      if (!outSupplier) { alert("Please select a supplier."); setSavingOut(false); return; }
      if (outSupplierDue <= 0) { alert("This supplier has no due remaining."); setSavingOut(false); return; }
      if (amount > outSupplierDue) { alert(`Amount exceeds the supplier's total due (৳${outSupplierDue.toFixed(2)}).`); setSavingOut(false); return; }

      const apAccount = accounts.find((a) => a.account_code === "2000")?.account_id;
      if (!apAccount) { alert("Accounts Payable account not found."); setSavingOut(false); return; }

      const desc = note || `Supplier due payment to ${outSupplier.supplier_name}`.trim();
      const { data: entry, error: entryError } = await supabase
        .from("journal_entries")
        .insert([{ entry_no: entryNo, entry_date: date, description: desc, reference_type: "SupplierDue", created_by: user?.id ?? null }])
        .select("entry_id")
        .single();
      if (entryError) { alert("Error: " + entryError.message); setSavingOut(false); return; }

      const { error: linesError } = await supabase.from("journal_entry_lines").insert([
        { entry_id: entry.entry_id, account_id: apAccount, debit: amount, credit: 0 },
        { entry_id: entry.entry_id, account_id: cashAccount, debit: 0, credit: amount },
      ]);
      if (linesError) { alert("Lines error: " + linesError.message); setSavingOut(false); return; }

      // Deduct from the supplier's total due across purchases (oldest first)
      const duePurchases = await getSupplierDue(outSupplier.supplier_id);
      let remaining = amount;
      for (const p of duePurchases) {
        if (remaining <= 0) break;
        const purchaseDue = Number(p.due_amount);
        if (purchaseDue <= 0) continue;
        const apply = Math.min(remaining, purchaseDue);
        const newPaid = Number(p.paid_amount) + apply;
        const newDue = Math.max(0, purchaseDue - apply);
        const newType = newDue <= 0 ? "Cash" : "Partial";
        await supabase
          .from("purchases")
          .update({ paid_amount: newPaid, due_amount: newDue, payment_type: newType })
          .eq("purchase_id", p.purchase_id);
        await supabase.from("supplier_payments").insert([{
          supplier_id: outSupplier.supplier_id,
          purchase_id: p.purchase_id,
          amount_paid: apply,
          payment_mode: "Cash",
          transaction_ref: p.invoice_no,
          remarks: desc,
          recorded_by: user?.id ?? null,
        }]);
        remaining = Number((remaining - apply).toFixed(2));
      }

      setOutAmount(""); setOutAccount(""); setOutNote(""); setOutSupplier(null); setOutSupplierSearch(""); setOutSupplierResults([]); setOutSupplierDue(0);
      setOutDate(new Date().toISOString().slice(0, 10));
      setSavingOut(false);
      load();
      return;
    }

    // Special handling: bank deposit, owner receive / drawings
    if (direction === "out" && (outAccount === "bank_deposit" || outAccount === "owner_draw")) {
      const otherCode = outAccount === "bank_deposit" ? "1100" : "3200";
      const otherAccount = accounts.find((a) => a.account_code === otherCode)?.account_id;
      if (!otherAccount) { alert("Account not found."); setSavingOut(false); return; }

      const desc = note || (outAccount === "bank_deposit" ? "Bank deposit" : "Owner receive / drawings");
      const { data: entry, error: entryError } = await supabase
        .from("journal_entries")
        .insert([{ entry_no: entryNo, entry_date: date, description: desc, reference_type: "CashRegister", created_by: user?.id ?? null }])
        .select("entry_id")
        .single();
      if (entryError) { alert("Error: " + entryError.message); setSavingOut(false); return; }

      const { error: linesError } = await supabase.from("journal_entry_lines").insert([
        { entry_id: entry.entry_id, account_id: otherAccount, debit: amount, credit: 0 },
        { entry_id: entry.entry_id, account_id: cashAccount, debit: 0, credit: amount },
      ]);
      if (linesError) { alert("Lines error: " + linesError.message); setSavingOut(false); return; }

      setOutAmount(""); setOutAccount(""); setOutNote("");
      setOutDate(new Date().toISOString().slice(0, 10));
      setSavingOut(false);
      load();
      return;
    }

    // Regular posting
    if (direction === "in" ? accountId === 0 : !accountId) { alert("Please choose a category."); direction === "in" ? setSavingIn(false) : setSavingOut(false); return; }

    const desc = note || (direction === "in" ? "Money received" : "Money paid");
    const { data: entry, error: entryError } = await supabase
      .from("journal_entries")
      .insert([{ entry_no: entryNo, entry_date: date, description: desc, reference_type: "CashRegister", created_by: user?.id ?? null }])
      .select("entry_id")
      .single();
    if (entryError) { alert("Error: " + entryError.message); direction === "in" ? setSavingIn(false) : setSavingOut(false); return; }

    const lines = direction === "in"
      ? [
          { entry_id: entry.entry_id, account_id: cashAccount, debit: amount, credit: 0 },
          { entry_id: entry.entry_id, account_id: accountId, debit: 0, credit: amount },
        ]
      : [
          { entry_id: entry.entry_id, account_id: accountId, debit: amount, credit: 0 },
          { entry_id: entry.entry_id, account_id: cashAccount, debit: 0, credit: amount },
        ];

    const { error: linesError } = await supabase.from("journal_entry_lines").insert(lines);
    direction === "in" ? setSavingIn(false) : setSavingOut(false);
    if (linesError) { alert("Error: " + linesError.message); return; }

    if (direction === "in") {
      setInAmount(""); setInAccount(""); setInNote("");
      setInDate(new Date().toISOString().slice(0, 10));
    } else {
      setOutAmount(""); setOutAccount(""); setOutNote("");
      setOutDate(new Date().toISOString().slice(0, 10));
    }
    load();
  };

  const totalIn = entries.reduce((s, e) => s + (e.direction === "in" ? e.amount : 0), 0);
  const totalOut = entries.reduce((s, e) => s + (e.direction === "out" ? e.amount : 0), 0);

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cash In / Cash Out</h1>
        <p className="text-sm text-muted-foreground">
          Cash In = money received (income) · Cash Out = money paid (expense)
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-green-50/50 p-4">
          <p className="text-sm text-muted-foreground flex items-center gap-1"><ArrowDownToLine className="size-4 text-green-600" /> Total Money In</p>
          <p className="text-2xl font-bold mt-1 text-green-700">৳{fmt(totalIn)}</p>
        </div>
        <div className="rounded-lg border bg-red-50/50 p-4">
          <p className="text-sm text-muted-foreground flex items-center gap-1"><ArrowUpFromLine className="size-4 text-red-600" /> Total Money Out</p>
          <p className="text-2xl font-bold mt-1 text-red-700">৳{fmt(totalOut)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Net (Balance)</p>
          <p className={`text-2xl font-bold mt-1 ${totalIn - totalOut >= 0 ? "text-green-700" : "text-red-700"}`}>৳{fmt(totalIn - totalOut)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Money In */}
        <div className="rounded-lg border bg-card p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <span className="flex size-8 items-center justify-center rounded-full bg-green-100 text-green-700"><ArrowDownToLine className="size-4" /></span>
            Money In / Receive
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Record money your business received (income).</p>
          <div className="space-y-3 mt-4">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={inDate} onChange={(e) => setInDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Amount (৳) *</Label>
              <Input type="number" min={0} step={0.01} value={inAmount} onChange={(e) => setInAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <Label>Received From / Category *</Label>
              <select value={inAccount} onChange={(e) => setInAccount(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">-- Select --</option>
                <optgroup label="Income">
                  {revenueAccounts.map((a) => (
                    <option key={a.account_id} value={a.account_id}>{a.account_code} · {a.account_name}</option>
                  ))}
                </optgroup>
                <optgroup label="Other Money In">
                  <option value="due">Customer Due Received</option>
                  <option value="owner">Owner Investment</option>
                  <option value="loan">Loan Received</option>
                  <option value="bank_withdrawal">Bank Withdrawal</option>
                </optgroup>
              </select>
            </div>
            {inAccount === "due" && (
              <div className="space-y-1">
                <Label>Customer *</Label>
                {inCustomer ? (
                  <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 min-w-0">
                      <User className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{inCustomer.full_name ?? "Unnamed"} <span className="text-muted-foreground font-mono">({inCustomer.mobile_number})</span></span>
                    </span>
                    <Button variant="ghost" size="sm" type="button" onClick={() => { setInCustomer(null); setInCustomerDue(0); }}>Change</Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      value={inCustomerSearch}
                      onChange={(e) => searchCustomers(e.target.value)}
                      placeholder="Search by name or mobile number..."
                      className="pl-9"
                    />
                    {searchingCustomers && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />}
                    {inCustomerResults.length > 0 && (
                      <div className="absolute z-20 mt-1 w-full rounded-lg border bg-popover p-1 shadow-md">
                        {inCustomerResults.map((c) => (
                          <button
                            key={c.customer_id}
                            type="button"
                            onClick={() => selectCustomer(c)}
                            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                          >
                            <User className="size-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{c.full_name ?? "Unnamed"}</span>
                              <span className="block text-xs text-muted-foreground font-mono">{c.mobile_number}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {inCustomer && (
                  <p className={`text-xs ${inCustomerDue > 0 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                    Current total due: ৳{inCustomerDue.toFixed(2)}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-1">
              <Label>Note</Label>
              <Input value={inNote} onChange={(e) => setInNote(e.target.value)} placeholder="e.g. Payment from customer" />
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => postEntry("in")} disabled={savingIn}>
              {savingIn ? <Loader2 className="size-4 mr-2 animate-spin" /> : <ArrowDownToLine className="size-4 mr-2" />}Receive Money
            </Button>
          </div>
        </div>

        {/* Money Out */}
        <div className="rounded-lg border bg-card p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <span className="flex size-8 items-center justify-center rounded-full bg-red-100 text-red-700"><ArrowUpFromLine className="size-4" /></span>
            Money Out / Pay
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Record money your business spent (expense).</p>
          <div className="space-y-3 mt-4">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={outDate} onChange={(e) => setOutDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Amount (৳) *</Label>
              <Input type="number" min={0} step={0.01} value={outAmount} onChange={(e) => setOutAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <Label>Paid To / Category *</Label>
              <select value={outAccount} onChange={(e) => setOutAccount(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">-- Select --</option>
                <optgroup label="Expenses">
                  {expenseAccounts.map((a) => (
                    <option key={a.account_id} value={a.account_id}>{a.account_code} · {a.account_name}</option>
                  ))}
                </optgroup>
                <optgroup label="Other Money Out">
                  <option value="supplier_due">Supplier Due Paid (cash)</option>
                  <option value="bank_deposit">Bank Deposit</option>
                  <option value="owner_draw">Owner Receive / Drawings</option>
                </optgroup>
              </select>
            </div>
            {outAccount === "supplier_due" && (
              <div className="space-y-1">
                <Label>Supplier *</Label>
                {outSupplier ? (
                  <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 min-w-0">
                      <User className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{outSupplier.supplier_name} <span className="text-muted-foreground font-mono">({outSupplier.phone})</span></span>
                    </span>
                    <Button variant="ghost" size="sm" type="button" onClick={() => { setOutSupplier(null); setOutSupplierDue(0); }}>Change</Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      value={outSupplierSearch}
                      onChange={(e) => searchSuppliers(e.target.value)}
                      placeholder="Search by name or phone number..."
                      className="pl-9"
                    />
                    {searchingSuppliers && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />}
                    {outSupplierResults.length > 0 && (
                      <div className="absolute z-20 mt-1 w-full rounded-lg border bg-popover p-1 shadow-md">
                        {outSupplierResults.map((s) => (
                          <button
                            key={s.supplier_id}
                            type="button"
                            onClick={() => selectSupplier(s)}
                            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                          >
                            <User className="size-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{s.supplier_name}</span>
                              <span className="block text-xs text-muted-foreground font-mono">{s.phone}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {outSupplier && (
                  <p className={`text-xs ${outSupplierDue > 0 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                    Current total due: ৳{outSupplierDue.toFixed(2)}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-1">
              <Label>Note</Label>
              <Input value={outNote} onChange={(e) => setOutNote(e.target.value)} placeholder="e.g. Paid shop rent" />
            </div>
            <Button className="w-full bg-red-600 hover:bg-red-700" onClick={() => postEntry("out")} disabled={savingOut}>
              {savingOut ? <Loader2 className="size-4 mr-2 animate-spin" /> : <ArrowUpFromLine className="size-4 mr-2" />}Pay Money
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left font-medium">Date</th>
              <th className="p-3 text-left font-medium">Category</th>
              <th className="p-3 text-left font-medium">Note</th>
              <th className="p-3 text-right font-medium">Money In</th>
              <th className="p-3 text-right font-medium">Money Out</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.entry_id} className="border-b hover:bg-muted/30">
                <td className="p-3">{new Date(e.entry_date + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                <td className="p-3 font-medium">{e.account_name}</td>
                <td className="p-3 text-muted-foreground">{e.description}</td>
                <td className="p-3 text-right text-green-700">{e.direction === "in" ? `৳${fmt(e.amount)}` : "—"}</td>
                <td className="p-3 text-right text-red-700">{e.direction === "out" ? `৳${fmt(e.amount)}` : "—"}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No entries yet. Use the forms above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
