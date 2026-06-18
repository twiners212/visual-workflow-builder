"use client";

import { Bell, HelpCircle, Search, Menu } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function Header() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  return (
    <header className="h-16 bg-surface border-b border-outline-variant flex items-center justify-between px-lg z-10 w-full shrink-0">
      <div className="flex items-center gap-md">
        {/* Mobile Menu Toggle */}
        <button className="md:hidden p-sm text-on-surface-variant hover:bg-surface-container-high rounded-full">
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-headline-sm text-headline-sm font-semibold text-on-surface md:hidden">
          Workflow Builder
        </span>
      </div>
      <div className="flex items-center gap-lg">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
          <input
            className="pl-xl pr-sm py-sm rounded-full bg-surface-container-high border-none text-body-md font-body-md focus:ring-2 focus:ring-primary w-64 outline-none text-on-surface placeholder:text-on-surface-variant"
            placeholder="Search workflows..."
            type="text"
          />
        </div>
        <div className="flex items-center gap-sm">
          <button className="p-sm text-on-surface-variant hover:text-primary transition-colors rounded-full">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-sm text-on-surface-variant hover:text-primary transition-colors rounded-full hidden md:block">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary-container border border-outline-variant overflow-hidden flex items-center justify-center">
          {user?.image ? (
            <img src={user.image} alt={user.name || "User Avatar"} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary text-on-primary font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
