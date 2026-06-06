import { NextResponse } from "next/server";
import { AuthApiError } from "./supabase-auth";

export function authJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function authErrorJson(error: unknown) {
  if (error instanceof AuthApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.status }
    );
  }

  console.error("Unhandled auth route error:", error);
  return NextResponse.json(
    {
      error: "Authentication service failed.",
      code: "AUTH_SERVICE_FAILED",
    },
    { status: 500 }
  );
}
