import { ImageResponse } from "next/og";
import { getContentLocale } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { SERVICE_NAME } from "@/constants";
import { getExpressionById } from "@/services/queries/expressions";

// Route segment config
export const runtime = "nodejs";

// Image metadata
export const alt = "Expression Preview";
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
export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const expression = await getExpressionById(id);

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

  if (!expression) {
    return new ImageResponse(
      <div
        style={{
          fontSize: 48,
          background: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Expression Not Found
      </div>,
      { ...size },
    );
  }

  // Use content locale logic
  const contentLocale = getContentLocale(expression.meaning, locale);
  const meaning = expression.meaning[contentLocale] || "";

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
          gap: "50px",
        }}
      >
        {/* Header: Logo + Service Name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoBase64} alt={SERVICE_NAME} width="80" height="80" />
          <div
            style={{
              fontSize: 50,
              fontWeight: 700,
              fontFamily: '"Inter", sans-serif',
              background:
                "linear-gradient(135deg, #fceca4 0%, #f97316 50%, #15803d 100%)",
              backgroundClip: "text",
              color: "transparent",
              display: "flex",
              alignItems: "center",
              paddingBottom: "10px",
            }}
          >
            {SERVICE_NAME}
          </div>
        </div>

        {/* Main Expression */}
        <div
          style={{
            fontSize: 90,
            fontWeight: 900,
            color: "#000000",
            lineHeight: 1.1,
            wordBreak: "break-word",
            maxWidth: "1000px",
          }}
        >
          {expression.expression}
        </div>

        {/* Meaning */}
        <div
          style={{
            fontSize: 30,
            fontWeight: 500,
            color: "#4b5563", // Gray-600
            maxWidth: "900px",
          }}
        >
          {meaning}
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
