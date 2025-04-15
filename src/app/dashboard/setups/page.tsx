"use client";

import React, { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { PlusIcon, MoreHorizontalIcon } from "lucide-react";
import { useRouter } from "next/navigation";

const raspApi = process.env.NEXT_PUBLIC_RP_API;
const androidApi = process.env.NEXT_PUBLIC_TV_API;

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
    playlist_name: string;
    devices?: any[];
}

const Setups = () => {
    const router = useRouter();
    const [playlists, setPlaylists] = useState<PlaylistData[]>([]);
    const [showMenu, setShowMenu] = useState<number | null>(null); // Store the ID of the playlist where the menu is shown
    const [selectedPlaylist, setSelectedPlaylist] =
        useState<PlaylistData | null>(null);

    useEffect(() => {
        fetchSetups();
    }, []);

    const fetchSetups = async () => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                console.error("No auth token found");
                router.push("/login");
                return;
            }

            const response = await fetch(`${raspApi}scheduled_playlists`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const data = await response.json()

                setPlaylists(data);
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

    const handleAddSetup = () => {
        router.push("/dashboard/configuration/new");
    };

    const handlePlaylistClick = (setupId: number) => {
        router.push(`/dashboard/configuration/${setupId}`);
    };

    const handleMenuClick = (playlist: PlaylistData) => {
        // Toggle the menu for the selected playlist
        setShowMenu(showMenu === playlist.id ? null : playlist.id);
        setSelectedPlaylist(playlist);
    };

    const handleCopySetup = async () => {
        if (!selectedPlaylist) return;

        const newPlaylist = {
            ...selectedPlaylist,
            id: Date.now(), // Use a temporary ID; the backend will assign the correct ID
            playlist_name: `${selectedPlaylist.playlist_name} (copy)`,
        };

        await handleSavePlaylist(newPlaylist);
        setShowMenu(null); // Hide the menu after copying
    };

    const handleSavePlaylist = async (updatedPlaylist: PlaylistData) => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                console.error("No auth token found");
                router.push("/login");
                return;
            }

            const adjustedData = {
                data: updatedPlaylist.data,
                devices: updatedPlaylist.devices,
                playlist_name: updatedPlaylist.playlist_name,
                id: updatedPlaylist.id,
            };

            // one proxied and is not
            const [raspRes, androidRes] = await Promise.all([
                fetch("/api/proxy/scheduled_playlists", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(adjustedData),
                }),
                fetch(`${androidApi}scheduled_playlists`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(adjustedData),
                }),
            ]);

            if (raspRes.ok && androidRes.ok) {
                console.log("Playlist copied successfully");
                fetchSetups(); // Refresh the playlist list after copying
            } else {
                console.error("Failed to save playlist");
            }
        } catch (error) {
            console.error("Error saving playlist:", error);
        }
    };

    return (
        <div className="min-h-screen text-white p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-end space-x-4 my-16">
                    <Button
                        variant="default"
                        className="bg-green-500 hover:bg-green-600 text-black font-bold"
                        onClick={handleAddSetup}
                    >
                        <PlusIcon className="mr-2 h-4 w-4" /> Create Setup
                    </Button>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="dark:text-black bg-gray-300">
                                Name
                            </TableHead>
                            <TableHead className="dark:text-black bg-gray-300">
                                Schedules
                            </TableHead>
                            <TableHead className="dark:text-black bg-gray-300">
                                Paired Devices
                            </TableHead>
                            <TableHead className="dark:text-black bg-gray-300">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {playlists.length > 0 ? (
                            playlists
                                .slice() // Create a shallow copy to avoid mutating state directly
                                .sort((a, b) =>
                                    a.playlist_name.localeCompare(
                                        b.playlist_name,
                                        "en",
                                        { sensitivity: "base" }
                                    )
                                )
                                .map((playlistObj) => {
                                    const playlistName = Object.keys(
                                        playlistObj.data
                                    )[0];
                                    const playlistData =
                                        playlistObj.data[playlistName];

                                    console.log(playlistData);
                                    return (
                                        <TableRow
                                            key={playlistObj.id}
                                            className="cursor-pointer text-black"
                                        >
                                            <TableCell
                                                className="dark:text-white"
                                                onClick={() => handlePlaylistClick(playlistObj.id)}
                                            >
                                                {playlistObj.playlist_name}
                                            </TableCell>
                                            <TableCell
                                                className="dark:text-white"
                                                onClick={() => handlePlaylistClick(playlistObj.id)}
                                            >
                                                {"start_time" in playlistData
                                                    ? 1
                                                    : Object.keys(playlistData)
                                                          .length}
                                            </TableCell>
                                            <TableCell
                                                className="dark:text-white"
                                                onClick={() => handlePlaylistClick(playlistObj.id)}
                                            >
                                                {playlistObj.devices &&
                                                playlistObj.devices.length
                                                    ? playlistObj.devices.length
                                                    : "-"}
                                            </TableCell>
                                            <TableCell className="relative">
                                                <MoreHorizontalIcon
                                                    className="h-5 w-5 cursor-pointer"
                                                    onClick={() =>
                                                        handleMenuClick(
                                                            playlistObj
                                                        )
                                                    }
                                                />
                                                {showMenu ===
                                                    playlistObj.id && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md z-50">
                                                        <ul>
                                                            <li
                                                                className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                                                                onClick={
                                                                    handleCopySetup
                                                                }
                                                            >
                                                                Copy Setup
                                                            </li>
                                                        </ul>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">
                                    No Playlists Available
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default Setups;
