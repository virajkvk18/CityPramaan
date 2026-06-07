import { NextResponse } from "next/server";

export async function proxyBackendRequest(request: Request, path: string) {
  const backendUrl = getBackendUrl();
  const headers: Record<string, string> = {
    "Content-Type": request.headers.get("content-type") || "application/json",
  };
  const authorization = request.headers.get("authorization");

  if (authorization) {
    headers.Authorization = authorization;
  }

  try {
    const response = await fetch(`${backendUrl}${path}`, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
      cache: "no-store",
    });
    const responseText = await response.text();

    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    console.error("CityPramaan backend auth proxy failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "CityPramaan backend is unavailable. Check BACKEND_URL in Vercel and the Render service.",
        code: "BACKEND_UNAVAILABLE",
      },
      { status: 503 }
    );
  }
}

export async function fetchBackendJson<T>(path: string, init?: RequestInit): Promise<{ data?: T; response?: Response; error?: string }> {
  const backendUrl = getBackendUrl();

  try {
    const response = await fetch(`${backendUrl}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
    const data = (await response.json().catch(() => undefined)) as T | undefined;

    return { data, response };
  } catch (error) {
    console.error("CityPramaan backend proxy failed:", error);
    return { error: "CityPramaan backend is unavailable." };
  }
}

function getBackendUrl() {
  const configured =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:5000";

  return configured.replace(/\/$/, "");
}
