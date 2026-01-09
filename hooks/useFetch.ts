"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, removeAccessToken } from "@/lib/cookies";
import { useAuth } from "@/context/auth-context";

import { toast } from "sonner";

interface FetchOptions extends RequestInit {
    requireAuth?: boolean;
    showErrorToast?: boolean;
}

interface UseFetchResult<T> {
    data: T | null;
    error: string | null;
    isLoading: boolean;
    fetchData: (url: string, options?: FetchOptions) => Promise<T | null>;
}

/**
 * Custom fetch hook with 401 interceptor
 * Automatically handles authentication headers and redirects on 401
 */
export function useFetch<T = unknown>(): UseFetchResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { logout } = useAuth();

    const fetchData = useCallback(
        async (url: string, options: FetchOptions = {}): Promise<T | null> => {
            setIsLoading(true);
            setError(null);

            try {
                const { requireAuth = true, showErrorToast = true, ...fetchOptions } = options;

                const headers: HeadersInit = {
                    "Content-Type": "application/json",
                    ...(options.headers || {}),
                };

                // Add authorization header if required
                if (requireAuth) {
                    const token = getAccessToken();
                    if (token) {
                        (headers as Record<string, string>)["Authorization"] =
                            `Bearer ${token}`;
                    }
                }

                const response = await fetch(url, {
                    ...fetchOptions,
                    headers,
                });

                // Handle 401 - Unauthorized
                if (response.status === 401) {
                    logout();
                    removeAccessToken();
                    router.push("/login");
                    const msg = "Session expired. Please login again.";
                    setError(msg);
                    if (showErrorToast) toast.error(msg);
                    return null;
                }

                const result = await response.json();

                if (!response.ok) {
                    const msg = result.message || "An error occurred";
                    setError(msg);
                    if (showErrorToast) toast.error(msg);
                    return null;
                }

                setData(result);
                return result;
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "An unexpected error occurred";
                setError(errorMessage);
                if (options.showErrorToast !== false) toast.error(errorMessage);
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [router, logout]
    );

    return { data, error, isLoading, fetchData };
}
