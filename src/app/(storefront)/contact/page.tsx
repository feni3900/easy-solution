import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Contact Us</h1>
      <p className="mt-4 text-muted-foreground">
        Have a question about an order or a product? Get in touch — our team
        usually replies within one business day.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {[
          { icon: MapPin, title: "Address", lines: ["Dhaka, Bangladesh", "Athens, Greece"] },
          { icon: Phone, title: "Phone", lines: ["+880 1712 345 678", "+30 210 000 0000"] },
          { icon: Mail, title: "Email", lines: ["info@maruf.com", "info@maaelectronics.gr"] },
          { icon: Clock, title: "Hours", lines: ["Sun–Thu: 9am–6pm", "Fri–Sat: 10am–4pm"] },
        ].map((b) => (
          <div key={b.title} className="rounded-lg border p-5">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <b.icon className="size-5" />
            </div>
            <p className="mt-3 font-medium">{b.title}</p>
            {b.lines.map((l) => (
              <p key={l} className="text-sm text-muted-foreground">{l}</p>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Send us a message</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please include your order or invoice number if your message is about an
          existing order.
        </p>
        <a
          href="mailto:info@maruf.com"
          className="mt-4 inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Email info@maruf.com
        </a>
      </div>
    </div>
  );
}
