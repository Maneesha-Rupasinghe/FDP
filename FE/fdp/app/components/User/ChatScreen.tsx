import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { auth, db } from '../../firebase/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { colors } from '../../config/colors';

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
            <View style={[styles.messageContainer, isSentByUser ? styles.sentMessage : styles.receivedMessage]}>
                <Text style={styles.messageText}>{item.text}</Text>
                <Text style={styles.timestampText}>
                    {item.timestamp?.toDate().toLocaleTimeString()}
                </Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <Text style={styles.header}>Chat with {otherPartyName}</Text>
            <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                style={styles.messageList}
                contentContainerStyle={styles.messageListContent}
            />
            <View style={styles.inputContainer}>
                <TextInput
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="Type a message..."
                    placeholderTextColor={colors.inactiveTint}
                    style={styles.input}
                />
                <TouchableOpacity
                    onPress={sendMessage}
                    style={styles.sendButton}
                >
                    <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.snackbarContainer}>
                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={Snackbar.DURATION_SHORT}
                    style={{
                        backgroundColor: snackbarType === 'success' ? colors.success : colors.error,
                        borderRadius: 8,
                        padding: 10,
                        marginHorizontal: 10,
                    }}
                >
                    <Text style={styles.snackbarText}>{snackbarMessage}</Text>
                </Snackbar>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 16,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    messageList: {
        flex: 1,
    },
    messageListContent: {
        paddingBottom: 20,
    },
    messageContainer: {
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
        maxWidth: '70%',
    },
    sentMessage: {
        backgroundColor: colors.primary,
        alignSelf: 'flex-end',
    },
    receivedMessage: {
        backgroundColor: colors.secondary,
        alignSelf: 'flex-start',
    },
    messageText: {
        fontSize: 16,
        color: colors.cardBackground,
    },
    timestampText: {
        fontSize: 12,
        color: colors.cardBackground,
        textAlign: 'right',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
    },
    input: {
        flex: 1,
        height: 48,
        borderColor: colors.inactiveTint,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        backgroundColor: colors.cardBackground,
        marginRight: 8,
    },
    sendButton: {
        backgroundColor: colors.primary,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    sendButtonText: {
        color: colors.cardBackground,
        fontSize: 16,
        fontWeight: 'bold',
    },
    snackbarContainer: {
        position: 'absolute',
        bottom: 5,
        left: 0,
        right: 0,
    },
    snackbarText: {
        color: colors.cardBackground,
    },
});

export default ChatScreen;