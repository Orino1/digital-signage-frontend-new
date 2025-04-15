import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PlusCircle, Trash2, Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getS3ObjectUrl, listS3Objects } from '@/lib/routes';
import { useEffect, useRef, useState, useCallback } from 'react';

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Image from 'next/image';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Modal from "@/components/Modal";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

const raspApi = process.env.NEXT_PUBLIC_RP_API;
const androidApi = process.env.NEXT_PUBLIC_TV_API;

interface Playlist {
    start_time: string;
    end_time: string;
    weekdays: string;
    images: { duration: number; url: string }[];
    videos: { duration: number; url: string }[];
}


interface PlaylistData {
    id: number;
    data: {
        [playlistName: string]: Playlist;
    };
    setup_name: string;
    devices: { data: string; id: number }[];
}

interface PlaylistFormProps {
    onSave: (schedules: PlaylistData) => void;
    initialSchedules: PlaylistData;
    isEditing?: boolean;
    devices?: number;
    inputClassName?: string;
    playlistName: string;
    setPlaylistName: React.Dispatch<React.SetStateAction<string>>;
}


interface MediaItem {
    name: string;
    url: string;
    presignedUrl: string;
    size: number;
}

interface S3Object {
    Key: string;
    Size: number;
}


const MediaItem = ({ media, onClick, type }: { media: MediaItem; onClick: () => void; type: 'image' | 'video' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const itemRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1 }
        );


        if (itemRef.current) {
            observer.observe(itemRef.current);
        }

        return () => {
            if (itemRef.current) {
                observer.unobserve(itemRef.current);
            }
        };
    }, []);



    return (
        <button
            ref={itemRef}
            type="button"
            className="cursor-pointer text-left transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg rounded-lg overflow-hidden"
            onClick={onClick}
        >
            {isVisible && (
                type === 'image' ? (
                    <Image
                        src={media.presignedUrl}
                        alt={media.name}
                        width={100}
                        height={100}
                        className="w-full h-24 object-cover"
                        unoptimized={true}
                    />
                ) : (
                    <video src={media.presignedUrl} className="w-full h-24 object-cover">
                        <track kind="captions" />
                        Your browser does not support the video tag.
                    </video>
                )
            )}
            <div className="p-2 bg-white dark:bg-gray-800">
                <p className="text-sm truncate">{media.name}</p>
                <p className="text-xs text-gray-500">{(media.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
        </button>
    );
};



const PlaylistForm: React.FC<PlaylistFormProps> = ({ onSave, initialSchedules, isEditing = false, devices = 0, inputClassName, playlistName, setPlaylistName }) => {
    const router = useRouter();
    const [schedules, setSchedules] = useState<PlaylistData>(() => {
        return { ...initialSchedules };
    });
    const [playlistOrder, setPlaylistOrder] = useState<string[]>(() => {
        return Object.keys(initialSchedules.data);
    });
    const [error, setError] = useState<string | null>(null);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [mediaList, setMediaList] = useState<MediaItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPlaylist, setCurrentPlaylist] = useState('');
    const [currentMediaType, setCurrentMediaType] = useState<'images' | 'videos'>('images');
    const { authToken } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<'images' | 'videos'>('images');
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const searchParams = useSearchParams();
    const setupType = searchParams.get("type");

    useEffect(() => {
        if (isEditing && initialSchedules.id) {
            // Create a deep copy of the initialSchedules to avoid mutating the original
            const updatedSchedules = { ...initialSchedules, data: { ...initialSchedules.data } };

            // Loop through each playlist and convert start_time and end_time to user's timezone
            Object.keys(updatedSchedules.data).forEach(playlistKey => {
                const playlist = updatedSchedules.data[playlistKey];

                // Convert start_time and end_time using convertToUserTimezone
                playlist.start_time = convertToUserTimezone(playlist.start_time);
                playlist.end_time = convertToUserTimezone(playlist.end_time);
            });

            // Set the updated schedules and playlist order
            setSchedules(updatedSchedules);
            setPlaylistOrder(Object.keys(updatedSchedules.data));
        }
    }, [initialSchedules, isEditing]);

    const addSchedule = () => {
        const newPlaylistName = `Playlist ${playlistOrder.length + 1}`;
        setSchedules(prev => ({
            ...prev,
            data: {
                ...prev.data,
                [newPlaylistName]: {
                    start_time: "00:00",
                    end_time: "23:59",
                    weekdays: "1111111",
                    images: [],
                    videos: []
                }
            }
        }));
        setPlaylistOrder(prev => [...prev, newPlaylistName]);
    };


    const updatePlaylistName = useCallback((oldName: string, newName: string) => {
         if (oldName === newName) return; // Avoid unnecessary state updates

         setSchedules(prev => {
             const playlist = prev.data[oldName];
             if (!playlist) return prev; // If the playlist doesn't exist, skip

             const newData = { ...prev.data, [newName]: playlist };
             delete newData[oldName];

             return {
                 ...prev,
                 data: newData,
             };
         });

         setPlaylistOrder(prev => prev.map(name => (name === oldName ? newName : name)));

         // Keep the focus on the input field after updating the playlist name
         setTimeout(() => {
             inputRefs.current[newName]?.focus();
         }, 0);
     }, []);

    const updateSchedule = (playlistName: string, field: keyof Playlist, value: unknown) => {
        setSchedules(prev => ({
            ...prev,
            data: {
                ...prev.data,
                [playlistName]: {
                    ...prev.data[playlistName],
                    [field]: value,
                },
            },
        }));
    };


    const updateWeekday = (playlistName: string, dayIndex: number) => {
        const currentWeekdays = schedules.data[playlistName].weekdays;
        const updatedWeekdays = currentWeekdays.split('').map((day, index) =>
            index === dayIndex ? (day === '1' ? '0' : '1') : day
        ).join('');
        updateSchedule(playlistName, 'weekdays', updatedWeekdays);
    };


    const addMedia = (playlistName: string, type: 'images' | 'videos', url: string, duration = 20) => {
        const newMedia = { url, duration }; // Use the URL directly
        setSchedules(prev => {
            if (!prev.data[playlistName]) {
                prev.data[playlistName] = {
                    start_time: '00:00',
                    end_time: '23:59',
                    weekdays: '1111111',
                    images: [],
                    videos: []
                };
            }
            return {
                ...prev,
                data: {
                    ...prev.data,
                    [playlistName]: {
                        ...prev.data[playlistName],
                        [type]: [...(prev.data[playlistName][type] || []), newMedia]
                    }
                }
            };
        });
  };

    const updateMedia = (playlistName: string, type: 'images' | 'videos', index: number, field: 'url' | 'duration', value: string | number) => {
        const updatedMedia = schedules.data[playlistName][type].map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        );
        updateSchedule(playlistName, type, updatedMedia);
    };


    const removeMedia = (playlistName: string, type: 'images' | 'videos', index: number) => {
        const updatedMedia = schedules.data[playlistName][type].filter((_, i) => i !== index);
        updateSchedule(playlistName, type, updatedMedia);
    };


    const deletePlaylist = (playlistName: string) => {
        if (!confirm(`Are you sure you want to delete the playlist "${playlistName}"?`)) return;
        setSchedules(prev => {
            const { [playlistName]: _, ...rest } = prev.data;
            return { ...prev, data: rest };
        });
        setPlaylistOrder(prev => prev.filter(name => name !== playlistName));
    };

    const deleteSetup = async () => {
        if (!confirm("Are you sure you want to delete this entire setup?")) return;
        try {
            let correctApi = null
            const setupId = initialSchedules.id

            if (setupType === 'tv') {
                correctApi = `${androidApi}scheduled_playlists/${setupId}`
            } else {
                correctApi = `/api/proxy/scheduled_playlists/${setupId}`
            }
            const response = await fetch(correctApi, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });
            if (response.ok) {
                router.push('/dashboard/setups');
            } else {
                setError("Failed to delete setup");
            }
        } catch (error) {
            console.error("Error deleting setup:", error);
            setError("Error deleting setup");
        }
    };

    const handleSavePlaylist = async () => {
        try {
            const updatedData = { ...schedules.data };

            // Loop through each playlist dynamically
            Object.keys(updatedData).forEach(playlistKey => {
                const playlist = updatedData[playlistKey];

                // Apply convertToUTC function to start_time and end_time
                playlist.start_time = convertToUTC(playlist.start_time);
                playlist.end_time = convertToUTC(playlist.end_time);

                // Ensure the media URLs are passed directly without encoding
                playlist.images.forEach(media => {
                    media.url = decodeURIComponent(media.url); // Decode if needed, but usually not required
                });
                playlist.videos.forEach(media => {
                    media.url = decodeURIComponent(media.url); // Decode if needed
                });
            });

            const adjustedData = {
                data: updatedData,
                devices: devices,
                playlist_name: playlistName,
                id: schedules.id
            };

            console.log(schedules);
            if (schedules.devices && confirm(`Are you sure you want to save this changes? ${schedules.devices.length} devices will be updated.`)) {
                // Save it!
                onSave(adjustedData);
                console.log('Thing was saved to the database.');
            } else if (!schedules.devices) {
                onSave(adjustedData);
            } else {
                // Do nothing!
                console.log('Thing was not saved to the database.');
            }

        } catch (error) {
            console.error("Error saving playlist:", error);
            setError("Failed to save playlist. Please try again.");
        }
    };

    const fetchMediaList = async () => {
        try {
            const data = await listS3Objects(authToken || '');
            console.log('Received data:', data);

            if (data && Array.isArray(data.objects)) {
                const processedMediaList: MediaItem[] = data.objects.map((item: any) => ({
                    name: item.Key,
                    url: getS3ObjectUrl(item.Key),
                    presignedUrl: item.PresignedURL,
                    size: item.Size
                }));
                setMediaList(processedMediaList);
            } else {
                throw new Error('Received data is not in the expected format');
            }
        } catch (error) {
            console.error('Error fetching media list:', error);
            setError(`Failed to load media list: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setMediaList([]);
        }
    };


    const openMediaModal = (playlistName: string, type: 'images' | 'videos') => {
        setCurrentPlaylist(playlistName);
        setCurrentMediaType(type);
        setIsMediaModalOpen(true);
        setActiveTab(type);
        fetchMediaList();
    };

    const handleMediaSelection = (media: MediaItem) => {
        addMedia(currentPlaylist, activeTab, media.presignedUrl, 20); // Use activeTab instead of currentMediaType
        setIsMediaModalOpen(false);
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            // 1. Get the presigned URL for uploading (PUT URL)
            const presignedResponse = await fetch('/api/proxy/generate_presigned_url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    file_name: file.name,
                    file_type: file.type
                })
            });


            if (!presignedResponse.ok) {
                throw new Error('Failed to get presigned URL');
            }

            const { url } = await presignedResponse.json();

            // 2. Upload the file using the PUT presigned URL
            const uploadResponse = await fetch(url, {
                method: 'PUT',
                body: file,
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload file');
            }

            // 3. After successful upload, refresh the media list to get updated URLs
            await fetchMediaList();  // This function will reload the media list from Yandex Cloud

        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file. Please try again.');
        }
    };


    function getFileNameFromUrl(url) {
        // Decode the URL to handle special characters
        const decodedUrl = decodeURIComponent(url);

        // Extract the path part before any query parameters
        const path = decodedUrl.split('?')[0];

        // Get the last part of the path (file name)
        const fileName = path.substring(path.lastIndexOf('/') + 1);

        return fileName;
    }

    const renderMediaSection = (playlistName: string, type: 'images' | 'videos') => {

        return (
            <div className="space-y-4">
                <h3 className="text-lg font-medium capitalize">{type}</h3>

                <Button onClick={() => openMediaModal(playlistName, type)}>
                    Select Media
                </Button>

                <div className="grid grid-cols-4 gap-4 text-black">
                    {schedules.data[playlistName][type].map((media, index) => (
                        <div key={`${media.url}-${index}`} className="relative">

                            {type === 'images' ? (
                                <Image
                                    src={media.url}
                                    alt={`Uploaded ${type}`}
                                    width={100}
                                    height={100}
                                    className="w-full h-24 object-cover"
                                    unoptimized={true}
                                />
                            ) : (
                                <video src={media.url} className="w-full h-24 object-cover">
                                    <track kind="captions" />
                                    Your browser does not support the video tag.
                                </video>
                            )}

                            <Input
                                type="number"
                                placeholder="Duration (s)"
                                value={media.duration}
                                onChange={(e) => updateMedia(playlistName, type, index, 'duration', Number(e.target.value))}
                                className="mt-2 w-full text-black"
                            />
                            <Button onClick={() => removeMedia(playlistName, type, index)} variant="destructive" size="icon" className="absolute top-0 right-0">
                                <Trash2 size={16} />
                            </Button>
                            <p className="text-lg text-black dark:text-white p-0.5 rounded-md">{getFileNameFromUrl(media.url)}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };


    const convertToUserTimezone = (timeString) => {

        if (timeString) {
            // Get the current date
            const today = new Date();
            const year = today.getUTCFullYear();
            const month = String(today.getUTCMonth() + 1).padStart(2, '0'); // getUTCMonth() is zero-based
            const day = String(today.getUTCDate()).padStart(2, '0');

            // Combine the date with the provided time string
            const utcDateString = `${year}-${month}-${day}T${timeString}:00Z`; // Add ":00" for seconds and "Z" for UTC

            const utcDate = new Date(utcDateString);

            // Convert to user's local timezone and extract just the hour and minute
            const options = {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false // Use 24-hour format
            };

            const localTime = utcDate.toLocaleString(undefined, options);
            console.log(localTime);

            // Return only the time in HH:mm format
            return localTime;
        } else {
            return "N/A";
        }
    };

    const convertToUTC = (timeString) => {

        if (timeString) {
            // Get the current date
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-based
            const day = String(today.getDate()).padStart(2, '0');

            // Combine the date with the provided local time string
            const localDateString = `${year}-${month}-${day}T${timeString}:00`; // Add ":00" for seconds

            // Create a Date object with local timezone
            const localDate = new Date(localDateString);

            // Convert the local time to UTC
            const utcHours = String(localDate.getUTCHours()).padStart(2, '0');
            const utcMinutes = String(localDate.getUTCMinutes()).padStart(2, '0');

            // Return the time in HH:mm UTC format
            const utcTimeString = `${utcHours}:${utcMinutes}`;
            console.log(utcTimeString);

            return utcTimeString;
        } else {
            return "N/A";
        }
    };


    return (
        <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-bold">Playlists</h2>

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {playlistOrder.map((playlistName, index) => {
                const playlist = schedules.data[playlistName];
                return (
                    <div key={index} className="border-b mb-4 pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <Input
                                ref={(el) => (inputRefs.current[playlistName] = el)} // Store ref for each input
                                value={playlistName}
                                onChange={(e) => updatePlaylistName(playlistName, e.target.value)}
                                className={`text-m ${inputClassName}`}
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deletePlaylist(playlistName)}
                                className="hover:bg-red-100 p-2"
                            >
                                <Trash2 size={16} className="text-red-500" />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex space-x-4">
                                <div className="w-1/2 ">
                                    <Label className="inline-flex mt-4 mb-2">Start Time</Label>
                                    <Input
                                        type="time"
                                        value={playlist.start_time}
                                        onChange={(e) => updateSchedule(playlistName, 'start_time', e.target.value)}
                                        className="mt-1 bg-white text-black"
                                    />
                                </div>
                                <div className="w-1/2">
                                    <Label className="inline-flex mt-4 mb-2">End Time</Label>
                                    <Input
                                        type="time"
                                        value={playlist.end_time}
                                        onChange={(e) => updateSchedule(playlistName, 'end_time', e.target.value)}
                                        className="mt-1 bg-white text-black"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label className="mb-2 block">Weekdays</Label>
                                <div className="flex space-x-4 mt-2">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                                        <div key={day} className="flex items-center">
                                            <Checkbox
                                                id={`${day}-${playlistName}`}
                                                checked={playlist.weekdays[index] === '1'}
                                                onCheckedChange={() => updateWeekday(playlistName, index)}
                                            />
                                            <Label htmlFor={`${day}-${playlistName}`} className="ml-1">{day}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {renderMediaSection(playlistName, 'images')}
                            {renderMediaSection(playlistName, 'videos')}
                        </div>
                    </div>
                );
            })}

            <Button onClick={addSchedule} variant="outline" className="mt-4 dark:border-white border-black">
                <PlusCircle size={20} className="mr-2" /> Add Another Playlist
            </Button>

            <div className="flex space-x-12 items-center">
                <Button onClick={handleSavePlaylist} className="min-w-fit py-4 text-lg mt-8 bg-green-600 hover:bg-green-800 text-white">
                    {isEditing ? "Update Setup" : "Save Setup"}
                </Button>
                {isEditing && (
                    <Button onClick={deleteSetup} className="min-w-fit py-4 text-lg mt-8 bg-red-600 hover:bg-red-800 text-white">
                        Delete Setup
                    </Button>
                )}
            </div>

            <Modal isOpen={isMediaModalOpen} onClose={() => setIsMediaModalOpen(false)}>
                <div className="p-4">
                    <h2 className="text-xl font-bold mb-4">Select Media</h2>
                    <div className="flex items-center mb-4">
                        <Input
                            type="text"
                            placeholder="Search media..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-grow mr-2"
                        />
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleUpload}
                            accept="image/*,video/*"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            title="Upload media"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload size={20} />
                        </Button>
                    </div>
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'images' | 'videos')}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="images">Images</TabsTrigger>
                            <TabsTrigger value="videos">Videos</TabsTrigger>
                        </TabsList>
                        <TabsContent value="images">
                            <div className="grid grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto">
                                {mediaList
                                    .filter(media =>
                                        media.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                                        media.name.match(/\.(jpeg|jpg|gif|png)$/i)
                                    )
                                    .map((media) => (
                                        <MediaItem
                                            key={media.name}
                                            media={media}
                                            onClick={() => handleMediaSelection(media)}
                                            type="image"
                                        />
                                    ))}
                            </div>
                        </TabsContent>
                        <TabsContent value="videos">
                            <div className="grid grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto">
                                {mediaList
                                    .filter(media =>
                                        media.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                                        media.name.match(/\.(mp4|webm|ogg)$/i)
                                    )
                                    .map((media) => (
                                        <MediaItem
                                            key={media.name}
                                            media={media}
                                            onClick={() => handleMediaSelection(media)}
                                            type="video"
                                        />
                                    ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </Modal>
        </div>
    );
};



export default PlaylistForm;
