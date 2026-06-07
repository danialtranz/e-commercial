"use client";
import React, { useRef, useState, useCallback } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
    file: File | null;
    onChange: (file: File | null) => void;
    currentImageUrl?: string; // URL của ảnh hiện tại (cho edit mode)
    className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    file,
    onChange,
    currentImageUrl,
    className = "",
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Tạo preview từ file
    React.useEffect(() => {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    }, [file]);

    const handleFileSelect = useCallback(
        (selectedFile: File | null) => {
            if (selectedFile && selectedFile.type.startsWith("image/")) {
                // Validate file size (max 5MB)
                if (selectedFile.size > 5 * 1024 * 1024) {
                    alert("Kích thước ảnh không được vượt quá 5MB");
                    return;
                }
                onChange(selectedFile);
            }
        },
        [onChange]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const droppedFile = e.dataTransfer.files?.[0] || null;
            handleFileSelect(droppedFile);
        },
        [handleFileSelect]
    );

    const handleFileInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFile = e.target.files?.[0] || null;
            handleFileSelect(selectedFile);
        },
        [handleFileSelect]
    );

    const handleRemove = useCallback(() => {
        onChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, [onChange]);

    const displayImage = preview || currentImageUrl;

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="text-xs font-medium text-slate-700">
                Ảnh đại diện khóa học (avatar){" "}
                <span className="text-slate-400">– tùy chọn</span>
            </label>

            {displayImage ? (
                // Hiển thị preview với khả năng click để thay đổi
                <div className="relative group">
                    <div
                        className="relative w-full h-48 rounded-lg border-2 border-slate-200 overflow-hidden bg-slate-50 cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <img
                            src={displayImage}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity bg-sky-500 hover:bg-sky-600 text-white rounded-full p-2 shadow-lg"
                                title="Thay đổi ảnh"
                            >
                                <Upload className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove();
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg"
                                title="Xóa ảnh"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileInputChange}
                        className="hidden"
                    />
                    {file && (
                        <div className="mt-1 text-[10px] text-slate-500">
                            <i className="fas fa-file-image mr-1" />
                            {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </div>
                    )}
                    <div className="mt-1 text-[10px] text-slate-400 italic">
                        <i className="fas fa-info-circle mr-1" />
                        Click vào ảnh để thay đổi
                    </div>
                </div>
            ) : (
                // Upload area
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative cursor-pointer rounded-lg border-2 border-dashed transition-all ${
                        isDragging
                            ? "border-sky-500 bg-sky-50"
                            : "border-slate-300 bg-slate-50 hover:border-sky-400 hover:bg-sky-50/50"
                    }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileInputChange}
                        className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                        <div
                            className={`mb-3 rounded-full p-3 ${
                                isDragging
                                    ? "bg-sky-100 text-sky-600"
                                    : "bg-slate-100 text-slate-400"
                            }`}
                        >
                            {isDragging ? (
                                <Upload className="w-6 h-6" />
                            ) : (
                                <ImageIcon className="w-6 h-6" />
                            )}
                        </div>
                        <p className="text-xs font-medium text-slate-700 mb-1">
                            {isDragging
                                ? "Thả ảnh vào đây"
                                : "Nhấp hoặc kéo thả ảnh vào đây"}
                        </p>
                        <p className="text-[10px] text-slate-500">
                            PNG, JPG, GIF tối đa 5MB
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
