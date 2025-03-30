import { useEffect, useState } from "react";

export function useAuth() {
	const [authToken, setAuthToken] = useState<string | null>(null);

	useEffect(() => {
		// Retrieve the token from localStorage on component mount
		const token = localStorage.getItem("authToken");
		if (token) {
			setAuthToken(token);
		}
	}, []);

	const login = (token: string) => {
		localStorage.setItem("authToken", token);
		setAuthToken(token);
	};

	const logout = () => {
		localStorage.removeItem("authToken");
		setAuthToken(null);
	};

	return { authToken, login, logout };
}
