"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { t, getClientLocale } from "@/lib/i18n";

export interface HeroSlide {
  image: string | null;
  title: string | null;
  subtitle: string | null;
}

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);
  const [locale, setLocale] = useState<"en" | "bn">("en");

  useEffect(() => {
    setLocale(getClientLocale());
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slidesWithImage = slides.filter((s) => s.image);
  if (slidesWithImage.length === 0) return null;

  const goTo = (i: number) => setCurrent(i);

  return (
    <section className="relative">
      <div className="grid">
        {slidesWithImage.map((slide, i) => (
          <div
            key={i}
            className={`relative col-start-1 row-start-1 transition-opacity duration-1000 ${
              i === current ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={i !== current}
          >
            <img
              src={slide.image!}
              alt={slide.title ?? "Banner"}
              className="h-[70vh] w-full object-cover object-bottom"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-start pt-20 gap-4 px-4 text-center">
              <h1 className="max-w-3xl text-3xl font-bold text-white sm:text-5xl">
                {slide.title ?? t("store.home.welcome", locale)}
              </h1>
              {slide.subtitle && (
                <p className="max-w-xl text-xl sm:text-2xl text-white/90">{slide.subtitle}</p>
              )}
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t("store.home.shopNow", locale)} <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        ))}
        {slidesWithImage.length > 1 && (
          <div className="col-start-1 row-start-1 absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {slidesWithImage.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={`size-2.5 rounded-full transition-colors ${
                  i === current ? "bg-primary" : "bg-white/60 hover:bg-white"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
