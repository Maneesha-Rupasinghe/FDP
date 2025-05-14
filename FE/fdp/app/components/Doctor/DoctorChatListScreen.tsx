// app/components/Doctor/DoctorChatListScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../../firebase/firebase';
import { collection, query, where, onSnapshot, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

const DoctorChatListScreen = () => {
  const router = useRouter();
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const doctorId = auth.currentUser?.uid;
    console.log('Doctor ID:', doctorId);

    if (!doctorId) {
      console.log('No authenticated doctor found');
      return;
    }

    const q = query(
      collection(db, 'chat_rooms'),
      where('doctor_id', '==', doctorId)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch the last message timestamp for each chat room
      const roomsWithLastMessage = await Promise.all(
        rooms.map(async (room) => {
          const messagesRef = collection(db, 'chat_rooms', room.id, 'messages');
          const lastMessageQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
          const lastMessageSnapshot = await getDocs(lastMessageQuery);
          let lastMessageTime = 'No messages yet';
          if (!lastMessageSnapshot.empty) {
            const lastMessage = lastMessageSnapshot.docs[0].data();
            lastMessageTime = lastMessage.timestamp?.toDate().toLocaleTimeString();
          }
          return { ...room, lastMessageTime };
        })
      );

      console.log('Fetched chat rooms with last message:', roomsWithLastMessage);
      setChatRooms(roomsWithLastMessage);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching chat rooms:', error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderChatItem = ({ item }: { item: { id: string; user_name: string; lastMessageTime: string } }) => {
    console.log('Rendering chat item:', item);
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => router.push({ pathname: '/components/Doctor/ChatScreen', params: { chatRoomId: item.id, otherPartyName: item.user_name } })}
      >
        <Text style={styles.chatTitle}>{item.user_name}</Text>
        <Text style={styles.chatTime}>{item.lastMessageTime}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading chat rooms...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chat List</Text>
      <FlatList
        data={chatRooms}
        renderItem={renderChatItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No chats available</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF8EF',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3E4241',
    marginBottom: 16,
    textAlign: 'center',
  },
  chatItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 8,
  },
  chatTitle: {
    fontSize: 18,
    color: '#3674B5',
  },
  chatTime: {
    fontSize: 12,
    color: '#888',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
  },
});

export default DoctorChatListScreen;