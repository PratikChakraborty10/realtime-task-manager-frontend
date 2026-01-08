/**
 * Cookie utility functions for token management
 */

const ACCESS_TOKEN_KEY = "access_token";
const TOKEN_MAX_AGE = 60 * 60; // 1 hour in seconds

export function setAccessToken(token: string): void {
    document.cookie = `${ACCESS_TOKEN_KEY}=${token}; path=/; max-age=${TOKEN_MAX_AGE}; SameSite=Strict`;
}

export function getAccessToken(): string | null {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split("=");
        if (name === ACCESS_TOKEN_KEY) {
            return value || null;
        }
    }
    return null;
}

export function removeAccessToken(): void {
    document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0; SameSite=Strict`;
}
