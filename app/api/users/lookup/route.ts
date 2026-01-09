import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000/api/v1";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json(
                { success: false, message: "Email is required" },
                { status: 400 }
            );
        }

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

        const response = await fetch(
            `${API_BASE_URL}/users/lookup?email=${encodeURIComponent(email)}`,
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
        console.error("User lookup API error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
