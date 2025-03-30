"use client";

import { Button } from "@/components/ui/button";
import { CircleUserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { login } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

const LoginPage = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const token = await login(email, password);
			localStorage.setItem('authToken', token);
			router.push('/dashboard');
		} catch (error) {
			alert('Login failed. Please try again.');
		}
	};

	return (
		<div className="h-screen flex flex-col justify-center items-center">
			<div>
				<form
					onSubmit={handleSubmit}
					className="space-y-4 items-center justify-center flex flex-col"
				>
					<CircleUserRound className="size-32" strokeWidth={1} />
					<Input
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="rounded-[8px] w-[340px] text-black  "
						type="text"
						placeholder="Enter your email"
						required
					/>
					<Input
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="rounded-[8px] w-[340px] text-black "
						type="password"
						placeholder="Enter your password"
						required
					/>
					<Button size="lg" variant="default" className="w-full bg-[#16B364] hover:bg-[#16B364]/80">
						Login
					</Button>
					<p className="mt-4 text-center">
						{"Don't have an account?"} <Link href="/signup" className="text-blue-500 hover:underline">{"Sign Up"}</Link>
					</p>
				</form>
			</div>
		</div>
	);
};

export default LoginPage;