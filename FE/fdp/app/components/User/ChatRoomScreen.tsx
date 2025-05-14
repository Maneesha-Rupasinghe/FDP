// app/components/User/ChatRoomScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth, db } from '../../firebase/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const ChatRoomScreen = () => {
    const router = useRouter();
    const { doctorId, doctorName } = useLocalSearchParams();
    const userId = auth.currentUser?.uid;
    const userName = auth.currentUser?.displayName || 'User';
    const [chatRoomId, setChatRoomId] = useState<string | null>(null);

    useEffect(() => {
        if (!userId || !doctorId) {
            console.log('Missing userId or doctorId', { userId, doctorId });
            return;
        }

        const roomId = [userId, doctorId].sort().join('_');
        setChatRoomId(roomId);
        console.log('Generated chat room ID:', roomId);

        const createChatRoom = async () => {
            const chatRoomRef = doc(db, 'chat_rooms', roomId);
            const chatRoomSnap = await getDoc(chatRoomRef);

            if (!chatRoomSnap.exists()) {
                await setDoc(chatRoomRef, {
                    doctor_id: doctorId,
                    user_id: userId,
                    doctor_name: doctorName,
                    user_name: userName,
                    created_at: new Date().toISOString(),
                });
                console.log('Chat room created:', roomId);
            } else {
                console.log('Chat room already exists:', roomId);
            }
        };

        createChatRoom().catch(error => console.error('Error creating chat room:', error.message));
    }, [userId, doctorId, doctorName, userName]);

    const startChat = () => {
        if (chatRoomId) {
            router.push({
                pathname: '/components/User/ChatScreen',
                params: { chatRoomId, otherPartyName: doctorName },
            });
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Start Chat with {doctorName}</Text>
            <TouchableOpacity style={styles.button} onPress={startChat}>
                <Text style={styles.buttonText}>Open Chat</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FBF8EF', padding: 16 },
    header: { fontSize: 24, fontWeight: 'bold', color: '#3E4241', marginBottom: 16, textAlign: 'center' },
    button: { backgroundColor: '#3674B5', padding: 12, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default ChatRoomScreen;