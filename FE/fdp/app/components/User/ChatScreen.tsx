// app/components/User/ChatScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { auth, db } from '../../firebase/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';

const ChatScreen = () => {
    const { chatRoomId, otherPartyName } = useLocalSearchParams();
    const user = auth.currentUser;
    const [messages, setMessages] = useState<{ id: string; sender_id: string; text: string; timestamp: Timestamp }[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

    useEffect(() => {
        if (!user || !chatRoomId) {
            showSnackbar('Invalid chat room or user not authenticated', 'error');
            return;
        }

        console.log('Fetching messages for chatRoomId:', chatRoomId);

        const messagesRef = collection(db, 'chat_rooms', chatRoomId as string, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messagesData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    sender_id: data.sender_id,
                    text: data.text,
                    timestamp: data.timestamp,
                };
            });
            console.log('Fetched messages:', messagesData);
            setMessages(messagesData);
        }, (error) => {
            console.error('Fetch messages error:', error.message);
            showSnackbar(`Error fetching messages: ${error.message}`, 'error');
        });

        return () => unsubscribe();
    }, [chatRoomId]);

    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            const messagesRef = collection(db, 'chat_rooms', chatRoomId as string, 'messages');
            await addDoc(messagesRef, {
                sender_id: user?.uid || 'unknown',
                text: newMessage,
                timestamp: Timestamp.now(),
            });
            setNewMessage('');
            console.log('Message sent successfully');
        } catch (error: any) {
            console.error('Send message error:', error.message);
            showSnackbar(`Error sending message: ${error.message}`, 'error');
        }
    };

    const showSnackbar = (message: string, type: 'success' | 'error') => {
        setSnackbarMessage(message);
        setSnackbarType(type);
        setSnackbarVisible(true);
    };

    const renderMessage = ({ item }: { item: { id: string; sender_id: string; text: string; timestamp: Timestamp } }) => {
        const isSentByUser = user ? item.sender_id === user.uid : false;
        return (
            <View className={`mb-2 p-2 rounded-lg ${isSentByUser ? 'bg-[#3674B5] self-end' : 'bg-gray-200 self-start'}`}>
                <Text className={isSentByUser ? 'text-white' : 'text-black'}>{item.text}</Text>
                <Text className={`text-xs ${isSentByUser ? 'text-white' : 'text-gray-500'}`}>
                    {item.timestamp?.toDate().toLocaleTimeString()}
                </Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-[#FBF8EF] p-4"
        >
            <Text className="text-2xl font-bold text-[#3E4241] mb-4">Chat with {otherPartyName}</Text>
            <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 20 }}
            />
            <View className="flex-row items-center mt-4">
                <TextInput
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="Type a message..."
                    placeholderTextColor="#888"
                    className="flex-1 border border-gray-300 rounded-lg py-2 px-4 bg-white"
                />
                <TouchableOpacity
                    onPress={sendMessage}
                    className="bg-[#3674B5] p-2 rounded-lg ml-2"
                >
                    <Text className="text-white font-semibold">Send</Text>
                </TouchableOpacity>
            </View>
            <View className="absolute bottom-5 left-0 right-0">
                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={Snackbar.DURATION_SHORT}
                    style={{
                        backgroundColor: snackbarType === 'success' ? 'green' : 'red',
                        borderRadius: 8,
                        padding: 10,
                        marginHorizontal: 10,
                    }}
                >
                    {snackbarMessage}
                </Snackbar>
            </View>
        </KeyboardAvoidingView>
    );
};

export default ChatScreen;