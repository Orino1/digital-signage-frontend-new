"use client";

import { Cog, RotateCcw, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import Image from "next/image";

// import snapshotUrlImage from "/public/snapshoturl.png";

interface Setup {
    id: number;
    name: string;
}

interface PlaylistData {
    id: number;
    data: { [key: string]: any };
}

interface Device {
    id: number;
    name: string;
    location: string;
    setup_id: number | null;
    used_port: number;
    last_seen: string;
    scheduled_playlist_id?: number;
}

const API_BASE_URL = "/api/proxy";
const raspApi = process.env.NEXT_PUBLIC_RP_API;
const androidApi = process.env.NEXT_PUBLIC_TV_API;

const Snapshot = () => {
    const params = useParams();
    const deviceId = params.deviceId as string;
    const router = useRouter();
    const [playlists, setPlaylists] = useState<{ [key: number]: string }>({});
    const [playlistObjects, setPlaylistObjects] = useState<PlaylistData[]>([]);
    const [selectedSetup, setSelectedSetup] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isRebooting, setIsRebooting] = useState(false);
    const [device, setDevice] = useState<Device | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [snapshotUrl, setSnapshotUrl] = useState<string>("");
    const [isMobile, setIsMobile] = useState<boolean>(false);

    const searchParams = useSearchParams();
    const deviceType = searchParams.get("type");

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        handleResize(); // Check on initial load
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    useEffect(() => {
        if (deviceId) {
            fetchSetups();
            fetchDevice();
        } else {
            setError("No device ID provided");
            setIsLoading(false);
        }
    }, [deviceId]);

    const parseDate = (dateString: string): Date => {
        const [datePart, timePart] = dateString.split(" ");
        const [year, month, day] = datePart.split("-").map(Number);
        const [hour, minute] = timePart.split(":").map(Number);
        return new Date(Date.UTC(year, month - 1, day, hour, minute));
    };

    useEffect(() => {
        if (device && device.last_seen) {
            const lastSeenDate = parseDate(device.last_seen);
            const now = new Date();
            console.log(Math.abs(now.getTime() - lastSeenDate.getTime()));
            console.log(now.getTime());
            console.log(lastSeenDate.getTime());
            if (Math.abs(now.getTime() - lastSeenDate.getTime()) < 60000) {
                // Within 1 minute
                captureSnapshot();
            }
        }
    }, [device]);

    const handleUnauthorized = () => {
        localStorage.removeItem("authToken");
        router.push("/login");
    };

    const fetchSetups = async () => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                console.error("No auth token found");
                router.push("/login");
                return;
            }

            // proxy if pi device otherwise android api directlly
            let correctApi = null;

            if (deviceType === "tv") {
                correctApi = androidApi;
            } else {
                correctApi = `${API_BASE_URL}/`;
            }

            const response = await fetch(`${correctApi}scheduled_playlists`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data: PlaylistData[] = await response.json();
                const result: { [key: number]: string } = {};

                for (const item of data) {
                    const playlistName = Object.keys(item.data)[0]; // Get the first key from the data object
                    result[item.id] = item.playlist_name; // Map id to playlist name
                }
                setPlaylistObjects(data);
                setPlaylists(result);
            } else {
                console.error("Failed to fetch setups");
                if (response.status === 401) {
                    router.push("/login");
                }
            }
        } catch (error) {
            console.error("Error fetching setups:", error);
        }
    };

    const fetchDevice = async () => {
        try {
            const token = localStorage.getItem("authToken");

            if (!token) {
                handleUnauthorized();
                return;
            }

            // proxy if pi device otherwise android api directlly
            let correctApi = null;
            let correctToken = null;

            if (deviceType === "tv") {
                correctApi = androidApi;
            } else {
                correctApi = `${API_BASE_URL}/`;
            }
            const response = await fetch(`${correctApi}devices/${deviceId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const deviceData: Device = await response.json();
                setDevice(deviceData);
                if (deviceData.scheduled_playlist_id) {
                    setSelectedSetup(
                        deviceData.scheduled_playlist_id.toString()
                    );
                }
            } else if (response.status === 401) {
                handleUnauthorized();
            } else {
                throw new Error(
                    `Failed to fetch device details: ${response.status}`
                );
            }
        } catch (error) {
            console.error("Error fetching device details:", error);
            setError("Error fetching device details. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetupChange = (value: string) => {
        console.log(value);
        setSelectedSetup(value);
    };

    const assignSetup = async () => {
        try {
            setIsAssigning(true);
            setMessage("Capturing Snapshot...");
            const token = localStorage.getItem("authToken");
            if (!token) {
                handleUnauthorized();
                return;
            }

            // proxy if pi device otherwise android api directlly
            let correctApi = null;

            if (deviceType === "tv") {
                correctApi = androidApi;
            } else {
                correctApi = `${API_BASE_URL}/`;
            }
            const response = await fetch(`${correctApi}devices/${deviceId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    scheduled_playlist_id: Number.parseInt(selectedSetup || ""),
                }),
            });

            if (response.ok) {
                setMessage("Setup assigned successfully");
                await new Promise((resolve) => setTimeout(resolve, 500));
                fetchDevice(); // Refresh device data after assignment
            } else if (response.status === 401) {
                handleUnauthorized();
            } else {
                throw new Error(`Failed to assign setup: ${response.status}`);
            }
        } catch (error) {
            console.error("Error assigning setup:", error);
            setError("Error assigning setup. Please try again.");
        } finally {
            setIsAssigning(false);
        }
    };

    const rebootDevice = async () => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                handleUnauthorized();
                return;
            }
            setIsRebooting(true);

            alert(
                "Press OK to send restart command sent, wait 15-20 seconds and check device"
            );

            const response = await fetch(
                `${API_BASE_URL}/reboot-device/${deviceId}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        scheduled_playlist_id: Number.parseInt(
                            selectedSetup || ""
                        ),
                    }),
                }
            );

            if (response.ok) {
                setIsRebooting(false);
                router.push("/dashboard/devices");
            } else if (response.status === 401) {
                handleUnauthorized();
            } else {
                throw new Error(`Failed to assign setup: ${response.status}`);
            }
        } catch (error) {
            console.error("Error assigning setup:", error);
            setError("Error restarting device. Please try again.");
        } finally {
            setIsAssigning(false);
        }
    };

    const updateDevice = async () => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            handleUnauthorized();
            return;
        }

        if (!device) return;
        try {
            const response = await fetch(`${API_BASE_URL}/sync/${deviceId}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    bucket_name: "os-versions",
                }),
            });

            if (response.ok) {
                const data = await response.json(); // Parse the response body as JSON
                console.log(data); // Log the data to check what is returned
                alert(data.message || "No message returned"); // Show the message if it exists
            } else if (response.status === 401) {
                handleUnauthorized();
            } else {
                console.error("Error capturing snapshot:", response.status);
            }
        } catch (error) {
            console.error("Error capturing snapshot:", error);
            setError("Error capturing snapshot. Please try again.");
        }
    };

    const captureSnapshot = async () => {
        if (!device) return;
        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                router.push("/login");
                return;
            }

            // proxy if pi device otherwise android api directlly
            let correctApi = null;

            if (deviceType === "tv") {
                correctApi = androidApi;
            } else {
                correctApi = `${API_BASE_URL}/`;
            }

            const response = await fetch(
                `${correctApi}take_screenshot/${deviceId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                const snapshotBlob = await response.blob();
                const snapshotUrl = URL.createObjectURL(snapshotBlob);
                setSnapshotUrl(snapshotUrl);
                setMessage("Snapshot captured successfully");
            } else if (response.status === 401) {
                handleUnauthorized();
            } else {
                // throw new Error(`Failed to capture snapshot: ${response.status}`);
                console.error("Error capturing snapshot:", response.status);
            }
        } catch (error) {
            console.error("Error capturing snapshot:", error);
            setError("Error capturing snapshot. Please try again.");
        }
    };

    const deleteDevice = async () => {
        if (!confirm("Are you sure you want to delete this device?")) return;

        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                handleUnauthorized();
                return;
            }

            let correctApi = null;

            if (deviceType === "tv") {
                correctApi = androidApi;
            } else {
                correctApi = `${API_BASE_URL}/`;
            }
            const response = await fetch(`${correctApi}devices/${deviceId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                router.push("/dashboard/devices");
            } else if (response.status === 401) {
                handleUnauthorized();
            } else {
                throw new Error(`Failed to delete device: ${response.status}`);
            }
        } catch (error) {
            console.error("Error deleting device:", error);
            setError("Error deleting device. Please try again.");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen p-6 flex flex-col container">
                Loading...
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen p-6 flex flex-col container">
                Error: {error}
            </div>
        );
    }

    const convertToUserTimezone = (utcDateString) => {
        if (utcDateString) {
            const utcDate = new Date(utcDateString.replace(" ", "T") + "Z");

            const options = {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false, // Use 24-hour format
            };

            return utcDate.toLocaleString(undefined, options);
        } else {
            return "N/A";
        }
    };

    const assignedSetup = device?.scheduled_playlist_id
        ? playlists[device.scheduled_playlist_id]
        : undefined;
    const selectedSetupName = device?.scheduled_playlist_id
        ? playlists[device.scheduled_playlist_id]
        : undefined;

    const mobileMainContainerStyle = {
        display: "flex",
        justifyContent: "space-between",
    };

    const mobileBtnsContainerStyle = {
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        gap: "5px",
    };

    const mobileSetupContainerStyle = {
        display: "flex",
        flexDirection: "column",
        gap: "5px",
    };

    const mobileSetupHeaderStyle = {
        width: "100%",
    };

    const mobileSetupBodyStyle = {
        width: "100%",
        display: "flex",
        justifyContent: "flex-end",
    };

    return (
        <div className="min-h-screen p-6 flex flex-col container">
            <h1 className="text-3xl font-bold mb-6">Device Snapshot</h1>

            <div
                className="mb-4 flex justify-between items-center"
                style={isMobile ? mobileMainContainerStyle : null}
            >
                <p>Device: {device?.name || deviceId}</p>
                <div
                    className="space-x-2"
                    style={isMobile ? mobileBtnsContainerStyle : null}
                >
                    {deviceType !== "tv" ? (
                        <Button
                            onClick={rebootDevice}
                            disabled={isRebooting}
                            className={"bg-green-800"}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            {isRebooting ? "Restarting..." : "Restart Device"}
                        </Button>
                    ) : null}

                    <Button
                        onClick={deleteDevice}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Device
                    </Button>
                    {deviceType !== "tv" ? (
                        <Button
                            onClick={updateDevice}
                            variant="destructive"
                            className={"bg-gray-800"}
                        >
                            <Cog className="mr-2 h-4 w-4" />
                            Update OS
                        </Button>
                    ) : null}
                </div>
            </div>
            <p className="mb-4">Location: {device?.location || "N/A"}</p>
            <p className="mb-4">
                Last Seen:{" "}
                {convertToUserTimezone(device?.last_seen || "") || "N/A"}
            </p>

            <div
                className="flex justify-between items-center mb-8"
                style={isMobile ? mobileSetupContainerStyle : null}
            >
                <h3
                    className="text-2xl font-semibold"
                    style={isMobile ? mobileSetupHeaderStyle : null}
                >
                    Select Setup
                </h3>
                <div
                    className="flex items-center space-x-4"
                    style={isMobile ? mobileSetupBodyStyle : null}
                >
                    <Select
                        onValueChange={handleSetupChange}
                        value={selectedSetup || undefined}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Setup">
                                {selectedSetupName ||
                                    (assignedSetup
                                        ? `${assignedSetup} (Assigned)`
                                        : "Select Setup")}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {playlistObjects.map((playlistObj) => (
                                <SelectItem
                                    key={Object.keys(playlistObj.data)[0]}
                                    value={playlistObj.id.toString()}
                                    className="flex justify-between items-center"
                                >
                                    {playlistObj.playlist_name}
                                    {playlistObj.id ===
                                        device?.scheduled_playlist_id &&
                                        " (Assigned)"}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        onClick={assignSetup}
                        disabled={
                            !selectedSetup ||
                            isAssigning ||
                            selectedSetup ===
                                device?.scheduled_playlist_id?.toString()
                        }
                        className={isAssigning ? "bg-green-800" : ""}
                    >
                        {isAssigning ? "Assigning..." : "Assign Setup"}
                    </Button>
                </div>
            </div>

            {message && <p className="mt-4 text-green-500">{message}</p>}

            <div className="mt-8 justify-center items-center w-full">
                <h3 className="text-2xl font-semibold mb-4">Device Snapshot</h3>
                {snapshotUrl ? (
                    <Image
                        src={snapshotUrl}
                        alt="Device Snapshot"
                        width={800}
                        height={600}
                        className="rounded-lg shadow-md"
                    />
                ) : (
                    <div>Loading...</div>
                )}
            </div>
        </div>
    );
};

export default Snapshot;
