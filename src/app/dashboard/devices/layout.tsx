"use client";

import { useEffect, useState } from 'react';

import { usePathname } from 'next/navigation';

export default function DevicesLayout({ children }: { children: React.ReactNode }) {
    const [key, setKey] = useState(0);
    const pathname = usePathname();

    useEffect(() => {
        setKey(prev => prev + 1);
    }, [pathname]);

    return <div key={key}>{children}</div>;
}