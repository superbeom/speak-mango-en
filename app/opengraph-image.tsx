import { ImageResponse } from "next/og";
import { SERVICE_NAME } from "@/constants";

// Route segment config
export const runtime = "nodejs";

// Image metadata
export const alt = `${SERVICE_NAME} - Learn English Expressions`;
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = "image/png";

// Image generation
export default async function Image() {
    // 로고 이미지를 가져오기 위해 절대 경로 사용 (빌드 타임/런타임 고려)
    // nodejs 런타임이므로 fs 사용 가능
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path");

    const logoPath = path.join(process.cwd(), "public/assets/logo.png");
    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    // 오렌지-옐로우-그린 그라데이션 (로고 색상 기반)
                    background: "linear-gradient(135deg, #fceca4 0%, #f97316 50%, #15803d 100%)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "40px",
                    }}
                >
                    {/* Logo */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={logoBase64}
                        alt={SERVICE_NAME}
                        width="250"
                        height="250"
                    />

                    {/* Text */}
                    <div
                        style={{
                            fontSize: 100,
                            fontWeight: 800,
                            color: "white",
                            fontFamily: "sans-serif",
                            textShadow: "0 4px 12px rgba(0,0,0,0.2)",
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        {SERVICE_NAME}
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
