import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <p>&copy; {new Date().getFullYear()} {t("store.footer", locale)}</p>
          <div className="flex gap-4">
            <a href="/about" className="hover:text-foreground">{t("store.about", locale)}</a>
            <a href="/contact" className="hover:text-foreground">{t("store.contact", locale)}</a>
            <a href="/shop" className="hover:text-foreground">{t("store.shop", locale)}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
