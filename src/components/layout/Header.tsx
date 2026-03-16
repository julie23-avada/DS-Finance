"use client";

import { useSession } from "next-auth/react";
import { Bell, User } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
          <Bell className="w-4 h-4 text-gray-600" />
        </button>

        <div className="flex items-center gap-2.5">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt={session.user.name ?? "User"}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-violet-200"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center ring-2 ring-violet-200">
              <User className="w-4 h-4 text-violet-600" />
            </div>
          )}
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-tight">
              {session?.user?.name ?? "User"}
            </p>
            <p className="text-xs text-gray-500">{session?.user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
