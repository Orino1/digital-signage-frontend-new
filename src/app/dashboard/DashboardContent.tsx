"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import DownloadConfigurationPage from "./download-configuration/page";
import Image from "next/image";
import Modal from "@/components/Modal";
import { useRouter } from "next/navigation";

const DashboardContent = () => {
	const router = useRouter();
	const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

	const handleDownload = () => {
		setIsDownloadModalOpen(true);
	};

	const handleRegisterDevice = () => {
		router.push("/dashboard/setup-new-device");
	};

	return (
		<section className="h-screen mx-auto w-full md:w-full lg:max-w-7xl overflow-y-auto overflow-x-hidden px-4">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 place-items-center my-32">
				{/* Step 1 */}
				<div className="flex flex-col items-center space-y-8 w-full max-w-md">
					<span className="text-3xl w-16 h-16 flex items-center justify-center bg-foreground text-on-foreground font-bold rounded-full dark:text-black text-white">
						1
					</span>
					<div className="h-40 flex items-center justify-center">
						<Image
							src="/assets/sdcard.svg"
							alt="sdcard"
							width={100}
							height={100}
						/>
					</div>
					<div className=" h-24 flex items-center">
						<p className="text-balance text-center text-lg">
							{"Download the custom_install.img file and any .img writer tool to write file on your empty SD card."}
						</p>
					</div>
					<Button
						size="lg"
						variant="default"
						className="w-full"
						onClick={handleDownload}
					>
						Download IMG File
					</Button>
				</div>

				{/* Step 2 */}
				<div className="flex flex-col items-center space-y-8 w-full max-w-md">
					<span className="text-3xl w-16 h-16 flex items-center justify-center bg-foreground text-on-foreground font-bold rounded-full dark:text-black text-white">
						2
					</span>
					<div className="h-40 flex items-center justify-center">
						<Image
							src="/assets/raspberrypi.svg"
							alt="raspberrypi"
							width={250}
							height={250}
						/>
					</div>
					<div className=" h-48 flex items-center">
						<div className="flex flex-col space-y-2">
							<p className="text-balance text-center text-lg">
								Put the SD card into your Raspberry Pi and power it up
							</p>
							<p className="text-balance text-center text-lg">
								{"The first start might take a minute or two. When the device is ready, you'll see a welcome screen with an 8 digit PIN number on it. Use this PIN to register your device."}
							</p>
						</div>
					</div>
					<Button
						size="lg"
						variant="default"
						className="w-full"
						onClick={handleRegisterDevice}
					>
						Register New Device
					</Button>
				</div>
			</div>

			<Modal
				isOpen={isDownloadModalOpen}
				onClose={() => setIsDownloadModalOpen(false)}
				title="Download Configuration"
				maxWidth="sm:max-w-[600px]"
			>
				<DownloadConfigurationPage />
			</Modal>
		</section>
	);
};

export default DashboardContent;
