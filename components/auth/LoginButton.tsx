"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Avatar from "@radix-ui/react-avatar";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import LoginModal from "./LoginModal";

export default function LoginButton() {
  const { user, status } = useAuthUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Loading skeleton
  if (status === "loading") {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
    );
  }

  // Logged In: Avatar with Dropdown
  if (user) {
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="relative flex h-8 w-8 sm:cursor-pointer shrink-0 overflow-hidden rounded-full border border-zinc-200 shadow-sm transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:focus:ring-zinc-300">
            <Avatar.Root>
              <Avatar.Image
                className="aspect-square h-full w-full object-cover"
                src={user.image || undefined}
                alt={user.name || "User"}
              />
              <Avatar.Fallback className="flex h-full w-full items-center justify-center bg-zinc-100 text-[10px] font-medium uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {user.name?.[0] || "U"}
              </Avatar.Fallback>
            </Avatar.Root>
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 min-w-48 overflow-hidden rounded-md border border-zinc-200 bg-white p-1 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-zinc-800 dark:bg-zinc-950"
            sideOffset={5}
            align="end"
          >
            <div className="px-2 py-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              My Account
            </div>
            <div className="px-2 pb-2 text-xs text-zinc-500 dark:text-zinc-400">
              {user.email}
            </div>

            <DropdownMenu.Separator className="-mx-1 my-1 h-px bg-zinc-100 dark:bg-zinc-800" />

            <DropdownMenu.Item className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-zinc-100 focus:text-zinc-900 data-disabled:pointer-events-none data-disabled:opacity-50 dark:focus:bg-zinc-800 dark:focus:text-zinc-50">
              <User className="h-4 w-4" />
              <span>My Page (Preparing)</span>
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="-mx-1 my-1 h-px bg-zinc-100 dark:bg-zinc-800" />

            <DropdownMenu.Item
              className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-red-600 outline-none transition-colors focus:bg-red-50 focus:text-red-700 data-disabled:pointer-events-none data-disabled:opacity-50 dark:focus:bg-red-950/20 dark:focus:text-red-400"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  }

  // Logged Out: Sign In Button
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex h-8 sm:cursor-pointer items-center justify-center rounded-full bg-zinc-900 px-4 text-xs font-medium text-zinc-50 shadow transition-colors hover:bg-zinc-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 dark:focus-visible:ring-zinc-300"
      >
        Sign In
      </button>

      <LoginModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
