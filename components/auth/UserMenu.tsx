"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User } from "next-auth";
import { signOut } from "next-auth/react";
import { LogOut, User as UserIcon } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Avatar from "@radix-ui/react-avatar";
import { useI18n } from "@/context/I18nContext";
import { ROUTES } from "@/lib/routes";

interface UserMenuProps {
  user: User;
}

export default function UserMenu({ user }: UserMenuProps) {
  const pathname = usePathname();
  const { dict } = useI18n();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: ROUTES.HOME });
  };

  if (isLoggingOut) {
    return <div className="skeleton-avatar" />;
  }

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button className="btn-avatar-trigger">
          <Avatar.Root>
            {user.image && (
              <Avatar.Image asChild src={user.image} alt={user.name || "User"}>
                <Image
                  src={user.image}
                  alt={user.name || "User"}
                  width={40}
                  height={40}
                  className="aspect-square h-full w-full object-cover"
                />
              </Avatar.Image>
            )}
            <Avatar.Fallback className="avatar-fallback">
              {user.name?.[0] || "U"}
            </Avatar.Fallback>
          </Avatar.Root>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="dropdown-content"
          sideOffset={5}
          align="end"
        >
          <div className="px-2 py-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {dict.auth.myAccount}
          </div>
          <div className="px-2 pb-2 text-xs text-zinc-500 dark:text-zinc-400">
            {user.email}
          </div>

          <DropdownMenu.Separator className="dropdown-separator" />

          <DropdownMenu.Item
            className="dropdown-item group"
            disabled={pathname === ROUTES.MY_PAGE}
            asChild
          >
            <Link href={ROUTES.MY_PAGE}>
              <UserIcon className="h-4 w-4 transition-transform sm:group-focus:scale-110" />
              <span>{dict.auth.myPage}</span>
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="dropdown-separator" />

          <DropdownMenu.Item
            className="dropdown-item-danger group"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 transition-transform sm:group-focus:translate-x-0.5" />
            <span>{dict.auth.signOut}</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
