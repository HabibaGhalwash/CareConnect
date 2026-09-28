import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiService, API_BASE } from '../services/api';
import * as Speech from 'expo-speech';
import { io } from 'socket.io-client';
import { Audio } from 'expo-av';
import axios from 'axios';

// COMMUNITY CENTER SCREEN
export const CommunityCenterScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [parentNames, setParentNames] = useState({});
  const [socket, setSocket] = useState(null);
  
  // Audio state
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);

  useEffect(() => {
    loadUserAndData();
    setupAudio();
    
    // Initialize socket
    const newSocket = io(API_BASE);
    setSocket(newSocket);

    newSocket.on('receiveMessage', (msg) => {
      console.log('📱 Socket received:', msg);
      setMessages(prev => {
        // Prevent duplicates from socket if already added by post response
        if (prev.some(m => m.C_ID === msg.id || m.C_ID === msg.C_ID)) return prev;
        
        // Map socket message format to DB format
        const formatted = {
          C_ID: msg.id || msg.C_ID,
          P_ID: msg.senderId || msg.P_ID,
          Content: msg.text || msg.Content,
          timestamp: new Date().toISOString(),
        };
        return [...prev, formatted];
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const setupAudio = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Microphone access is required for voice messages.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (err) {
      console.warn('Audio setup failed:', err);
    }
  };

  const loadUserAndData = async () => {
    try {
      const parentData = await AsyncStorage.getItem('parent');
      if (parentData) {
        setCurrentUser(JSON.parse(parentData));
      }
      
      // Fetch parents to map names
      const parentRes = await apiService.getAllParents();
      const map = {};
      if (Array.isArray(parentRes.data)) {
        parentRes.data.forEach(p => {
          map[p.P_ID] = p.Full_Name;
        });
      }
      setParentNames(map);
      
      await fetchMessages();
    } catch (err) {
      console.error('Error loading community data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await apiService.getCommunityPosts();
      if (Array.isArray(res.data)) {
        // Filter and sort oldest first for chat flow
        const chatMessages = res.data
          .filter(m => !String(m.Content).startsWith('ADMIN_WARNING:'))
          .sort((a, b) => a.C_ID - b.C_ID);
        setMessages(chatMessages);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const startRecording = async () => {
    try {
      console.log('🎙️ Starting recording...');
      // Request permissions again just in case
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;

      // Ensure audio mode allows recording on iOS
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Recording Error', 'Could not start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    console.log('🛑 Stopping recording...');
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (uri) {
        handleSendAudio(uri);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleSendAudio = async (uri) => {
    if (!uri) {
      Alert.alert('Error', 'No recording found to send.');
      return;
    }
    if (!currentUser) {
      Alert.alert('Session Error', 'You must be logged in to send messages.');
      return;
    }

    try {
      console.log('📤 Uploading audio:', uri);
      
      // Force .m4a extension for maximum mobile compatibility
      const timestamp = Date.now();
      const safeFilename = `voice_note_${timestamp}.m4a`;

      const formData = new FormData();
      formData.append('audio', {
        uri,
        name: safeFilename,
        type: 'audio/m4a',
      });

      console.log('🚀 Posting to server as:', safeFilename);
      const uploadRes = await axios.post(`${API_BASE}/upload-audio`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
      });

      if (!uploadRes.data || !uploadRes.data.url) {
        throw new Error('Server did not return an audio URL');
      }

      const audioUrl = uploadRes.data.url;
      const content = `AUDIO:${audioUrl}`;

      console.log('📝 Saving to database...');
      const res = await apiService.createCommunityPost({
        Content: content,
        P_ID: currentUser.P_ID,
      });

      const newMessage = {
        C_ID: res.data.C_ID || res.data.insertId,
        Content: content,
        P_ID: currentUser.P_ID,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, newMessage]);

      if (socket) {
        socket.emit('sendMessage', {
          id: newMessage.C_ID,
          senderId: currentUser.P_ID,
          senderName: currentUser.Full_Name || 'Parent',
          text: content,
          type: 'audio',
          audioUrl: audioUrl
        });
      }
      console.log('✅ Audio message sent successfully');
    } catch (err) {
      console.error('❌ Error sending audio:', err.message);
      Alert.alert('Upload Failed', `Could not send voice message: ${err.message}\nCheck your internet and server connection.`);
    }
  };

  const handlePlayAudio = async (audioUrl, msgId) => {
    try {
      if (playingAudio === msgId) return;
      
      // Fix for mobile devices: Replace localhost with the actual server IP
      const fixedUrl = audioUrl.replace('localhost', API_BASE.split('//')[1].split(':')[0]);
      console.log('🔊 Playing audio from:', fixedUrl);
      
      // Configure audio for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false, // Turn off recording mode for better playback volume
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      setPlayingAudio(msgId);
      const { sound } = await Audio.Sound.createAsync({ uri: fixedUrl });
      await sound.playAsync();
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingAudio(null);
          sound.unloadAsync();
        }
      });
    } catch (err) {
      console.error('Playback failed', err);
      setPlayingAudio(null);
      Alert.alert('Playback Error', 'Could not play this audio message.');
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    if (!currentUser) {
      Alert.alert('Session Error', 'You must be logged in to send messages.');
      return;
    }

    const content = messageText.trim();
    setMessageText('');

    try {
      const res = await apiService.createCommunityPost({
        Content: content,
        P_ID: currentUser.P_ID,
      });

      const newMessage = {
        C_ID: res.data.C_ID || res.data.insertId,
        Content: content,
        P_ID: currentUser.P_ID,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, newMessage]);

      if (socket) {
        socket.emit('sendMessage', {
          id: newMessage.C_ID,
          senderId: currentUser.P_ID,
          senderName: currentUser.Full_Name || 'Parent',
          text: content,
          type: 'text'
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send message. Please check your connection.');
    }
  };

  const renderMessageItem = ({ item }) => {
    const isMe = item.P_ID === currentUser?.P_ID;
    const senderName = parentNames[item.P_ID] || 'Parent';
    const isAudio = String(item.Content).startsWith('AUDIO:');
    
    return (
      <View style={[styles.chatRow, isMe ? styles.chatRowMe : styles.chatRowOther]}>
        {!isMe && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{senderName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={[styles.chatBubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          {!isMe && <Text style={styles.chatSenderName}>{senderName}</Text>}
          {isAudio ? (
            <TouchableOpacity 
              style={styles.audioBubbleContent}
              onPress={() => handlePlayAudio(item.Content.replace('AUDIO:', ''), item.C_ID)}
            >
              <Ionicons name={playingAudio === item.C_ID ? "pause" : "play"} size={24} color={isMe ? "#FFFFFF" : "#9D64AA"} />
              <View style={styles.audioWaveform}>
                {[1,2,3,4,5,6].map(i => (
                  <View key={i} style={[styles.waveBar, { height: 10 + Math.random() * 15, backgroundColor: isMe ? "#FFFFFF" : "#9D64AA" }]} />
                ))}
              </View>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.chatText, isMe ? styles.textMe : styles.textOther]}>
              {item.Content}
            </Text>
          )}
          <Text style={[styles.chatTime, isMe ? styles.timeMe : styles.timeOther]}>
            10:23 AM
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.chatContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#9D64AA" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 0}
    >
      <View style={styles.chatContainer}>
        <View style={styles.chatHeader}>
          <View style={styles.headerInfo}>
            <View style={styles.groupIcon}>
              <Ionicons name="people" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>We Are One</Text>
              <Text style={styles.headerSubtitle}>Community Chat • 12 Online</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.infoBtn}>
            <Ionicons name="information-circle-outline" size={24} color="#9D64AA" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={item => item.C_ID?.toString() || Math.random().toString()}
          contentContainerStyle={styles.chatListContent}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.chatInputWrapper}>
          <TouchableOpacity style={styles.attachBtn}>
            <Ionicons name="attach" size={24} color="#9D64AA" />
          </TouchableOpacity>
          
          <View style={styles.inputShadow}>
            <TextInput
              style={styles.premiumChatInput}
              placeholder={isRecording ? "Recording Voice..." : "Type Message..."}
              value={messageText}
              onChangeText={setMessageText}
              placeholderTextColor="#A0A0A0"
              multiline
              editable={!isRecording}
            />
          </View>

          {messageText.trim() ? (
            <TouchableOpacity 
              style={styles.chatSendBtn}
              onPress={handleSendMessage}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.chatSendBtn, isRecording && { backgroundColor: '#e74c3c' }]}
              onPress={toggleRecording}
              activeOpacity={0.7}
            >
              <Ionicons name={isRecording ? "stop" : "mic"} size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

// COMMUNICATION TOOL SCREEN
export const CommunicationToolScreen = ({ navigation }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [speaking, setSpeaking] = useState(null);

  const CARDS_PER_PAGE = 6;
  const COLORS = [
    '#A4D4B4', // Green
    '#91C9E8', // Blue
    '#B3E5FC', // Light Blue
    '#C4A0CC', // Purple
    '#80CBC4', // Teal
    '#E1F5FE', // Mint
  ];

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      console.log('🔄 Fetching communication tools from:', `${API_BASE}/modules/communicationtool/communication_tool`);
      const res = await apiService.getCommunicationTools();
      console.log('✅ Communication tools fetched:', Array.isArray(res.data) ? res.data.length : 'Not an array');
      setCards(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('❌ Error fetching communication tools:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const paginatedCards = cards.slice(
    currentPage * CARDS_PER_PAGE,
    (currentPage + 1) * CARDS_PER_PAGE
  );

  const handleCardPress = (card) => {
    setSpeaking(card.CT_ID);
    const phrase = card.Phrase || card.Button_Label;
    Speech.stop();
    Speech.speak(phrase, {
      language: 'en-US',
      rate: 0.9,
      onDone: () => setSpeaking(null),
      onError: () => setSpeaking(null),
    });
    // Fallback for visual in case speech doesn't trigger onDone fast enough
    setTimeout(() => setSpeaking(null), 2000);
  };

  const totalPages = Math.ceil(cards.length / CARDS_PER_PAGE);
  const pageTitles = ['Tap to tell us what you need', 'Tap to tell us what you need', 'Tap to respond'];
  const pageTitle = pageTitles[currentPage] ?? 'Tap a card';

  const renderCardItem = (item, index) => {
    const colorIndex = (currentPage * CARDS_PER_PAGE + index) % COLORS.length;
    const cardColor = COLORS[colorIndex];
    const isActive = speaking === item.CT_ID;

    return (
      <TouchableOpacity
        key={item.CT_ID}
        style={[
          styles.premiumCommCard,
          { backgroundColor: cardColor, transform: [{ scale: isActive ? 1.05 : 1 }] }
        ]}
        onPress={() => handleCardPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardImageContainer}>
          <Image
            source={{ 
              uri: item.Icon_Image && item.Icon_Image.startsWith('http') 
                ? item.Icon_Image 
                : `${API_BASE}/images/${item.Icon_Image}` 
            }}
            style={styles.premiumCardImage}
            resizeMode="cover"
            onError={(e) => console.log('Image load error:', item.Icon_Image)}
          />
        </View>
        <Text style={styles.premiumCardLabel} numberOfLines={2}>
          {item.Button_Label}
        </Text>
        {isActive && <View style={styles.premiumSpeakingPulse} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#9D64AA" />
      </View>
    );
  }

  return (
    <View style={styles.premiumCommContainer}>
      <Text style={styles.premiumPageTitle}>{pageTitle}</Text>

      {cards.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="chatbox-outline" size={48} color="#C4A0CC" />
          <Text style={{ marginTop: 12, fontSize: 14, color: '#6b6b6b', fontWeight: '600' }}>
            No communication tools found
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.premiumScroll} 
          contentContainerStyle={styles.premiumScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.premiumGrid}>
            {paginatedCards.map((item, index) => renderCardItem(item, index))}
          </View>
        </ScrollView>
      )}

      {totalPages > 1 && (
        <View style={styles.premiumPaginationDots}>
          <TouchableOpacity 
            style={styles.pagArrow} 
            onPress={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
          >
            <Ionicons name="chevron-back" size={24} color={currentPage === 0 ? "#DDD" : "#9D64AA"} />
          </TouchableOpacity>
          
          <View style={styles.dotsRow}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <TouchableOpacity 
                key={i} 
                onPress={() => setCurrentPage(i)}
                style={[styles.paginationDot, i === currentPage && styles.paginationDotActive]} 
              />
            ))}
          </View>

          <TouchableOpacity 
            style={styles.pagArrow} 
            onPress={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage === totalPages - 1}
          >
            <Ionicons name="chevron-forward" size={24} color={currentPage === totalPages - 1 ? "#DDD" : "#9D64AA"} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// SHARED STYLES
const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    backgroundColor: '#F9F5F2',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEAE2',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9D64AA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2d2d2d',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#A0A0A0',
    fontWeight: '600',
  },
  chatListContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  chatRow: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  chatRowMe: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  chatRowOther: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 'auto',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  chatBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    position: 'relative',
  },
  bubbleMe: {
    backgroundColor: '#A4D4B4',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#E1F5FE',
    borderBottomLeftRadius: 4,
  },
  chatSenderName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b6b6b',
    marginBottom: 4,
  },
  chatText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  textMe: {
    color: '#2d2d2d',
  },
  textOther: {
    color: '#2d2d2d',
  },
  chatTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
    fontWeight: '600',
  },
  timeMe: {
    color: 'rgba(0,0,0,0.4)',
  },
  timeOther: {
    color: 'rgba(0,0,0,0.3)',
  },
  chatInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFEAE2',
    gap: 10,
  },
  attachBtn: {
    padding: 8,
  },
  inputShadow: {
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  premiumChatInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2d2d2d',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#EFEAE2',
  },
  chatSendBtn: {
    backgroundColor: '#9D64AA',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9D64AA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  chatSendBtnDisabled: {
    backgroundColor: '#D1C4D9',
    shadowOpacity: 0,
  },
  audioBubbleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 150,
    paddingVertical: 4,
  },
  audioWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },
  audioDuration: {
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.7,
  },
  // PREMIUM COMMUNICATION TOOL STYLES
  premiumCommContainer: {
    flex: 1,
    backgroundColor: '#FAF8F6',
    paddingBottom: 20,
  },
  premiumPageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2d2d2d',
    textAlign: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    fontFamily: 'System',
  },
  premiumScroll: {
    flex: 1,
  },
  premiumScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  premiumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  premiumCommCard: {
    width: '48%',
    aspectRatio: 0.85,
    borderRadius: 24,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImageContainer: {
    width: '85%',
    height: '65%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  premiumCardImage: {
    width: '100%',
    height: '100%',
  },
  premiumCardLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2d2d2d',
    textAlign: 'center',
    marginTop: 4,
  },
  premiumSpeakingPulse: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#6c5ce7',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  premiumPaginationDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDD',
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#9D64AA',
  },
  pagArrow: {
    padding: 10,
  },
});
