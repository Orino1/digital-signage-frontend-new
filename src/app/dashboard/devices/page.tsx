"use client";

import { DownloadIcon, PlusIcon, ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

interface Device {
	id: number;
	name: string;
	location: string;
	setup_id: number | null;
	display_rotation: string | null;
	used_port: number;
	scheduled_playlist_id: number | null;
	device_connected: boolean;
}

type SortKey = 'name' | 'location' | 'assignedSetup';
type SortDirection = 'asc' | 'desc' | '';

const DevicesPage = () => {
	const router = useRouter();
	const [devices, setDevices] = useState<Device[]>([]);
	const [setups, setSetups] = useState<{ [key: number]: string }>({});
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
	const [newName, setNewName] = useState('');
	const [sortKey, setSortKey] = useState<SortKey | null>('name');
	const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
	const [isMobile, setIsMobile] = useState(false);

	const fetchDevices = useCallback(async () => {
		try {
			const token = localStorage.getItem('authToken');
			if (!token) {
				console.error("No auth token found");
				router.push('/login');
				return;
			}

			const response = await fetch(`${apiUrl}devices`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			if (response.ok) {
				const data = await response.json();
				setDevices(data);
			} else {
				console.error("Failed to fetch devices");
				if (response.status === 401) {
					router.push('/login');
				}
			}
		} catch (error) {
			console.error("Error fetching devices:", error);
		}
	}, [router]);

	useEffect(() => {
		fetchDevices();
		fetchSetups();

		const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        handleResize(); // Check on initial load
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
	}, [fetchDevices]);

	const fetchSetups = async () => {
		try {
			const token = localStorage.getItem('authToken');
			if (!token) {
				console.error("No auth token found");
				return;
			}

			const response = await fetch(`${apiUrl}scheduled_playlists`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			if (response.ok) {
				const data = await response.json();
				const result = {};

				for (const item of data) {
					const playlistName = Object.keys(item.data)[0];
					result[item.id] = item.playlist_name;
				}
				setSetups(result);
			} else {
				console.error("Failed to fetch setups");
			}
		} catch (error) {
			console.error("Error fetching setups:", error);
		}
	};

	const handleDeviceClick = (deviceId: number) => {
		router.push(`/dashboard/snapshot/${deviceId}`);
	};

	const handleDownload = () => {
		router.push('/dashboard');
	};

	const handleRegisterDevice = () => {
		router.push('/dashboard/setup-new-device');
	};

	const handleNameClick = (device: Device) => {
		setSelectedDevice(device);
		setNewName(device.name);
	};

	const handleNameChange = async () => {
		try {
			const token = localStorage.getItem('authToken');
			if (!token) {
				console.error("No auth token found");
				return;
			}

			const response = await fetch(`/api/proxy/devices/${selectedDevice?.id}`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ name: newName }),
			});

			setDevices((prev) =>
				prev.map((device) =>
					device.id === selectedDevice?.id ? { ...device, name: newName } : device
				)
			);
			setSelectedDevice(null);
		} catch (error) {
			console.error("Error updating device name:", error);
		}
	};

	const handleSort = (key: SortKey) => {
		const isSameKey = sortKey === key;
		const newDirection: SortDirection = isSameKey && sortDirection === 'asc' ? 'desc' : 'asc';
		setSortDirection(newDirection);
		setSortKey(key);
	};

	const sortedDevices = [...devices].sort((a, b) => {
		if (!sortKey || sortDirection === '') return 0; // No sorting if direction is not set

		let aValue: string | number = '';
		let bValue: string | number = '';

		switch (sortKey) {
			case 'name':
				aValue = a.name.toLowerCase();
				bValue = b.name.toLowerCase();
				break;
			case 'location':
				aValue = a.location.toLowerCase();
				bValue = b.location.toLowerCase();
				break;
			case 'assignedSetup':
				aValue = setups[a.scheduled_playlist_id || 0] || '';
				bValue = setups[b.scheduled_playlist_id || 0] || '';
				break;
		}

		if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
		if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
		return 0;
	});

	const filteredDevices = sortedDevices.filter((device) => {
		const locationMatch = device.location?.toLowerCase().includes(searchTerm.toLowerCase());
		const nameMatch = device.name?.toLowerCase().includes(searchTerm.toLowerCase());
		const setupName = device.scheduled_playlist_id ? setups[device.scheduled_playlist_id] : '';
		const setupMatch = setupName?.toLowerCase().includes(searchTerm.toLowerCase());

		return locationMatch || nameMatch || setupMatch;
	});

	const connectedDevices = filteredDevices.filter(device => device.device_connected).length;
	const notConnectedDevices = filteredDevices.length - connectedDevices;


    const mobileContainerStyle = {
		display: 'flex',
        flexDirection: 'column',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: '20px',
    };

	const mobileBtnStyle = {
		width: '100%',
	}

	const mobileTextStyle = {
		textAlign: 'center'
	}


	return (
		<div className="min-h-screen text-white p-6">
			<div className="max-w-6xl mx-auto" >
				<div className="flex justify-between items-center my-16" style={isMobile ? mobileContainerStyle : null}>
					<input
						type="text"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder="Search devices..."
						className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 text-black w-52"
					/>
					<p className="text-lg text-black dark:text-white p-0.5 rounded-md" style={isMobile ? mobileTextStyle : null}>
						Online Devices: {connectedDevices} | Offline Devices: {notConnectedDevices} | Total: {connectedDevices + notConnectedDevices}
					</p>
					<div className="flex space-x-4" >
						<Button
							variant="default"
							className="bg-cyan-400 hover:bg-cyan-600 text-black font-bold"
							onClick={handleDownload}
							style={isMobile ? mobileBtnStyle : null}
						>
							<DownloadIcon className="mr-2 h-4 w-4" /> Download Software
						</Button>
						<Button
							variant="default"
							className="bg-green-500 hover:bg-green-600 text-black font-bold"
							onClick={handleRegisterDevice}
							style={isMobile ? mobileBtnStyle : null}
						>
							Register New Device
						</Button>
					</div>
				</div>

				<Table>
					<TableHeader>
						<TableRow>
							<TableHead
								className="dark:text-black bg-gray-300 cursor-pointer"
								onClick={() => handleSort('name')}
							>
								<span className="flex justify-between items-center">
									Name
									{sortKey === 'name' && (
										sortDirection === 'asc' ? <ChevronUpIcon className="ml-2" /> : <ChevronDownIcon className="ml-2" />
									)}
								</span>
							</TableHead>
							<TableHead
								className="dark:text-black bg-gray-300 cursor-pointer"
								onClick={() => handleSort('location')}
							>
								<span className="flex justify-between items-center">
									Location
									{sortKey === 'location' && (
										sortDirection === 'asc' ? <ChevronUpIcon className="ml-2" /> : <ChevronDownIcon className="ml-2" />
									)}
								</span>
							</TableHead>
							<TableHead
								className="bg-gray-300 dark:text-black cursor-pointer"
								onClick={() => handleSort('assignedSetup')}
							>
								<span className="flex justify-between items-center">
									Assigned Setup
									{sortKey === 'assignedSetup' && (
										sortDirection === 'asc' ? <ChevronUpIcon className="ml-2" /> : <ChevronDownIcon className="ml-2" />
									)}
								</span>
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredDevices.map((device) => (
							<TableRow
								key={device.id}
								className="cursor-pointer text-black hover:bg-gray-200"
							>
								<TableCell
									className={device.device_connected ? "dark:text-white hover:bg-gray-400" : "text-red-500 hover:bg-gray-400"}
									onClick={() => handleNameClick(device)}
								>
									{device.name}
								</TableCell>
								<TableCell
									className={device.device_connected ? "dark:text-white" : "text-red-500"}
									onClick={() => handleDeviceClick(device.id)}
								>
									{device.location}
								</TableCell>
								<TableCell
									className={device.device_connected ? "dark:text-white" : "text-red-500"}
									onClick={() => handleDeviceClick(device.id)}
								>
									{device.scheduled_playlist_id ? setups[device.scheduled_playlist_id] || 'Loading...' : 'Not assigned'}
								</TableCell>
							</TableRow>
							))}
					</TableBody>
				</Table>
			</div>

			{/* Modal for renaming the device */}
			{selectedDevice && (
				<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
					<div className="bg-white p-6 rounded-lg shadow-lg">
						<h3 className="text-black text-lg font-bold mb-4">Rename Device</h3>
						<input
							type="text"
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 text-black dark:text-white w-52"
						/>
						<div className="mt-4 flex space-x-4">
							<Button
								variant="default"
								className="bg-green-500 hover:bg-green-600 text-white"
								onClick={handleNameChange}
							>
								Save
							</Button>
							<Button
								variant="default"
								className="bg-red-500 hover:bg-red-600 text-white"
								onClick={() => setSelectedDevice(null)}
							>
								Cancel
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default DevicesPage;
