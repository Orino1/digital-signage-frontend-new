"use client";

import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from 'next/navigation';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const DownloadConfigurationPage = () => {
    const [connectionType, setConnectionType] = useState('wifi');
    const [wifiName, setWifiName] = useState('');
    const [wifiPassword, setWifiPassword] = useState('');
    const [downloadProgress, setDownloadProgress] = useState(0); // New state for progress

    const router = useRouter();

    const handleDownload = async () => {
        try {
            const response = await fetch(`${apiUrl}modify-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ssid: wifiName || "nowifi123",
                    psk: wifiPassword || "nowifi123",
                }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            if (response.body) {
                const contentLength = response.headers.get('Content-Length');
                const totalSize = contentLength ? parseInt(contentLength, 10) : undefined;
                const reader = response.body.getReader();
                const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
                const filename = 'custom_install.img'; // Adjust if needed

                let loaded = 0;
                const stream = new ReadableStream({
                    start(controller) {
                        function push() {
                            reader.read().then(({ done, value }) => {
                                if (done) {
                                    controller.close();
                                    return;
                                }
                                loaded += value.length;
                                if (totalSize) {
                                    const progress = Math.round((loaded / totalSize) * 100);
                                    setDownloadProgress(progress); // Update progress
                                }
                                controller.enqueue(value);
                                push();
                            }).catch(error => {
                                console.error('Stream reading error:', error);
                                controller.error(error);
                            });
                        }
                        push();
                    }
                });

                const blob = await new Response(stream).blob();
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();

                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                router.push("/dashboard/devices");
            }
            else {
                console.log("No response body")
            }
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h2 className="text-balance text-xl font-semibold text-black">Connection Type</h2>
                <Select value={connectionType} onValueChange={(value) => setConnectionType(value)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select connection type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ethernet">Connect with Ethernet cable (recommended, if possible)</SelectItem>
                        <SelectItem value="wifi">Connect to WiFi using built-in WiFi support</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {connectionType === 'wifi' && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-black">Device WiFi settings</h2>
                    <Input
                        className='text-black'
                        placeholder="WiFi network name"
                        value={wifiName}
                        onChange={(e) => setWifiName(e.target.value)}
                    />
                    <Input
                        className='text-black'
                        type="password"
                        placeholder="WPA2 password (leave empty for open networks)"
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                    />
                </div>
            )}

            <Button onClick={handleDownload} className="w-full">
                Download custom custom_install.img
            </Button>

            {downloadProgress > 0 && downloadProgress < 100 && (
                <div className="mt-4 w-full">
                    <p className="text-l text-black">Download progress: {downloadProgress}%</p>
                </div>
            )}
        </div>
    );
};

export default DownloadConfigurationPage;
