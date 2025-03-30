import { S3Object } from "@/types"; // Assuming you have a types file

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export async function listS3Objects(
	authToken: string,
): Promise<{ objects: S3Object[] }> {

	const response = await fetch(
		`${apiUrl}list-s3-objects`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${authToken}`,
			},
		},
	);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`Failed to fetch media list: ${response.status} ${response.statusText}. ${errorText}`,
		);
	}

	return response.json();
}

export function getS3ObjectUrl(key: string): string {
	return `${apiUrl}list-s3-object/${encodeURIComponent(key)}`;
}

// Add other API methods here as needed
