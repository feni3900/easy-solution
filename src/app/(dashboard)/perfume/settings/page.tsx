"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PerfumeNav } from "@/components/perfume/perfume-nav";
import { getClientLocale, t } from "@/lib/i18n";

export default function PerfumeSettingsPage() {
  const locale = getClientLocale();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    setMessage(null);
    if (!current || !next || !confirm) {
      setError(t("perfume.settings.fillAll", locale));
      return;
    }
    if (next !== confirm) {
      setError(t("perfume.settings.mismatch", locale));
      return;
    }
    setSaving(true);
    const res = await fetch("/api/perfume/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, next }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(json.error ?? t("perfume.settings.failed", locale));
      return;
    }
    setMessage(t("perfume.settings.saved", locale));
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("perfume.settings", locale)}</h1>
      <PerfumeNav />

      <div className="mx-auto max-w-sm rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">{t("perfume.settings.changePassword", locale)}</h2>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>{t("perfume.settings.current", locale)}</Label>
            <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("perfume.settings.next", locale)}</Label>
            <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("perfume.settings.confirm", locale)}</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}
          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {t("perfume.settings.save", locale)}
          </Button>
        </div>
      </div>
    </div>
  );
}