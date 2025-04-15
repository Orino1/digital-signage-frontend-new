import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const apiUrl = process.env.NEXT_PUBLIC_RP_API;

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { file_name, file_type } = body;
		const authHeader = request.headers.get("Authorization");

		if (!authHeader) {
			console.error("No Authorization header provided");
			return NextResponse.json(
				{ error: "No Authorization header provided" },
				{ status: 401 },
			);
		}

		const response = await fetch(
			`${apiUrl}generate_presigned_url`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: authHeader,
				},
				body: JSON.stringify({ file_name, file_type }),
			},
		);

		const responseText = await response.text();

		if (!response.ok) {
			return NextResponse.json(
				{
					error: `Failed to generate presigned URL: ${response.status} ${responseText}`,
					details: responseText,
					status: response.status,
				},
				{ status: response.status },
			);
		}

		let data;
		try {
			data = JSON.parse(responseText);
		} catch (parseError) {
			return NextResponse.json(
				{
					error: "Invalid JSON response from upstream server",
					details: responseText,
				},
				{ status: 500 },
			);
		}

		return NextResponse.json(data);
	} catch (error) {
		return NextResponse.json(
			{
				error: "Internal server error",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
