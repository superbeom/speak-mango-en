import { ImageResponse } from "next/og";
import { getContentLocale } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { SERVICE_NAME } from "@/constants";
import { getExpressionById } from "@/lib/expressions";

// Route segment config
export const runtime = "edge";

// Image metadata
export const alt = "Expression Preview";
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = "image/png";

// Image generation
export default async function Image({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const locale = await getLocale();
    const expression = await getExpressionById(id);

    if (!expression) {
        return new ImageResponse(
            (
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
                </div>
            ),
            { ...size }
        );
    }

    // Use content locale logic
    const contentLocale = getContentLocale(expression.meaning, locale);
    const meaning = expression.meaning[contentLocale] || "";

    return new ImageResponse(
        (
            <div
                style={{
                    background: "linear-gradient(to bottom right, #ffffff, #f8f9fa)",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "sans-serif",
                    position: "relative",
                }}
            >
                {/* Background Pattern */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage:
                            "radial-gradient(circle at 25px 25px, #e5e7eb 2%, transparent 0%), radial-gradient(circle at 75px 75px, #e5e7eb 2%, transparent 0%)",
                        backgroundSize: "100px 100px",
                        opacity: 0.5,
                    }}
                />

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "40px",
                        textAlign: "center",
                        zIndex: 10,
                    }}
                >
                    {/* Service Name Badge */}
                    <div
                        style={{
                            fontSize: 24,
                            fontWeight: 600,
                            color: "#3b82f6", // Blue-500
                            marginBottom: 40,
                            textTransform: "uppercase",
                            letterSpacing: "2px",
                        }}
                    >
                        {SERVICE_NAME}
                    </div>

                    {/* Main Expression */}
                    <div
                        style={{
                            fontSize: 80,
                            fontWeight: 900,
                            color: "#111827", // Gray-900
                            marginBottom: 30,
                            lineHeight: 1.1,
                            wordBreak: "break-word",
                            maxWidth: "1000px",
                            textShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        }}
                    >
                        {expression.expression}
                    </div>

                    {/* Meaning */}
                    <div
                        style={{
                            fontSize: 40,
                            fontWeight: 500,
                            color: "#4b5563", // Gray-600
                            maxWidth: "900px",
                        }}
                    >
                        {meaning}
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
