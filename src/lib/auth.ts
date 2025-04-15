const apiUrl = process.env.NEXT_PUBLIC_RP_API;

export async function register(email: string, password: string) {
	try {
		const response = await fetch(
			`${apiUrl}register`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }),
			},
		);

		if (response.ok) {
			return { success: true };
		}

		const error = await response.text();
		throw new Error(error);
	} catch (error) {
		console.error("Registration error:", error);
		throw new Error(
			"An error occurred during registration. Please try again later.",
		);
	}
}

export async function login(email: string, password: string) {
	try {
		const response = await fetch(`${apiUrl}login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email, password }),
		});

		if (response.ok) {
			const data = await response.json();
			return data.token;
		}

		const error = await response.text();
		throw new Error(error);
	} catch (error) {
		console.error("Login error:", error);
		throw new Error("An error occurred during login. Please try again later.");
	}
}
