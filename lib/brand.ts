// Shared branding + attribution used across the UI and emails.

export const BRAND = {
  appName: "StartFest Companion",
  builder: "Taha Salahuddin Abbasi",
  builderAlias: "The Brown Cowboy",
  builderUrl: "https://tahaabbasi.com",
  photo: "/taha.jpg",
  introPostUrl:
    "https://www.siliconslopes.com/c/posts/gave-up-on-health-insurance-as-a-founder-i-did-too",

  // "Powered by AskFlorence" — a genuine lead-gen placement for the founder crowd.
  sponsorName: "AskFlorence",
  sponsorTagline:
    "Founders: the plan Healthcare.gov showed me for $960/mo was actually $7 with hidden ACA subsidies. AskFlorence finds your real price in seconds — free for consumers.",
  sponsorCta: "See your real price",
  sponsorUrl: process.env.NEXT_PUBLIC_ASKFLORENCE_URL || "https://askflorence.health",

  // Donations → Startup School (Clint Betts collects on Venmo).
  venmoHandle: process.env.NEXT_PUBLIC_VENMO_HANDLE || "Clint-Betts",
  donateBeneficiary: "Startup School",
  // Venmo renders spaces in deep-linked notes as "+", so we use middots instead.
  donateNote: "StartFest Pal ⚡ powered by AskFlorence".replace(/ /g, "·"),
};

export const CREDIT_LINE = `An app by ${BRAND.builder} (${BRAND.builderAlias})`;
