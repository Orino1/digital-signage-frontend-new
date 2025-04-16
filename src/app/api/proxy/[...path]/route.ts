import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const apiUrl = process.env.NEXT_PUBLIC_RP_API;

export async function GET(request: NextRequest) {
	return handleProxy(request);
}

export async function POST(request: NextRequest) {
	return handleProxy(request);
}

export async function PUT(request: NextRequest) {
	return handleProxy(request);
}

export async function DELETE(request: NextRequest) {
	return handleProxy(request);
}

async function handleProxy(request: NextRequest) {
	const url = new URL(request.url);

	const cleanedApiUrl = apiUrl.slice(0, -1);
	const targetUrl = `${cleanedApiUrl}${url.pathname.replace("/api/proxy", "")}`;

	const headers = new Headers(request.headers);
	headers.delete("host");

	try {
		const proxyRequest = new Request(targetUrl, {
			method: request.method,
			headers: headers,
			body: request.body,
			cache: "no-store",
			credentials: "same-origin",
			mode: "cors",
			// @ts-ignore
			duplex: "half",
		});

		console.log("Proxying request to:", targetUrl);

		const response = await fetch(proxyRequest);

		console.log("Proxy response status:", response.status);

		const proxyResponse = new NextResponse(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
		});

		return proxyResponse;
	} catch (error) {
		console.error("Detailed proxy error:", {
			url: targetUrl,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		return new NextResponse(
			JSON.stringify({
				error: "Proxy error",
				details: error instanceof Error ? error.message : String(error),
				url: targetUrl,
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	}
}
