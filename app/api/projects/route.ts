import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000/api/v1";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get("limit") || "20";
        const cursor = searchParams.get("cursor");

        // Get token from Authorization header or cookies
        let token = request.headers.get("Authorization")?.replace("Bearer ", "");

        if (!token) {
            const cookieStore = await cookies();
            token = cookieStore.get("access_token")?.value;
        }

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Access denied. No token provided." },
                { status: 401 }
            );
        }

        const params = new URLSearchParams({ limit });
        if (cursor) params.append("cursor", cursor);

        const response = await fetch(`${API_BASE_URL}/projects?${params}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Projects API error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
