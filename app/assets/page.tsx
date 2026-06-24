import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "StartFest Pal — Share Kit",
  description:
    "Download the StartFest Pal graphics in any format — slide (PNG, PDF, PPTX), portrait poster (PNG, SVG). Free to share.",
};

const APP_URL = "https://tinyurl.com/StartFestPal";

interface Fmt {
  label: string;
  ext: string;
  href: string;
  note: string;
}
interface Asset {
  title: string;
  sub: string;
  preview: string;
  portrait?: boolean;
  formats: Fmt[];
}

const ASSETS: Asset[] = [
  {
    title: "Presentation slide",
    sub: "16:9 · 1920×1080 — slides, socials, screens",
    preview: "/assets/preview-16x9.jpg",
    formats: [
      { label: "PNG", ext: "png", href: "/assets/startfest-pal-16x9.png", note: "3840×2160" },
      { label: "PDF", ext: "pdf", href: "/assets/startfest-pal-16x9.pdf", note: "print-ready" },
      { label: "PPTX", ext: "pptx", href: "/assets/startfest-pal-16x9.pptx", note: "PowerPoint / Keynote" },
      { label: "SVG", ext: "svg", href: "/assets/startfest-pal-16x9.svg", note: "vector" },
    ],
  },
  {
    title: "Portrait poster",
    sub: "3:4 · 1080×1440 — stories, feeds, print",
    preview: "/assets/preview-portrait.jpg",
    portrait: true,
    formats: [
      { label: "PNG", ext: "png", href: "/assets/startfest-pal-portrait.png", note: "2160×2880" },
      { label: "SVG", ext: "svg", href: "/assets/startfest-pal-portrait.svg", note: "vector" },
    ],
  },
];

function Logo() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95">
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <path d="M7 4 L20 12 L7 20 Z" fill="#0a2461" />
      </svg>
    </span>
  );
}

export default function AssetsPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-7">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Logo />
          <div className="leading-tight">
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-lime">Silicon Slopes</div>
            <div className="text-sm font-extrabold text-white">
              StartFest <span className="text-lime">Pal</span>
            </div>
          </div>
        </div>
        <a href="/" className="btn-ghost text-sm">
          Open the app →
        </a>
      </div>

      {/* Hero */}
      <div className="mt-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-lime/25 bg-lime/[0.08] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-lime">
          Share kit
        </div>
        <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl">
          Help spread <span className="text-lime">StartFest Pal.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/65">
          Grab the graphics in whatever format you need — post them, present them, print them. They link folks
          straight to the free companion app at{" "}
          <a href={APP_URL} target="_blank" rel="noopener" className="font-semibold text-lime hover:underline">
            tinyurl.com/StartFestPal
          </a>
          .
        </p>
      </div>

      {/* Asset cards */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {ASSETS.map((a) => (
          <div key={a.title} className="card overflow-hidden p-4">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.preview}
                alt={`${a.title} preview`}
                className={`mx-auto block w-full object-contain ${a.portrait ? "max-h-[420px]" : ""}`}
              />
            </div>
            <div className="mt-4">
              <h2 className="text-lg font-bold text-white">{a.title}</h2>
              <p className="text-[13px] text-white/50">{a.sub}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {a.formats.map((f) => (
                <a
                  key={f.ext}
                  href={f.href}
                  download
                  className="group inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-3.5 py-2 transition hover:border-lime/40 hover:bg-white/10"
                >
                  <span className="text-sm font-bold text-white">{f.label}</span>
                  <span className="text-[11px] text-white/45 group-hover:text-white/65">{f.note}</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c6f23e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <p className="mt-6 text-[13px] text-white/45">
        Free to share for StartFest. Please keep the QR code and link intact so people can find the app. Vector
        (SVG) files are fully editable.
      </p>

      {/* Footer */}
      <div className="mt-10 border-t border-white/10 pt-6 text-[13px] text-white/45">
        An app by{" "}
        <a href={BRAND.builderUrl} target="_blank" rel="noopener" className="font-semibold text-white/70 hover:text-lime">
          {BRAND.builder}
        </a>{" "}
        <span className="text-white/35">({BRAND.builderAlias})</span> · Powered by{" "}
        <a href={BRAND.sponsorUrl} target="_blank" rel="noopener" className="text-white/60 hover:text-lime">
          {BRAND.sponsorName}
        </a>
      </div>
    </main>
  );
}
