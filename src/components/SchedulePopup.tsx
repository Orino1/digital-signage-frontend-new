import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SchedulePopupProps {
    onClose: () => void;
    onSave: (schedule: { startTime: string; endTime: string; content: string }) => void;
}

const SchedulePopup: React.FC<SchedulePopupProps> = ({ onClose, onSave }) => {
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [content, setContent] = useState('');

    const handleSave = () => {
        onSave({ startTime, endTime, content });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-96">
                <h2 className="text-2xl font-bold mb-4">Add Scheduled Playlist</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Start Time</label>
                        <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">End Time</label>
                        <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Content</label>
                        <Select onValueChange={setContent}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select content" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="image">Image</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                    <Button onClick={onClose} variant="outline">Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </div>
            </div>
        </div>
    );
};

export default SchedulePopup;