"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import React, { useCallback, useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useParams, useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PlaylistForm from "@/components/PlaylistForm";

interface MediaItem {
    url: string;
    duration: number;
}

const raspApi = process.env.NEXT_PUBLIC_RP_API;
const androidApi = process.env.NEXT_PUBLIC_TV_API;

interface ScheduleItem {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    weekdays: string;
    images?: MediaItem[];
    videos?: MediaItem[];
}

interface Playlist {
    end_time: string;
    images: { duration: number; image_url: string }[];
    start_time: string;
    videos: { duration: number; video_url: string }[];
    weekdays: string;
}

interface ScheduledPlaylist {
    [playlistName: string]: Playlist;
}

interface PlaylistData {
    id: number;
    data: ScheduledPlaylist;
}

interface Device {
    id: number;
    data: string;
}

const Configuration = () => {
    const params = useParams();
    const setupId = params.setupId as string;
    const router = useRouter();
    const [playlist, setPlaylist] = useState<PlaylistData>({
        id: 0,
        data: {
            "Playlist Name": {
                start_time: "00:00",
                end_time: "23:59",
                weekdays: "1111111",
                images: [],
                videos: [],
            },
        },
    });
    const [devices, setDevices] = useState<Device[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [playlistName, setPlaylistName] = useState<string>("");
    const [androidDevicesCount, setAndroidDevicesCount] = useState<number>(0)

    const fetchSetup = useCallback(async () => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                console.error("No auth token found");
                router.push("/login");
                return;
            }

            // we need to fetch both so we can merge devices list under them
            const [raspRes, androidRes] = await Promise.all([
                fetch(
                    `${raspApi}scheduled_playlists/${setupId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                ),
                fetch(
                    `${androidApi}scheduled_playlists/${setupId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                )
            ])
            if (raspRes.ok && androidRes.ok) {
                const [raspData, androidData] = await Promise.all([raspRes.json(), androidRes.json()]);
                setPlaylist(raspData);
                const raspDevices = raspData.devices || [];
                const androidDevices = androidData.devices || [];
                setAndroidDevicesCount(androidDevices.length)
                const mergedDevices = [...raspDevices, ...androidDevices];
                setDevices(mergedDevices);
                setPlaylistName(raspData.playlist_name || "");
            } else {
                console.error("Failed to fetch setups");
                if (raspRes.status === 401 || androidRes.status === 401) {
                    router.push("/login");
                }
            }
        } catch (error) {
            console.error("Error fetching setup:", error);
            setError("Error fetching setup");
        }
    }, [setupId, router]);

    useEffect(() => {
        fetchSetup();
    }, [fetchSetup]);

    const handleSavePlaylist = async (updatedPlaylist: PlaylistData) => {
        try {
            setIsSaving(true);
            setError(null);
            const token = localStorage.getItem("authToken");
            if (!token) {
                console.error("No auth token found");
                router.push("/login");
                return;
            }

            const adjustedData = {
                data: updatedPlaylist.data,
                devices: devices,
                playlist_name: playlistName,
                id: updatedPlaylist.id,
            };

            const newSetup = setupId === "new" ? true : false;

            const method = setupId === "new" ? "POST" : "PUT";

            if (method === "POST") {
                // new setup
                const [raspRes, androidRes] = await Promise.all([
                    fetch(`${raspApi}scheduled_playlists`, {
                        method: method,
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(adjustedData),
                    }),
                    fetch(`${androidApi}scheduled_playlists`, {
                        method: method,
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(adjustedData),
                    }),
                ]);

                // check response and be done
                if (raspRes.ok && androidRes.ok) {
                    console.log("Playlists saved successfully");
                    router.push("/dashboard/setups");
                } else {
                    console.error("Failed to save playlists");
                    setError("Failed to save playlists");
                }
            } else {
                // update both of them

                const [raspRes, androidRes] = await Promise.all([
                    fetch(
                        `${raspApi}scheduled_playlists/${setupId}`,
                        {
                            method: method,
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(adjustedData),
                        }
                    ),
                    fetch(
                        `${androidApi}scheduled_playlists/${setupId}`,
                        {
                            method: method,
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(adjustedData),
                        }
                    )
                ])

				// check response and be done
                if (raspRes.ok && androidRes.ok) {
                    console.log("Playlists saved successfully");
                    router.push("/dashboard/setups");
                } else {
                    console.error("Failed to save playlists");
                    setError("Failed to save playlists");
                }
            }
        } catch (error) {
            console.error("Error saving playlists:", error);
            setError("An error occurred while saving the playlist");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#272727]">
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 mt-16">
                <div className="px-4 py-6 sm:px-0">
                    <div className="space-y-8">
                        {error && (
                            <Alert variant="destructive">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div>
                            <Label
                                htmlFor="setup-name"
                                className="text-lg font-medium mb-2 block"
                            >
                                Setup Name
                            </Label>
                            <Input
                                id="setup-name"
                                value={playlistName}
                                onChange={(e) =>
                                    setPlaylistName(e.target.value)
                                }
                                className="w-full bg-white text-black"
                                placeholder="Enter setup name"
                            />
                        </div>

                        <div>
                            <Label
                                htmlFor="device-select"
                                className="text-lg font-medium mb-2 block"
                            >
                                Connected Devices
                            </Label>
                            <Select value={selectedDevice}>
                                <SelectTrigger
                                    id="device-select"
                                    className="border-2 shadow-md bg-white text-black w-2/4 placeholder-gray-500"
                                >
                                    <SelectValue placeholder="Explore connected devices" />
                                </SelectTrigger>
                                <SelectContent className="bg-white text-black">
                                    {devices.map((device) => (
                                        <SelectItem
                                            key={device.id}
                                            value={device.id.toString()}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                        >
                                            {device.data}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <PlaylistForm
                            onSave={handleSavePlaylist}
                            initialSchedules={playlist}
                            androidDevicesCount={androidDevicesCount}
                            isEditing={setupId !== "new"}
                            devices={devices.length}
                            inputClassName="bg-white text-black placeholder-gray-500"
                            playlistName={playlistName}
                            setPlaylistName={setPlaylistName}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Configuration;
