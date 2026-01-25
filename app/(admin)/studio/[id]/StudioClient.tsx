"use client";

import { useRef, useState, useCallback } from "react";
import { toPng } from "html-to-image";
import { saveAs } from "file-saver";
import { Loader2, Download, RefreshCcw, LayoutTemplate } from "lucide-react";
import { Expression } from "@/types/database";
import { SERVICE_NAME } from "@/constants";
import { cn } from "@/lib/utils";
import ExpressionCard from "@/components/ExpressionCard";

interface StudioClientProps {
  expression: Expression;
}

const BACKGROUNDS = [
  {
    id: "mango",
    name: "Mango",
    class: "bg-[linear-gradient(135deg,#fceca4_0%,#f97316_50%,#15803d_100%)]",
  },
  { id: "brand", name: "Brand Blue", class: "bg-blue-500" },
  {
    id: "gradient-blue",
    name: "Ocean",
    class: "bg-linear-to-br from-blue-400 to-blue-600",
  },
  {
    id: "gradient-purple",
    name: "Sunset",
    class: "bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500",
  },
  {
    id: "gradient-dark",
    name: "Midnight",
    class: "bg-linear-to-br from-zinc-900 to-zinc-800",
  },
  {
    id: "solid-white",
    name: "Clean",
    class: "bg-zinc-100",
  },
];

const RATIOS = [
  { id: "square", name: "Square (1:1)", class: "aspect-square max-w-[500px]" },
  { id: "story", name: "Story (9:16)", class: "aspect-[9/16] max-w-[360px]" },
];

export default function StudioClient({ expression }: StudioClientProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [selectedBg, setSelectedBg] = useState(BACKGROUNDS[0]);
  const [selectedRatio, setSelectedRatio] = useState(RATIOS[0]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!captureRef.current) return;

    try {
      setIsGenerating(true);

      // 1. Wait for fonts and images (simple timeout for safety)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 2. Generate Image
      const dataUrl = await toPng(captureRef.current, {
        cacheBust: true,
        pixelRatio: 2, // High resolution (Retina)
        style: {
          transform: "scale(1)", // Ensure no transform artifacts
        },
      });

      // 3. Save File
      const fileName = `speak-mango-${expression.expression
        .toLowerCase()
        .replace(/\s+/g, "-")}.png`;
      saveAs(dataUrl, fileName);
    } catch (err) {
      console.error("Failed to generate image", err);
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [expression.expression]);

  return (
    <div className="min-h-screen bg-zinc-50 p-4 sm:p-8 flex flex-col items-center gap-8">
      {/* Header */}
      <div className="w-full max-w-4xl flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Marketing Studio</h1>
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95"
        >
          {isGenerating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
          Download PNG
        </button>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl items-start justify-center">
        {/* Preview Area */}
        <div className="flex-1 w-full flex justify-center items-center bg-zinc-200/50 rounded-3xl p-8 lg:p-12 border border-zinc-200 overflow-auto shadow-inner">
          <div
            ref={captureRef}
            id="studio-capture-area"
            className={cn(
              "relative flex items-center justify-center p-8 shadow-2xl transition-all duration-500 ease-in-out",
              selectedBg.class,
              selectedRatio.class,
            )}
          >
            {/* Branding/Watermark */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-90 whitespace-nowrap z-50">
              <div className="flex items-center gap-1">
                {/* Logo */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/logo.png"
                  alt="Logo"
                  className="w-5 h-5 object-contain drop-shadow-md"
                />
                {/* Text with Gradient */}
                <span
                  className="text-xs font-black tracking-tight"
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    background:
                      "linear-gradient(135deg, #fceca4 0%, #f97316 50%, #15803d 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {SERVICE_NAME}
                </span>
              </div>
            </div>

            <div className="w-full h-full flex items-center justify-center">
              <div className="w-full">
                <ExpressionCard item={expression} isStatic={true} />
              </div>
            </div>
          </div>
        </div>

        {/* Controls Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-8">
          {/* Backgrounds */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <RefreshCcw className="w-4 h-4" /> Background
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setSelectedBg(bg)}
                  className={cn(
                    "h-12 rounded-xl border-2 transition-all hover:scale-105 active:scale-95",
                    bg.class,
                    selectedBg.id === bg.id
                      ? "border-zinc-900 shadow-md scale-105"
                      : "border-transparent opacity-80 hover:opacity-100",
                  )}
                  aria-label={bg.name}
                  title={bg.name}
                />
              ))}
            </div>
          </div>

          {/* Ratio */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4" /> Size
            </h3>
            <div className="flex flex-col gap-2">
              {RATIOS.map((ratio) => (
                <button
                  key={ratio.id}
                  onClick={() => setSelectedRatio(ratio)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all",
                    selectedRatio.id === ratio.id
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-transparent bg-zinc-50 text-zinc-600 hover:bg-zinc-100",
                  )}
                >
                  {ratio.name}
                  {selectedRatio.id === ratio.id && (
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
