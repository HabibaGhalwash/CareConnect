/*
 * GroupChat.jsx
 *
 * Props:
 *   onSendMessage(partial) – merge into a new message: { type, text?, audioUrl?, duration?, fileUrl?, fileName?, mimeType? }
 */

import axios from 'axios';
import { API_BASE } from '../../services/api';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import './GroupChat.css';

function formatDuration(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function pickAudioMimeType() {
    const types = ['audio/mp4', 'audio/mpeg', 'audio/webm;codecs=opus', 'audio/webm'];
    return types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
}

const GroupChat = ({
    groupName = 'We Are One',
    messages = [],
    currentUserId = 'amira',
    onSendMessage = () => { },
}) => {
    const [text, setText] = useState('');
    const [recording, setRecording] = useState(false);
    const [playingAudioId, setPlayingAudioId] = useState(null);

    const messagesContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const recordStartedAtRef = useRef(0);
    const audioPlayerRef = useRef(null);
    const activeMimeTypeRef = useRef('');

    useLayoutEffect(() => {
        const el = messagesContainerRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSendMessage({ type: 'text', text: text.trim() });
        setText('');
    };

    const openFilePicker = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const { files } = e.target;
        if (!files?.length) return;
        Array.from(files).forEach((file) => {
            const fileUrl = URL.createObjectURL(file);
            const mimeType = file.type || 'application/octet-stream';
            if (mimeType.startsWith('image/')) {
                onSendMessage({
                    type: 'image',
                    fileUrl,
                    fileName: file.name,
                    mimeType,
                });
            } else {
                onSendMessage({
                    type: 'file',
                    fileUrl,
                    fileName: file.name,
                    mimeType,
                });
            }
        });
        e.target.value = '';
    };

    const stopStream = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
    }, []);


    const finishRecording = useCallback(async () => {
        const chunks = chunksRef.current;
        const startedAt = recordStartedAtRef.current;
        const mimeType = activeMimeTypeRef.current || 'audio/webm';

        stopStream();
        mediaRecorderRef.current = null;
        setRecording(false);

        const secs = (Date.now() - startedAt) / 1000;

        if (secs < 0.35 || !chunks.length) return;

        const blob = new Blob(chunks, { type: mimeType });

        // Detect extension from mimeType
        const extension = mimeType.includes('mp4') ? '.m4a' : '.webm';

        // ✅ UPLOAD TO SERVER
        const formData = new FormData();
        formData.append('audio', blob, `voice_${Date.now()}${extension}`);

        const uploadUrl = `${API_BASE}/upload-audio`;

        const res = await axios.post(
            uploadUrl,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        const audioUrl = res.data.url;

        onSendMessage({
            type: 'audio',
            audioUrl,
            duration: formatDuration(secs),
        });

    }, [onSendMessage, stopStream]);


    const startRecording = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            console.error('Recording is not supported in this browser.');
            return;
        }
        if (recording) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            chunksRef.current = [];

            const mimeType = pickAudioMimeType();
            activeMimeTypeRef.current = mimeType;
            const mr = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);

            mr.ondataavailable = (ev) => {
                if (ev.data.size > 0) chunksRef.current.push(ev.data);
            };
            mr.onstop = finishRecording;

            mediaRecorderRef.current = mr;
            recordStartedAtRef.current = Date.now();
            mr.start(250);
            setRecording(true);
        } catch {
            console.error('Microphone permission is required to send a voice note.');
        }
    };

    const handleMicClick = () => {
        if (recording) {
            const mr = mediaRecorderRef.current;
            if (mr && mr.state === 'recording') {
                mr.requestData();
            }
            mr?.stop();
        } else {
            startRecording();
        }
    };

    const togglePlayAudio = (msg) => {
        const el = audioPlayerRef.current;
        if (!msg.audioUrl || !el) return;

        if (playingAudioId === msg.id) {
            el.pause();
            setPlayingAudioId(null);
            return;
        }
        el.pause();
        el.src = msg.audioUrl;
        el.onended = () => setPlayingAudioId(null);
        el.play().then(() => setPlayingAudioId(msg.id)).catch(() => setPlayingAudioId(null));
    };

    const renderMessageBody = (msg, isMe) => {
        if (msg.type === 'image' && msg.fileUrl) {
            return (
                <div className={`gc__bubble gc__bubble--media ${isMe ? 'gc__bubble--me' : 'gc__bubble--them'}`}>
                    <img src={msg.fileUrl} alt={msg.fileName || 'Image'} className="gc__attach-img" />
                </div>
            );
        }

        if (msg.type === 'file' && msg.fileUrl) {
            return (
                <a
                    href={msg.fileUrl}
                    download={msg.fileName || 'download'}
                    className={`gc__bubble gc__bubble--file ${isMe ? 'gc__bubble--me' : 'gc__bubble--them'}`}
                >
                    <span className="gc__file-icon" aria-hidden>📎</span>
                    <span className="gc__file-name">{msg.fileName || 'File'}</span>
                </a>
            );
        }

        if (msg.type === 'audio') {
            const hasUrl = Boolean(msg.audioUrl);
            return (
                <div className={`gc__bubble gc__bubble--audio ${isMe ? 'gc__bubble--me' : 'gc__bubble--them'}`}>
                    {hasUrl ? (
                        <>
                            <button
                                type="button"
                                className="gc__play-btn"
                                aria-label={playingAudioId === msg.id ? 'Pause' : 'Play voice note'}
                                onClick={() => togglePlayAudio(msg)}
                            >
                                {playingAudioId === msg.id ? (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                        <rect x="5" y="4" width="4" height="16" rx="1" />
                                        <rect x="15" y="4" width="4" height="16" rx="1" />
                                    </svg>
                                ) : (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                        <polygon points="5 3 19 12 5 21 5 3" />
                                    </svg>
                                )}
                            </button>
                            <div className="gc__waveform">
                                {Array.from({ length: 16 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="gc__wave-bar"
                                        style={{
                                            height: `${8 + Math.sin(i * 0.8 + (msg.id || 0)) * 7 + ((msg.id || 0) + i * 3) % 5}px`,
                                        }}
                                    />
                                ))}
                            </div>
                            <span className="gc__audio-time">{msg.duration || '00:00'}</span>
                        </>
                    ) : (
                        <>
                            <button type="button" className="gc__play-btn" aria-label="Play audio" disabled>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                            </button>
                            <div className="gc__waveform">
                                {Array.from({ length: 16 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="gc__wave-bar"
                                        style={{
                                            height: `${8 + Math.sin(i * 0.8 + (msg.id || 0)) * 7 + ((msg.id || 0) + i * 3) % 5}px`,
                                        }}
                                    />
                                ))}
                            </div>
                            <span className="gc__audio-time">{msg.duration || '00:16'}</span>
                        </>
                    )}
                </div>
            );
        }

        if (Array.isArray(msg.text)) {
            return msg.text.map((line, i) => (
                <div key={i} className={`gc__bubble ${isMe ? 'gc__bubble--me' : 'gc__bubble--them'}`}>
                    {line}
                </div>
            ));
        }

        return (
            <div className={`gc__bubble ${isMe ? 'gc__bubble--me' : 'gc__bubble--them'}`}>
                {msg.text}
            </div>
        );
    };

    return (
        <div className="gc">
            <audio ref={audioPlayerRef} className="gc__audio-element" preload="metadata" />

            <div className="gc__header">
                <span className="gc__header-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                        stroke="#2d2d2d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                </span>
                <h2 className="gc__header-title">{groupName}</h2>
            </div>

            <div className="gc__messages" ref={messagesContainerRef}>
                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUserId;
                    return (
                        <div
                            key={msg.id}
                            className={`gc__msg-group ${isMe ? 'gc__msg-group--me' : 'gc__msg-group--them'}`}
                        >
                            {!isMe && (
                                <div className="gc__msg-meta">
                                    <div className="gc__avatar">
                                        {(msg.senderAvatar || msg.avatar) ? (
                                            <img src={msg.senderAvatar || msg.avatar} alt={msg.senderName} className="gc__avatar-img" />
                                        ) : (
                                            <div className="gc__avatar-ph" style={{ background: msg.avatarColor || '#c8b4d8' }}>
                                                {msg.senderName.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <span className="gc__sender-name">{msg.senderName}</span>
                                </div>
                            )}

                            {isMe && (
                                <div className="gc__msg-meta gc__msg-meta--me">
                                    <span className="gc__sender-name">{msg.senderName}</span>
                                    <div className="gc__avatar">
                                        {(msg.senderAvatar || msg.avatar) ? (
                                            <img src={msg.senderAvatar || msg.avatar} alt={msg.senderName} className="gc__avatar-img" />
                                        ) : (
                                            <div className="gc__avatar-ph" style={{ background: msg.avatarColor || '#9CCFC9' }}>
                                                {msg.senderName.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className={`gc__bubbles ${isMe ? 'gc__bubbles--me' : ''}`}>
                                {renderMessageBody(msg, isMe)}
                            </div>
                        </div>
                    );
                })}
            </div>

            <form className="gc__input-bar" onSubmit={handleSubmit}>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="gc__file-input"
                    accept="image/*,.pdf,.doc,.docx,.txt,.zip,.ppt,.pptx,audio/*,video/*"
                    multiple
                    onChange={handleFileChange}
                    aria-hidden
                    tabIndex={-1}
                />

                <button type="button" className="gc__input-icon-btn" aria-label="Attach file or image" onClick={openFilePicker}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                </button>

                <input
                    type="text"
                    className="gc__input"
                    placeholder="Type Message.."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    aria-label="Type a message"
                />

                <span className={`gc__mic-wrap ${recording ? 'gc__mic-wrap--recording' : ''}`}>
                    <button
                        type="button"
                        className="gc__mic-btn"
                        aria-label={recording ? 'Stop recording and send' : 'Record voice note'}
                        onClick={handleMicClick}
                    >
                        <svg className="gc__mic-icon" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                    </button>
                </span>
            </form>
        </div>
    );
};

export default GroupChat;
