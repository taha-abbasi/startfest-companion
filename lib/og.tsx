import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";
export const ogAlt = "StartFest 2026 Companion — Silicon Slopes · June 23–24";

const lime = "#c6f23e";
const muted = "#9fb3da";

// Branded social-share card, rendered with Satori (next/og).
export function renderOgImage(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          color: "#eaf1ff",
          backgroundColor: "#071a41",
          backgroundImage:
            "linear-gradient(135deg, #061634 0%, #0a2155 45%, #0c5572 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* header */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24">
              <path d="M7 4 L20 12 L7 20 Z" fill="#0a2461" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 20 }}>
            <span style={{ color: lime, fontSize: 22, fontWeight: 700, letterSpacing: 4 }}>
              SILICON SLOPES
            </span>
            <span style={{ color: "#fff", fontSize: 30, fontWeight: 800 }}>StartFest 2026</span>
          </div>
        </div>

        {/* hero */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 82, fontWeight: 800, lineHeight: 1.05, color: "#fff" }}>
            Your StartFest,
          </div>
          <div style={{ display: "flex", fontSize: 82, fontWeight: 800, lineHeight: 1.05, color: lime }}>
            all in one place.
          </div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 30, color: muted, maxWidth: 920 }}>
            Browse the agenda, build your schedule, see who&apos;s going, and get a reminder before
            every session.
          </div>
          <div style={{ display: "flex", marginTop: 22, fontSize: 24, color: "#cdddff", fontWeight: 600 }}>
            2 Days&nbsp;&nbsp;·&nbsp;&nbsp;6 Tracks&nbsp;&nbsp;·&nbsp;&nbsp;36 Sessions&nbsp;&nbsp;·&nbsp;&nbsp;3 Rooms
          </div>
        </div>

        {/* footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: lime, fontSize: 30, fontWeight: 800 }}>June 23–24, 2026</span>
            <span style={{ color: muted, fontSize: 22 }}>
              Mountain America Event Venue · Loveland Living Planet Aquarium
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ color: lime, fontSize: 22, fontWeight: 700 }}>Powered by AskFlorence</span>
            <span style={{ color: muted, fontSize: 18 }}>
              Built by Taha Salahuddin Abbasi · The Brown Cowboy
            </span>
          </div>
        </div>
      </div>
    ),
    { ...ogSize }
  );
}
