import { ImageResponse } from "next/og";
import { getI18n } from "@/i18n/server";
import { SERVICE_NAME } from "@/constants";

// Route segment config
export const runtime = "nodejs";

// Image metadata
export const alt = "Quiz Preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

// Font loading
async function loadGoogleFont(weight: number) {
  const res = await fetch(
    `https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-${weight}-normal.ttf`,
  );
  return res.arrayBuffer();
}

// Image generation
export default async function Image() {
  const { dict } = await getI18n();

  // Node.js runtime imports
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path");

  const logoPath = path.join(process.cwd(), "public/assets/logo.png");
  const logoBuffer = fs.readFileSync(logoPath);
  const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  // Load fonts
  const [inter500, inter700, inter900] = await Promise.all([
    loadGoogleFont(500), // Medium
    loadGoogleFont(700), // Bold
    loadGoogleFont(900), // Black
  ]);

  return new ImageResponse(
    <div
      style={{
        background: "white",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '"Inter", sans-serif',
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
          textAlign: "center",
          gap: "40px",
        }}
      >
        {/* Header: Logo + Service Name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoBase64} alt={SERVICE_NAME} width="80" height="80" />
          <div
            style={{
              fontSize: 40,
              fontWeight: 700,
              fontFamily: '"Inter", sans-serif',
              background:
                "linear-gradient(135deg, #fceca4 0%, #f97316 50%, #15803d 100%)",
              backgroundClip: "text",
              color: "transparent",
              display: "flex",
              alignItems: "center",
            }}
          >
            {SERVICE_NAME}
          </div>
        </div>

        {/* Main Title */}
        <div
          style={{
            fontSize: 100,
            fontWeight: 900,

            lineHeight: 1.1,
            background:
              "linear-gradient(135deg, #fceca4 0%, #f97316 50%, #15803d 100%)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Random Quiz
        </div>

        {/* Subtitle / Description */}
        <div
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: "#4b5563", // Gray-600
            maxWidth: "800px",
            lineHeight: 1.4,
          }}
        >
          {dict.quiz.metaDescription}
        </div>

        {/* Call to Action Badge */}
        <div
          style={{
            marginTop: "40px",
            background: "#15803d", // Green-700
            color: "white",
            padding: "16px 48px",
            borderRadius: "50px",
            fontSize: 36,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Start Quiz
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Inter",
          data: inter500,
          style: "normal",
          weight: 500,
        },
        {
          name: "Inter",
          data: inter700,
          style: "normal",
          weight: 700,
        },
        {
          name: "Inter",
          data: inter900,
          style: "normal",
          weight: 900,
        },
      ],
    },
  );
}
