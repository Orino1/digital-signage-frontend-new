"use client"

import { Button } from '@/components/ui/button';

export default function Home() {


	return (
		<section className="flex flex-col items-center justify-center min-h-screen bg-background">
			<h1 className="text-4xl font-bold mb-6">Welcome to Our App</h1>
			<div className="flex gap-4">
				<Button asChild>
					<a href="/login">Sign In</a>
				</Button>
				<Button asChild>
					<a href="/signup">Sign Up</a>
				</Button>
			</div>
		</section>
	);
}