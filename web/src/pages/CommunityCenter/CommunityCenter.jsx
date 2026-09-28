import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_BASE } from '../../services/api';

import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import CommunitySidebar from '../../components/CommunitySidebar/CommunitySidebar';
import GroupChat from '../../components/GroupChat/GroupChat';
import MembersList from '../../components/MembersList/MembersList';
import './CommunityCenter.css';

// ✅ SOCKET CONNECTION
const socket = io(API_BASE);

const CommunityCenter = () => {
    const [messages, setMessages] = useState([]);
    const [currentUser, setCurrentUser] = useState({ id: null, name: 'User', avatar: '' });
    const [members, setMembers] = useState([]);

    // ✅ LOAD MESSAGES FROM DB
    useEffect(() => {
        // Load parent data from localStorage
        const storedParent = JSON.parse(localStorage.getItem("parent")) || {};
        console.log('Stored parent data:', storedParent);

        const user = {
            id: storedParent?.P_ID,
            name: storedParent?.Full_Name || 'User',
            avatar: ''
        };
        setCurrentUser(user);
        console.log('Current user:', user);

        fetchMessages();
        fetchMembers();

        socket.on("receiveMessage", (msg) => {
            console.log('Received message:', msg);
            setMessages(prev => {
                // Avoid duplicates
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        });

        return () => socket.off("receiveMessage");
    }, []);

    const fetchMessages = async () => {
        try {
            const res = await axios.get(`${API_BASE}/modules/community/community`);

            // Fetch all parents to map P_ID to Full_Name
            const parentRes = await axios.get(`${API_BASE}/modules/parent/parent`);
            const parentMap = {};
            parentRes.data.forEach(parent => {
                parentMap[parent.P_ID] = parent.Full_Name;
            });

            // Filter out admin warnings — they show on the parent profile, not the chat
            const chatMessages = res.data.filter(m => !String(m.Content).startsWith('ADMIN_WARNING:'));

            // Sort messages by C_ID ascending (oldest first)
            const sortedMessages = chatMessages.sort((a, b) => a.C_ID - b.C_ID);

            const formatted = sortedMessages.map(m => ({
                id: m.C_ID,
                senderId: m.P_ID,
                senderName: parentMap[m.P_ID] || 'Unknown Parent',
                type: m.Content.startsWith("AUDIO:") ? 'audio' : 'text',
                text: m.Content,
                audioUrl: m.Content.startsWith("AUDIO:") ? m.Content.replace("AUDIO:", "") : null
            }));

            setMessages(formatted);
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    };

    const fetchMembers = async () => {
        try {
            const res = await axios.get(`${API_BASE}/modules/parent/parent`);
            const formattedMembers = res.data.map(parent => ({
                id: parent.P_ID,
                name: parent.Full_Name,
                email: parent.Email,
                location: parent.Location,
                initial: parent.Full_Name.charAt(0).toUpperCase()
            }));
            setMembers(formattedMembers);
        } catch (err) {
            console.error('Error fetching members:', err);
        }
    };

    // ✅ SEND MESSAGE
    const handleSendMessage = async (msg) => {
        if (!currentUser.id) {
            console.error('User not logged in. currentUser:', currentUser);
            alert('Please log in to send messages. Current user ID is missing.');
            return;
        }

        try {
            let content = msg.type === 'audio'
                ? `AUDIO:${msg.audioUrl}`
                : msg.text;

            console.log('Sending message with P_ID:', currentUser.id);

            // SAVE TO DB - Don't send C_ID, let database auto-generate it
            const response = await axios.post(`${API_BASE}/modules/community/community`, {
                Content: content,
                P_ID: currentUser.id
            });

            console.log('Message response:', response.data);

            // Extract message ID from response
            let messageId = response.data.C_ID || response.data.insertId || Date.now();

            console.log('Extracted message ID:', messageId);

            // Update local state with the saved message
            const savedMsg = {
                id: messageId,
                senderId: currentUser.id,
                senderName: currentUser.name,
                ...msg
            };

            setMessages(prev => [...prev, savedMsg]);

            // REAL-TIME SEND via socket
            socket.emit("sendMessage", savedMsg);
            console.log('Message sent successfully');
        } catch (err) {
            console.error('Error sending message:', err);
            console.error('Response data:', err.response?.data);
            const errorMsg = err.response?.data?.Message || 'Failed to send message. Please try again.';
            alert(errorMsg);
        }
    };

    return (
        <div className="cc-page">
            <Navbar />

            <div className="cc-body">
                <CommunitySidebar currentUser={currentUser} />

                <GroupChat
                    messages={messages}
                    currentUserId={currentUser.id}
                    onSendMessage={handleSendMessage}
                />

                <MembersList members={members} />
            </div>

            <Footer />
        </div>
    );
};

export default CommunityCenter;