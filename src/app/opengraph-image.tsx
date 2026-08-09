import { ImageResponse } from "next/og";

export const alt = "Cookies & More — warm, handmade cookies baked fresh daily";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fff7e8 0%, #f6ead2 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Cookie mark */}
        <div
          style={{
            display: "flex",
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: "radial-gradient(circle at 40% 38%, #f0c485, #b9793b)",
            border: "8px solid #a85f2e",
            position: "relative",
            marginBottom: 36,
          }}
        >
          <div style={{ position: "absolute", top: 34, left: 40, width: 22, height: 22, borderRadius: 7, background: "#3b2117" }} />
          <div style={{ position: "absolute", top: 74, left: 84, width: 26, height: 26, borderRadius: 8, background: "#3b2117" }} />
          <div style={{ position: "absolute", top: 92, left: 34, width: 20, height: 20, borderRadius: 6, background: "#3b2117" }} />
        </div>

        <div style={{ display: "flex", fontSize: 72, fontWeight: 700, color: "#3b2117", letterSpacing: -2 }}>
          Cookies <span style={{ color: "#c87941", margin: "0 14px" }}>&amp;</span> More
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#57392a", marginTop: 14 }}>
          Life is better with warm cookies.
        </div>
      </div>
    ),
    size,
  );
}
