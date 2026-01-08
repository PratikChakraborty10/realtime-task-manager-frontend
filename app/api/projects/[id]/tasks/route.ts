import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000/api/v1";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params;
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get("limit") || "20";
        const cursor = searchParams.get("cursor");

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

        const queryParams = new URLSearchParams({ limit });
        if (cursor) queryParams.append("cursor", cursor);

        const response = await fetch(
            `${API_BASE_URL}/projects/${projectId}/tasks?${queryParams}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Tasks list API error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params;
        const body = await request.json();

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

        const response = await fetch(
            `${API_BASE_URL}/projects/${projectId}/tasks`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            }
        );

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Create task API error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
