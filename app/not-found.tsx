"use client";

import Link from "next/link";
import { Search, Home, ArrowLeft } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { SERVICE_NAME } from "@/constants";
import { ERROR_CODES } from "@/constants/errors";

export default function NotFound() {
  const { dict } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
      {/* Visual Element */}
      <div className="relative mb-8">
        <div className="bg-zinc-100 dark:bg-zinc-900 p-8 rounded-3xl relative z-10">
          <div className="w-20 h-20 text-zinc-400 dark:text-zinc-600 relative">
            <Search className="w-full h-full stroke-[1.5]" />
            <span className="absolute -top-1 -right-1 flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-6 w-6 bg-orange-500 items-center justify-center text-[10px] font-bold text-white">
                !
              </span>
            </span>
          </div>
        </div>
        {/* Background Decorative Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-2xl z-0"></div>
      </div>

      <div className="space-y-3 mb-10">
        <h1 className="text-4xl sm:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
          {ERROR_CODES.NOT_FOUND}
        </h1>
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-800 dark:text-zinc-200">
          {dict.error.notFoundTitle}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
          {dict.error.notFoundDescription}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="group flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded-2xl font-bold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95 w-full sm:w-auto sm:cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          {dict.common.back}
        </button>
        <Link
          href="/"
          className="group flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 rounded-2xl font-bold hover:shadow-xl hover:shadow-zinc-500/20 transition-all active:scale-95 w-full sm:w-auto"
        >
          <Home className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
          {dict.error.goHome}
        </Link>
      </div>

      {/* Subtle Illustration or Text */}
      <div className="mt-16 pt-8 border-t border-zinc-100 dark:border-zinc-900 w-full max-w-xs">
        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-[0.2em]">
          {SERVICE_NAME}
        </p>
      </div>
    </div>
  );
}
