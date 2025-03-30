"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { usePathname } from "next/navigation";
import { useState } from "react";

const Navbar = () => {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navItems = [
        { label: "Devices", href: "/dashboard/devices" },
        { label: "Setups", href: "/dashboard/setups" },
        { label: "Help", href: "/dashboard" },
    ];

    return (
        <nav className="bg-background p-4 fixed top-0 left-0 right-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                <div className="text-foreground font-bold text-xl">
                    Raspberry PI
                </div>

                <button
                    type="button"
                    className="md:hidden text-foreground"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    ☰
                </button>

                <div className="hidden md:flex items-center space-x-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`text-foreground hover:text-foreground/80 ${pathname === item.href ? "font-bold" : ""
                                }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                    <ThemeToggle />
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 right-0 bg-background p-4 flex flex-col space-y-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`text-foreground hover:text-foreground/80 ${pathname === item.href ? "font-bold" : ""
                                    }`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {item.label}
                            </Link>
                        ))}
                        <ThemeToggle />
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;