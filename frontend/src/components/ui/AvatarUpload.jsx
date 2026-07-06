/**
 * AvatarUpload - Reusable drag-and-drop avatar upload component.
 * Supports click-to-upload and drag-and-drop with instant preview.
 * Validates file type and size client-side, encodes to base64 data URL.
 */
import { useState, useRef, useCallback } from 'react';
import { Spinner } from './Loading.jsx';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export default function AvatarUpload({ currentAvatar, initials, onAvatarChange, disabled = false }) {
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload a JPG, PNG, or WebP image.';
    }
    if (file.size > MAX_SIZE_BYTES) {
      return 'File too large. Maximum size is 5MB.';
    }
    return null;
  };

  const processFile = useCallback((file) => {
    setError('');
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setPreview(base64);
      onAvatarChange(base64);
    };
    reader.readAsDataURL(file);
  }, [onAvatarChange]);

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const displayImage = preview || currentAvatar;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex h-24 w-24 cursor-pointer items-center justify-center rounded-full border-2 border-dashed transition-all ${
          dragOver
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
            : 'border-slate-300 hover:border-brand-400 dark:border-slate-600 dark:hover:border-brand-500'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        aria-label="Upload avatar"
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt="Avatar preview"
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center rounded-full bg-brand-600 text-2xl font-bold text-white">
            {initials}
          </span>
        )}

        {/* Hover overlay */}
        {!disabled && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}

        {/* Loading overlay */}
        {disabled && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
            <Spinner size="sm" className="text-white" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Click or drag to upload (JPG, PNG, WebP, max 5MB)
      </p>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
