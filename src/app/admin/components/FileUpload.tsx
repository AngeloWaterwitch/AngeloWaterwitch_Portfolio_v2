'use client';

import { useState, useRef } from 'react';

interface FileUploadProps {
  folder: string;
  accept?: string;
  onUpload: (url: string) => void;
  label?: string;
}

export function FileUpload({
  folder,
  accept = 'image/*',
  onUpload,
  label = 'Upload File',
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Upload failed');
        return;
      }

      onUpload(data.url);
    } catch (e) {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: '2px dashed ' + (dragOver ? 'hsl(348,100%,55%)' : '#333'),
          borderRadius: '2px',
          padding: '2rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'border-color 0.2s',
          background: dragOver ? 'rgba(220,30,60,0.05)' : 'transparent',
        }}
      >
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.75rem',
          color: uploading ? '#666' : '#888',
          letterSpacing: '0.1em',
        }}>
          {uploading ? 'Uploading...' : `${label} — drag & drop or click`}
        </div>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.65rem',
          color: '#444',
          marginTop: '0.4rem',
        }}>
          Max 10MB — JPG, PNG, WebP, GIF, PDF
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {error && (
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.7rem',
          color: 'hsl(348,100%,55%)',
          marginTop: '0.5rem',
        }}>
          {error}
        </div>
      )}
    </div>
  );
}