import "./globals.css";

import { Inter } from "next/font/google";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Raspberry Pi",
	description: "Raspberry Pi",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (

		<html lang="en">
			<body className={`${inter.className} overflow-hidden`}>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					<Navbar />
					{children}
				</ThemeProvider>
			</body>
		</html>

	);
}
