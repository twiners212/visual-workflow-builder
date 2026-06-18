"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Network, History, Settings, HelpCircle, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/executions", label: "Execution History", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-[260px] bg-surface-container-low border-r border-outline-variant flex flex-col z-20 md:flex hidden">
      {/* Brand/Header */}
      <div className="px-lg py-md border-b border-outline-variant flex items-center gap-md h-16 shrink-0">
        <div className="w-8 h-8 rounded bg-primary text-on-primary flex items-center justify-center font-bold font-headline-sm">
          V
        </div>
        <div>
          <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">VisualFlow</h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant">v2.0.0</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-md flex flex-col gap-sm">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href === "/dashboard" && pathname === "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-md px-lg py-sm transition-colors cursor-pointer active:opacity-80 ${
                isActive
                  ? "bg-secondary-container text-on-secondary-container border-l-2 border-primary"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="font-body-md text-body-md font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="p-md border-t border-outline-variant flex flex-col gap-sm shrink-0">
        <Link
          href="/help"
          className="flex items-center gap-md px-lg py-sm text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer active:opacity-80"
        >
          <HelpCircle className="w-5 h-5 shrink-0" />
          <span className="font-body-md text-body-md font-medium">Help</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-md px-lg py-sm text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer active:opacity-80 w-full text-left"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="font-body-md text-body-md font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
}
