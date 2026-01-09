"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { removeAccessToken } from "@/lib/cookies";
import { GlobalSearch } from "@/components/global-search";
import { Search, X } from "lucide-react";

export function Navbar() {
  const router = useRouter();
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore errors, still logout locally
    }
    removeAccessToken();
    logout();
    router.push("/login");
  };

  return (
    <>
        {/* Free Tier Warning Banner */}
      {isBannerVisible && (
        <div className="fixed top-[55px] z-40 w-full bg-yellow-100/90 backdrop-blur-sm border-b border-yellow-200 px-4 py-1.5 flex items-center justify-center gap-2">
          <div className="text-center text-xs font-medium text-yellow-800 flex items-center gap-2">
            <span className="shrink-0">⚠️</span>
            <span>
              Backend hosted on free instance. Cold starts may take 40-55s if idle.
            </span>
          </div>
          <button 
            onClick={() => setIsBannerVisible(false)}
            className="ml-auto md:ml-2 hover:bg-yellow-200/50 rounded p-0.5 transition-colors"
          >
            <X className="h-3 w-3 text-yellow-800" />
            <span className="sr-only">Dismiss</span>
          </button>
        </div>
      )}
      <header className="w-full px-4 py-3 backdrop-blur-sm bg-background/80 border-b z-50 fixed top-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/" className="text-xl font-bold hover:opacity-80 transition-opacity">
            Project Tech
          </Link>
          <nav className="flex items-center gap-4">
            {isLoading ? (
              <div className="h-9 w-20 animate-pulse bg-muted rounded-md" />
            ) : isAuthenticated ? (
              <>
                {/* Search Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-muted-foreground"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Search</span>
                  <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-2">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </Button>
                <Link
                  href="/projects"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Projects
                </Link>
                <Link
                  href="/profile"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  {user?.name || "Profile"}
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Sign up</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      

      {/* Global Search Modal */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}