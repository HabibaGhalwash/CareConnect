/*
 * FileUpload.jsx
 *
 * Drag-and-drop / click-to-upload area.
 * Matches the "Professional Certification or ID" section in the design.
 *
 * Props:
 *   label      – field label text
 *   accept     – accepted file types string (e.g. ".pdf,.jpg,.png")
 *   maxSizeMB  – max file size in MB shown in hint
 *   onFile     – callback(File)
 */

import React, { useRef, useState } from 'react';
import './FileUpload.css';

const FileUpload = ({
  label    = 'PROFESSIONAL CERTIFICATION OR ID',
  accept   = '.pdf,.jpg,.png',
  maxSizeMB = 5,
  onFile   = () => {},
}) => {
  const inputRef               = useRef(null);
  const [dragging, setDragging]= useState(false);
  const [fileName, setFileName]= useState(null);
  const [error,    setError]   = useState(null);

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File exceeds ${maxSizeMB}MB limit.`);
      return;
    }
    setError(null);
    setFileName(file.name);
    onFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  return (
    <div className="fu">
      <label className="fu__label">{label}</label>

      <div
        className={`fu__zone ${dragging ? 'fu__zone--drag' : ''} ${fileName ? 'fu__zone--done' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        aria-label="Upload file"
      >
        {/* Cloud upload icon */}
        <div className="fu__icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 16 12 12 8 16"/>
            <line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
          </svg>
        </div>

        {fileName ? (
          <p className="fu__filename">{fileName}</p>
        ) : (
          <>
            <p className="fu__cta">Click to upload or drag and drop</p>
            <p className="fu__hint">PDF, JPG, or PNG (Max. {maxSizeMB}MB)</p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="fu__input"
          onChange={(e) => handleFile(e.target.files?.[0])}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {error && <p className="fu__error">{error}</p>}
    </div>
  );
};

export default FileUpload;