"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Setting {
  id: string;
  key: string;
  value: unknown;
  group_name: string;
}

const GROUP_LABELS: Record<string, string> = {
  company: "Company",
  pos: "POS",
  inventory: "Inventory",
  sales: "Sales",
  purchase: "Purchase",
  general: "General",
};

function displayValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return String(value);
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value[0] ?? "";
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value ?? "");
}

export function SettingsClient({ settings }: { settings: Setting[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const s of settings) init[s.key] = displayValue(s.value);
    return init;
  });
  const [saving, setSaving] = useState(false);

  const grouped = useMemo(() => {
    const map: Record<string, Setting[]> = {};
    for (const s of settings) {
      const g = GROUP_LABELS[s.group_name] ?? s.group_name;
      (map[g] ??= []).push(s);
    }
    return map;
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    for (const s of settings) {
      const raw = values[s.key] ?? "";
      let parsed: unknown = raw;
      if (typeof s.value === "boolean") parsed = raw === "true";
      else if (typeof s.value === "number") parsed = Number(raw) || 0;
      else if (Array.isArray(s.value)) parsed = [raw];
      await supabase.from("settings").update({ value: parsed }).eq("id", s.id);
    }
    setSaving(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([group, rows]) => (
        <Card key={group}>
          <CardHeader>
            <CardTitle className="text-base">{group} Settings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {rows.map((s) => (
              <div key={s.id} className="grid gap-2">
                <Label className="capitalize">{s.key.replace(/_/g, " ")}</Label>
                <Input
                  value={values[s.key] ?? ""}
                  onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
