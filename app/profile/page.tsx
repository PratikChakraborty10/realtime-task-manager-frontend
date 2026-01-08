"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFetch } from "@/hooks/useFetch";
import { useAuth } from "@/context/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ProfileResponse {
  success: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    gender: string;
    role: string;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, setUser } = useAuth();
  const { data, error, isLoading, fetchData } = useFetch<ProfileResponse>();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (isAuthenticated && !user) {
      fetchData("/api/auth/profile").then((response) => {
        if (response?.success && response.user) {
          setUser(response.user);
        }
      });
    }
  }, [authLoading, isAuthenticated, user, router, fetchData, setUser]);

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="rounded-md bg-destructive/10 p-4 text-center text-destructive">
              {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use user from context or from fetched data
  const displayUser = user || data?.user;

  if (!displayUser) {
    return null;
  }

  const initials = displayUser.name
    ? displayUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : displayUser.email[0].toUpperCase();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl">{displayUser.name || "User"}</CardTitle>
          <CardDescription>{displayUser.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Gender</p>
              <p className="capitalize">{displayUser.gender || "Not specified"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <p className="capitalize">{displayUser.role.toLowerCase()}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">User ID</p>
            <p className="text-sm font-mono text-muted-foreground break-all">
              {displayUser.id}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}