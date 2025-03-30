import React, { useState } from 'react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

interface FileUploadProps {
    onFileUpload: (url: string) => void;
    fileType: 'image' | 'video';
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, fileType }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const uploadFile = async () => {
        if (!file) return;

        setUploading(true);
        try {
            // Generate presigned URL
            const presignedResponse = await fetch(`${apiUrl}generate_presigned_url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
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

            // Upload file to S3
            const uploadResponse = await fetch(url, {
                method: 'PUT',
                body: file,
                // headers: {
                //     'Content-Type': file.type
                // }
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload file');
            }

            // Extract the file URL from the presigned URL
            const fileUrl = url.split('?')[0];
            onFileUpload(fileUrl, file);
        } catch (error) {
            console.error('Error uploading file:', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex items-center space-x-2 text-black">
            <Input className="text-black" type="file" onChange={handleFileChange} accept={fileType === 'image' ? 'image/*' : 'video/*'} />
            <Button onClick={uploadFile} disabled={!file || uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
            </Button>
        </div>
    );
};

export default FileUpload;
