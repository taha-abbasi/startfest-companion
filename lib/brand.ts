// Shared branding + attribution used across the UI and emails.

export const BRAND = {
  appName: "StartFest Companion",
  maker: "Koolas",
  builder: "Taha Salahuddin Abbasi",
  builderAlias: "The Brown Cowboy",
  builderUrl: "https://tahaabbasi.com",

  // "Powered by AskFlorence" — a genuine lead-gen placement for the founder crowd.
  sponsorName: "AskFlorence",
  sponsorTagline:
    "Real ACA health plans with your subsidies applied — built for founders, freelancers & small teams.",
  sponsorCta: "Join the waitlist",
  sponsorUrl: process.env.NEXT_PUBLIC_ASKFLORENCE_URL || "https://askflorence.health",
};

export const CREDIT_LINE = `Built by ${BRAND.builder} (${BRAND.builderAlias}) · A ${BRAND.maker} app`;
