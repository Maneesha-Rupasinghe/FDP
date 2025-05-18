import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth, db } from '../../firebase/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { colors } from '../../config/colors';

const ChatRoomScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const doctorId = typeof params.doctorId === 'string' ? params.doctorId : null;
    const doctorName = typeof params.doctorName === 'string' ? params.doctorName : 'Doctor';
    const userId = auth.currentUser?.uid;
    const userName = auth.currentUser?.displayName || 'User';
    const [chatRoomId, setChatRoomId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setError('User not authenticated');
            return;
        }

        if (!doctorId) {
            setError('Doctor ID is missing. Please select a doctor to start a chat.');
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

        createChatRoom().catch(error => {
            console.error('Error creating chat room:', error.message);
            setError(`Failed to create chat room: ${error.message}`);
        });
    }, [userId, doctorId, doctorName, userName]);

    const startChat = () => {
        if (chatRoomId) {
            router.push({
                pathname: '/components/User/ChatScreen',
                params: { chatRoomId, otherPartyName: doctorName },
            });
        }
    };

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

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
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 16,
        justifyContent: 'center',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 24,
        textAlign: 'center',
    },
    button: {
        backgroundColor: colors.primary,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: colors.cardBackground,
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        color: colors.error,
        fontSize: 16,
        textAlign: 'center',
    },
});

export default ChatRoomScreen;