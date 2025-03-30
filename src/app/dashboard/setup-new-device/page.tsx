"use client";

import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";

import { X } from "lucide-react";
import {
    Scanner,
    IScannerStyles,
    IScannerComponents,
} from "@yudiel/react-qr-scanner";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

declare global {
    interface Window {
        ymaps: any;
    }
}

const SetupNewDevice = () => {
    const [pin, setPin] = useState("");
    const [location, setLocation] = useState("");
    const [name, setName] = useState("");
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    // new
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isScanning, setIsScanning] = useState(false);

	useEffect(() => {
		const handleAuth = async () => {
			const token = localStorage.getItem('authToken');
			if (!token) {
				console.error("No auth token found");
				router.push('/login');
				return;
			}
		}

		handleAuth()
	})

    useEffect(() => {
        const pinQuery = searchParams.get("pin");
        if (pinQuery) {
            setPin(pinQuery);
        }
    }, [searchParams]);

    const handleScan = (result: any) => {
        const url = result[0].rawValue;
        // extract query param
        const pin = url.split("=")[1]
        setPin(pin);
        setIsScanning(false);
    };

    const scannerStyles: IScannerStyles = {
        container: {
            width: "auto",
            height: "auto",
        },
        video: {
            width: "auto",
            height: "auto",
        },
        finderBorder: 0,
    };

    const scannerComponents: IScannerComponents = {
        finder: false,
    };

    // useEffect(() => {
    // 	if (isMapLoaded && window.ymaps) {
    // 		window.ymaps.ready(initMap);
    // 	}
    // }, [isMapLoaded]);
    //
    // const initMap = () => {
    // 	if (window.ymaps?.geolocation) {
    // 		window.ymaps.geolocation.get({
    // 			provider: 'auto',
    // 			mapStateAutoApply: true
    // 		}).then((result: any) => {
    // 			const coords = result.geoObjects.position;
    // 			setLocation(`${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`);
    // 		}).catch((error: any) => {
    // 			console.error("Error getting geolocation:", error);
    // 			alert("Failed to get location. Please enter it manually.");
    // 		});
    // 	} else {
    // 		console.error("Yandex Maps API is not fully loaded");
    // 		alert("Location service is not available. Please enter location manually.");
    // 	}
    // };

    const handleLocationClick = () => {
        if (isMapLoaded && window.ymaps) {
            initMap();
        } else {
            alert("Map is still loading. Please try again in a moment.");
        }
    };

    const validateCoordinates = (value: string) => {
        const coords = value.split(",").map((coord) => coord.trim());
        if (coords.length !== 2) return false;

        const [lat, lon] = coords.map(Number);
        return (
            !isNaN(lat) &&
            !isNaN(lon) &&
            lat >= -90 &&
            lat <= 90 &&
            lon >= -180 &&
            lon <= 180
        );
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!pin || !location || !name) {
            alert("Please fill in all fields");
            return;
        }

        // if (!validateCoordinates(location)) {
        // 	alert("Please enter valid coordinates (latitude, longitude)");
        // 	return;
        // }

        try {
            // const [latitude, longitude] = location.split(',').map(coord => coord.trim());
            const token = localStorage.getItem("authToken");

            if (!token) {
                alert("You are not authenticated. Please login.");
                router.push("/login");
                return;
            }

            const response = await fetch(`${apiUrl}devices`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name,
                    location: location,
                    pin,
                }),
            });

            if (response.ok) {
                router.push("/dashboard/devices");
            } else {
                alert("Failed to add device. Please try again.");
            }
        } catch (error) {
            console.error("Error adding device:", error);
            alert("An error occurred. Please try again.");
        }
    };

    return (
        <>
            <Script
                src={`https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}&lang=en_US`}
                onLoad={() => setIsMapLoaded(true)}
            />
            <div className="setup-new-device">
                <div className="min-h-screen text-white flex flex-col items-center justify-center p-4">
                    <h1>Setup New Device</h1>
                    <div className="w-full max-w-md space-y-8">
                        <div className="flex justify-center">
                            <svg
                                width="200"
                                height="200"
                                viewBox="0 0 380 380"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-32 h-32 md:w-48 md:h-48 text-foreground"
                            >
                                <title>Device Icon</title>
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M25.3333 82.6667C25.3333 80.987 26.0006 79.3761 27.1883 78.1883C28.3761 77.0006 29.987 76.3333 31.6667 76.3333H348.333C350.013 76.3333 351.624 77.0006 352.812 78.1883C353.999 79.3761 354.667 80.987 354.667 82.6667V272.667C354.667 274.346 353.999 275.957 352.812 277.145C351.624 278.333 350.013 279 348.333 279H31.6667C29.987 279 28.3761 278.333 27.1883 277.145C26.0006 275.957 25.3333 274.346 25.3333 272.667V82.6667ZM31.6667 51C14.1867 51 0 65.1867 0 82.6667V272.667C0 290.147 14.1867 304.333 31.6667 304.333H128.516L122.36 337.241C121.984 339.252 122.056 341.32 122.57 343.3C123.083 345.279 124.027 347.121 125.332 348.696C126.638 350.27 128.274 351.537 130.125 352.408C131.975 353.278 133.995 353.731 136.04 353.733H243.96C246.005 353.731 248.025 353.278 249.875 352.408C251.726 351.537 253.362 350.27 254.668 348.696C255.973 347.121 256.917 345.279 257.43 343.3C257.944 341.32 258.016 339.252 257.64 337.241L251.484 304.333H348.333C365.813 304.333 380 290.147 380 272.667V82.6667C380 65.1867 365.813 51 348.333 51H31.6667ZM228.253 304.333H151.747L146.731 330.933H233.269L228.253 304.333Z"
                                    fill="currentColor"
                                />
                                <text
                                    x="190"
                                    y="180"
                                    textAnchor="middle"
                                    fill="currentColor"
                                    fontSize="36"
                                    fontFamily="Arial, sans-serif"
                                >
                                    J23gXYn5
                                </text>
                                <text
                                    x="190"
                                    y="210"
                                    textAnchor="middle"
                                    fill="currentColor"
                                    fontSize="18"
                                    fontFamily="Arial, sans-serif"
                                >
                                    YOUR PIN
                                </text>
                            </svg>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Input
                                    type="text"
                                    placeholder="Enter Pin here"
                                    className="text-black flex-grow"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    required
                                />
                                <Button
                                    type="button"
                                    onClick={() => setIsScanning(true)}
                                >
                                    Scan QR
                                </Button>
                            </div>
                            {isScanning && (
                                <div
                                    style={{
                                        position: "fixed",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        backgroundColor: "black",
                                        zIndex: 1000,
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                    }}
                                >
                                    <Button
                                        onClick={() => setIsScanning(false)}
                                        className="absolute top-4 right-4 z-10 rounded-full p-2"
                                        variant="secondary"
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                    <Scanner
                                        styles={scannerStyles}
                                        components={scannerComponents}
                                        onScan={handleScan}
                                    />
                                </div>
                            )}
                            <Input
                                type="text"
                                placeholder="Location (latitude, longitude)"
                                className=" text-black"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                // onClick={handleLocationClick}
                                required
                            />
                            <Input
                                type="text"
                                placeholder="Name"
                                className=" text-black "
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />

                            <div className="flex space-x-4">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => router.back()}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="default"
                                    className="flex-1 bg-green-500 hover:bg-green-600"
                                >
                                    Save
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SetupNewDevice;
