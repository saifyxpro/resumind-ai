"use client";

import { useDropzone } from "react-dropzone";
import { useCallback, useState } from "react";

interface FileUploaderProps {
    onFileSelect: (file: File | null) => void;
}

export default function FileUploader({ onFileSelect }: FileUploaderProps) {
    const [file, setFile] = useState<File | null>(null);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                const selectedFile = acceptedFiles[0];
                setFile(selectedFile);
                onFileSelect(selectedFile);
            }
        },
        [onFileSelect]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "application/pdf": [".pdf"] },
        multiple: false,
    });

    if (file) {
        return (
            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md group">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center border border-red-100 group-hover:scale-105 transition-transform duration-200">
                        <img src="/images/pdf.png" alt="pdf" className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="font-semibold text-primary truncate max-w-[300px]">{file.name}</p>
                        <p className="text-xs text-secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        onFileSelect(null);
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove file"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <div
            {...getRootProps()}
            className={`relative cursor-pointer transition-all duration-200 group outline-none h-full ${isDragActive
                ? "transform scale-[1.01]"
                : ""
                }`}
        >
            <input {...getInputProps()} />
            <div
                className={`flex flex-col items-center justify-center h-52 rounded-2xl border-2 border-dashed transition-colors duration-200 ${isDragActive
                    ? "border-accent bg-accent/5"
                    : "border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300"
                    }`}
            >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform duration-300 ${isDragActive ? "bg-accent/10 scale-110" : "bg-white shadow-sm group-hover:scale-105"
                    }`}>
                    {isDragActive ? (
                        <svg className="w-8 h-8 text-accent animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    ) : (
                        <img src="/images/pdf.png" alt="upload" className="w-8 h-8 opacity-50 grayscale group-hover:grayscale-0 transition-all duration-300" />
                    )}
                </div>

                <p className="font-medium text-primary text-center">
                    {isDragActive ? "Drop your resume here" : "Click to Upload or Drag & Drop"}
                </p>
                <p className="text-sm text-tertiary mt-2">PDF only, up to 10MB</p>
            </div>
        </div>
    );
}
