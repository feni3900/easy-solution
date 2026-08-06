"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus, Trash2, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Account {
  account_id: number;
  account_code: string;
  account_name: string;
}

interface Line {
  key: number;
  account_id: string;
  description: string;
  debit: string;
  credit: string;
}

interface Entry {
  entry_id: number;
  entry_no: string;
  entry_date: string;
  description: string;
  created_at: string;
  total: number;
  lines: { account_code: string; account_name: string; debit: number; credit: number }[];
}

let lineKey = 1;

export default function JournalPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const emptyLine = (): Line => ({ key: lineKey++, account_id: "", description: "", debit: "", credit: "" });
  const [currentLine, setCurrentLine] = useState<Line>(() => emptyLine());
  const [lines, setLines] = useState<Line[]>([]);

  const [viewing, setViewing] = useState<Entry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [accRes, entryRes] = await Promise.all([
      supabase.from("chart_of_accounts").select("account_id, account_code, account_name").eq("is_active", true).order("account_code"),
      supabase.from("journal_entries").select("*, journal_entry_lines(*)").order("entry_id", { ascending: false }).limit(100),
    ]);
    setAccounts(accRes.data ?? []);
    const rows: Entry[] = (entryRes.data ?? []).map((e: any) => {
      const lines = e.journal_entry_lines ?? [];
      const total = lines.reduce((s: number, l: any) => s + Number(l.debit || 0), 0);
      return {
        entry_id: e.entry_id,
        entry_no: e.entry_no,
        entry_date: e.entry_date,
        description: e.description,
        created_at: e.created_at,
        total,
        lines,
      };
    });
    setEntries(rows);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateCurrent = (field: keyof Line, value: string) => {
    setCurrentLine({ ...currentLine, [field]: value });
  };

  const addLine = () => {
    const debit = parseFloat(currentLine.debit) || 0;
    const credit = parseFloat(currentLine.credit) || 0;
    if (!currentLine.account_id) { alert("Please select an account."); return; }
    if (debit <= 0 && credit <= 0) { alert("Please enter a debit or credit amount."); return; }
    setLines([...lines, currentLine]);
    setCurrentLine(emptyLine());
  };

  const removeLine = (key: number) => {
    setLines(lines.filter((l) => l.key !== key));
  };

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0) + (parseFloat(currentLine.debit) || 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0) + (parseFloat(currentLine.credit) || 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleSave = async () => {
    if (!description.trim()) { alert("Please enter a description."); return; }
    if (!balanced) { alert("Debits and credits must balance."); return; }
    const rows = lines
      .filter((l) => l.account_id && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0))
      .map((l) => ({
        account_id: parseInt(l.account_id),
        description: l.description.trim() || null,
        debit: parseFloat(l.debit) || 0,
        credit: parseFloat(l.credit) || 0,
      }));
    if (rows.length < 2) { alert("Please add at least two lines."); return; }
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const entryNo = "JE-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.floor(1000 + Math.random() * 9000);

    const { data: entry, error: entryError } = await supabase
      .from("journal_entries")
      .insert([{
        entry_no: entryNo,
        entry_date: entryDate,
        description: description.trim(),
        reference_type: "Manual",
        created_by: user?.id ?? null,
      }])
      .select("entry_id")
      .single();
    if (entryError) {
      setSaving(false);
      alert("Error: " + entryError.message);
      return;
    }

    const { error: linesError } = await supabase
      .from("journal_entry_lines")
      .insert(rows.map((r) => ({ ...r, entry_id: entry.entry_id })));
    setSaving(false);
    if (linesError) {
      alert("Lines error: " + linesError.message);
      return;
    }

    setDialogOpen(false);
    setDescription("");
    setEntryDate(new Date().toISOString().slice(0, 10));
    setLines([]);
    setCurrentLine(emptyLine());
    load();
  };

  const formatDate = (d: string) => new Date(d + (d.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Journal Entries</h1>
          <p className="text-sm text-muted-foreground">Record manual double-entry transactions</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="size-4 mr-2" />New Entry</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Entry No</th>
                <th className="p-3 text-left font-medium">Date</th>
                <th className="p-3 text-left font-medium">Description</th>
                <th className="p-3 text-right font-medium">Amount</th>
                <th className="p-3 text-right font-medium">Lines</th>
                <th className="p-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.entry_id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{e.entry_no}</td>
                  <td className="p-3">{formatDate(e.entry_date)}</td>
                  <td className="p-3 font-medium">{e.description}</td>
                  <td className="p-3 text-right font-semibold">{e.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="p-3 text-right text-muted-foreground">{e.lines.length}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => setViewing(e)}><ListChecks className="size-4" /></Button>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No journal entries yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>New Journal Entry</DialogTitle></DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Description *</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Paid rent" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border p-3 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Account</Label>
                <select
                  value={currentLine.account_id}
                  onChange={(e) => updateCurrent("account_id", e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">-- Select account --</option>
                  {accounts.map((a) => (
                    <option key={a.account_id} value={a.account_id}>{a.account_code} · {a.account_name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Memo (optional)</Label>
                <Input value={currentLine.description} onChange={(e) => updateCurrent("description", e.target.value)} placeholder="optional note" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Debit</Label>
                <Input type="number" min="0" step="0.01" value={currentLine.debit} onChange={(e) => updateCurrent("debit", e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Credit</Label>
                <Input type="number" min="0" step="0.01" value={currentLine.credit} onChange={(e) => updateCurrent("credit", e.target.value)} placeholder="0.00" />
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={addLine}>
                  <Plus className="size-4 mr-1" />Add Line
                </Button>
              </div>
            </div>

            {lines.length > 0 && (
              <div className="rounded-lg border divide-y">
                {lines.map((l) => {
                  const acc = accounts.find((a) => String(a.account_id) === l.account_id);
                  return (
                    <div key={l.key} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="font-medium truncate">{acc ? `${acc.account_code} · ${acc.account_name}` : "Unknown account"}</span>
                      <span className="flex items-center gap-3 shrink-0">
                        {parseFloat(l.debit) > 0 && <span className="text-green-600">Dr {parseFloat(l.debit).toFixed(2)}</span>}
                        {parseFloat(l.credit) > 0 && <span className="text-red-600">Cr {parseFloat(l.credit).toFixed(2)}</span>}
                        <Button variant="ghost" size="icon" className="size-6" onClick={() => removeLine(l.key)}>
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-muted/40 p-3 flex items-center justify-between">
            <span className="text-sm font-medium">Debit total</span>
            <span className="text-sm font-semibold">{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-sm font-medium ml-auto mr-4">Credit total</span>
            <span className="text-sm font-semibold">{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className={`text-sm font-medium ${balanced ? "text-green-600" : "text-destructive"}`}>
              {totalDebit === 0 && totalCredit === 0 ? "Enter debits and credits"
                : balanced ? "Balanced ✓"
                : `Out of balance (diff ${(totalDebit - totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
            </div>
            <Button onClick={handleSave} disabled={saving || !balanced || lines.length < 1}>
              {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}Save Entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewing?.entry_no} · {viewing && formatDate(viewing.entry_date)}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{viewing.description}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left font-medium">Account</th>
                      <th className="p-2 text-right font-medium">Debit</th>
                      <th className="p-2 text-right font-medium">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewing.lines.map((l, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2"><span className="font-mono text-xs text-muted-foreground">{l.account_code}</span> {l.account_name}</td>
                        <td className="p-2 text-right whitespace-nowrap">{Number(l.debit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="p-2 text-right whitespace-nowrap">{Number(l.credit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    <tr className="border-t bg-muted/30 font-semibold">
                      <td className="p-2">Total</td>
                      <td className="p-2 text-right whitespace-nowrap">{viewing.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2 text-right whitespace-nowrap">{viewing.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
