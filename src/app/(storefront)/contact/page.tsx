import { getPageSections, getWebSettings } from "@/lib/store";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";

export default async function ContactPage() {
  const [sections, settings] = await Promise.all([
    getPageSections("contact"),
    getWebSettings(),
  ]);

  const section1 = sections.find((s) => s.section_number === 1);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <h1 className="text-3xl font-bold sm:text-5xl">
            {section1?.hero_title ?? "Get In Touch"}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {section1?.hero_subtitle ?? "We are here to help you"}
          </p>
        </div>
      </section>

      {/* Contact Channels */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-lg border p-6 text-center">
            <MapPin className="mx-auto size-8 text-primary mb-3" />
            <h3 className="font-semibold">{section1?.col1_title ?? "Visit Us"}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {section1?.col1_desc ?? "123 Business Road, Dhaka 1000"}
            </p>
          </div>
          <div className="rounded-lg border p-6 text-center">
            <Phone className="mx-auto size-8 text-primary mb-3" />
            <h3 className="font-semibold">{section1?.col2_title ?? "Call Us"}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {section1?.col2_desc ?? settings.contact_phone ?? "+880 1700-000000"}
            </p>
            {settings.whatsapp_number && (
              <a
                href={`https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            )}
          </div>
          <div className="rounded-lg border p-6 text-center">
            <Mail className="mx-auto size-8 text-primary mb-3" />
            <h3 className="font-semibold">{section1?.col3_title ?? "Email Us"}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {section1?.col3_desc ?? settings.contact_email ?? "info@smarterp.com"}
            </p>
          </div>
        </div>
      </section>

      {/* Inquiry Form */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mx-auto max-w-lg">
          <h2 className="text-xl font-semibold mb-4">Send an Inquiry</h2>
          <form className="space-y-4" action="/api/contact" method="POST">
            <input
              type="text"
              name="full_name"
              placeholder="Your Name"
              required
              className="w-full rounded-lg border bg-card px-4 py-2 text-sm"
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              required
              className="w-full rounded-lg border bg-card px-4 py-2 text-sm"
            />
            <input
              type="email"
              name="email"
              placeholder="Email (optional)"
              className="w-full rounded-lg border bg-card px-4 py-2 text-sm"
            />
            <textarea
              name="message"
              placeholder="Your Message"
              rows={4}
              required
              className="w-full rounded-lg border bg-card px-4 py-2 text-sm resize-none"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* Operating Hours */}
      {settings.operating_hours && (
        <section className="mx-auto max-w-7xl px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            <strong>Operating Hours:</strong> {settings.operating_hours}
          </p>
        </section>
      )}
    </div>
  );
}
