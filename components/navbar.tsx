"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { removeAccessToken } from "@/lib/cookies";

export function Navbar() {
  const router = useRouter();
  const { isAuthenticated, isLoading, logout, user } = useAuth();

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
  );
}