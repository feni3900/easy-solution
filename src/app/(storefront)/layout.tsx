import { StorefrontHeader } from "@/components/storefront/storefront-header";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Smart ERP Store</p>
          <div className="flex gap-4">
            <a href="/about" className="hover:text-foreground">About Us</a>
            <a href="/contact" className="hover:text-foreground">Contact Us</a>
            <a href="/shop" className="hover:text-foreground">Shop</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
