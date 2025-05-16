import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Platform, Alert } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { auth, db } from '../../firebase/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Modal from 'react-native-modal';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const SearchDoctorsScreen = () => {
    const router = useRouter();
    const user = auth.currentUser;
    const [searchQuery, setSearchQuery] = useState('');
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [totalDoctors, setTotalDoctors] = useState(0);
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const doctorsPerPage = 5;
    const [isLoading, setIsLoading] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');
    const [isModalVisible, setModalVisible] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [userName, setUserName] = useState('Unknown User');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<Date | null>(null);
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const [isTimePickerVisible, setTimePickerVisible] = useState(false);

    const fetchDoctors = async (query: string, page: number) => {
        setIsLoading(true);
        try {
            const response = await fetch(`http://192.168.1.4:8000/auth/search/doctors?q=${query}&page=${page}&limit=${doctorsPerPage}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to fetch doctors');
            const data = await response.json();
            console.log('API Response:', data);
            if (Array.isArray(data)) {
                setDoctors(data);
                setTotalDoctors(data.length);
            } else if (data.doctors && typeof data.total === 'number') {
                setDoctors(data.doctors);
                setTotalDoctors(data.total);
            } else {
                throw new Error('Unexpected response format');
            }
        } catch (error: any) {
            console.error('Fetch doctors error:', error.message);
            showSnackbar(`Error fetching doctors: ${error.message}`, 'error');
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchDoctors(searchQuery, currentPage);
    }, [searchQuery, currentPage]);

    useEffect(() => {
        const fetchUserName = async () => {
            if (!user) return;
            try {
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    setUserName(userData.username || userData.email || 'Unknown User');
                }
            } catch (error: any) {
                console.error('Error fetching user name:', error.message);
            }
        };
        fetchUserName();
    }, [user]);

    const totalPages = Math.ceil(totalDoctors / doctorsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const toggleCard = (id: string) => {
        setExpandedCard(expandedCard === id ? null : id);
    };

    const showSnackbar = (message: string, type: 'success' | 'error') => {
        setSnackbarMessage(message);
        setSnackbarType(type);
        setSnackbarVisible(true);
    };

    const initiateChat = async (doctor: Doctor) => {
        if (!user) {
            showSnackbar('User not authenticated', 'error');
            return;
        }

        try {
            const chatRoomId = [user.uid, doctor.firebase_uid].sort().join('_');
            const chatRoomRef = doc(db, 'chat_rooms', chatRoomId);

            let userName = 'Unknown User';
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                userName = userData.username || userData.email || 'Unknown User';
                console.log('Fetched username from Firestore:', userName);
            }

            await setDoc(chatRoomRef, {
                doctor_id: doctor.firebase_uid,
                user_id: user.uid,
                doctor_name: `${doctor.first_name} ${doctor.last_name}`.trim(),
                user_name: userName,
                created_at: new Date().toISOString(),
            }, { merge: true });

            console.log('Chat room updated/created:', chatRoomId, 'with user_name:', userName);

            router.push({
                pathname: '/components/User/ChatScreen',
                params: {
                    chatRoomId,
                    otherPartyName: `${doctor.first_name} ${doctor.last_name}`.trim(),
                },
            });
        } catch (error: any) {
            console.error('Initiate chat error:', error.message);
            showSnackbar(`Error initiating chat: ${error.message}`, 'error');
        }
    };

    const openAppointmentModal = (doctor: Doctor) => {
        setSelectedDoctor(doctor);
        setModalVisible(true);
    };

    const confirmDate = (date: Date) => {
        setSelectedDate(date);
        setDatePickerVisible(false);
    };

    const confirmTime = (time: Date) => {
        setSelectedTime(time);
        setTimePickerVisible(false);
    };

    const submitAppointment = async () => {
        if (!selectedDoctor || !selectedDate || !selectedTime || !user) {
            showSnackbar('Please select date and time', 'error');
            return;
        }

        try {
            const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
            const formattedTime = selectedTime.toTimeString().split(' ')[0].slice(0, 5); // HH:MM

            const response = await fetch('http://192.168.1.4:8000/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.uid,
                    user_name: userName,
                    doctor_id: selectedDoctor.firebase_uid,
                    doctor_name: `${selectedDoctor.first_name} ${selectedDoctor.last_name}`.trim(),
                    date: formattedDate,
                    time: formattedTime,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create appointment');
            }
            const data = await response.json();
            console.log('Appointment created:', data);
            showSnackbar('Appointment created successfully', 'success');
            setModalVisible(false);
            setSelectedDate(null);
            setSelectedTime(null);
        } catch (error: any) {
            console.error('Create appointment error:', error.message);
            showSnackbar(`Error creating appointment: ${error.message}`, 'error');
        }
    };

    interface Doctor {
        _id?: string;
        firebase_uid: string;
        first_name: string;
        last_name: string;
        contact_no: string;
        specialization: string;
        years_experience: number;
        skin_type: string;
        doctor_reg_no: string;
    }

    const renderDoctorCard = ({ item }: { item: Doctor }) => {
        const isExpanded = expandedCard === item.firebase_uid;
        const dummyImage = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

        return (
            <View key={item.firebase_uid} className="mb-4 p-4 bg-white rounded-lg shadow-md">
                <View className="flex-row items-center">
                    <Image source={{ uri: dummyImage }} className="w-16 h-16 rounded-full mr-4" />
                    <View>
                        <Text className="text-lg font-semibold text-[#3E4241]">
                            {item.first_name} {item.last_name}
                        </Text>
                        <Text className="text-gray-600">{item.contact_no}</Text>
                    </View>
                </View>
                {isExpanded && (
                    <View className="mt-4">
                        <Text className="text-gray-700">Specialization: {item.specialization || 'N/A'}</Text>
                        <Text className="text-gray-700">Years of Experience: {item.years_experience || 'N/A'}</Text>
                        <Text className="text-gray-700">Skin Type: {item.skin_type || 'N/A'}</Text>
                    </View>
                )}
                <View className="flex-row justify-between mt-4">
                    <TouchableOpacity onPress={() => toggleCard(item.firebase_uid)} className="bg-[#3674B5] p-2 rounded-lg">
                        <Text className="text-white text-sm">{isExpanded ? 'See Less' : 'See More'}</Text>
                    </TouchableOpacity>
                    <View className="flex-row space-x-2">
                        <TouchableOpacity onPress={() => initiateChat(item)} className="bg-gray-300 p-2 rounded-lg">
                            <Text className="text-black text-sm">Chat</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => openAppointmentModal(item)} className="bg-gray-300 p-2 rounded-lg">
                            <Text className="text-black text-sm">Appointment</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-[#FBF8EF] p-4">
            <Text className="text-4xl font-extrabold text-[#3E4241] text-center mb-4">Search Doctors</Text>
            <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by name or specialization..."
                placeholderTextColor="#888"
                className="border border-gray-300 rounded-lg py-3 px-4 mb-4 bg-white shadow-sm"
            />
            {isLoading ? (
                <Text className="text-center text-gray-500">Loading...</Text>
            ) : (
                <FlatList
                    data={doctors}
                    renderItem={renderDoctorCard}
                    keyExtractor={(item) => item.firebase_uid}
                    ListEmptyComponent={<Text className="text-center text-gray-500">No doctors found</Text>}
                />
            )}
            {totalDoctors > 0 && !isLoading && (
                <View className="flex-row justify-between mt-4">
                    <TouchableOpacity
                        onPress={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="bg-[#3674B5] p-2 rounded-lg disabled:opacity-50"
                    >
                        <Text className="text-white text-sm">Previous</Text>
                    </TouchableOpacity>
                    <Text className="text-gray-700">Page {currentPage} of {totalPages}</Text>
                    <TouchableOpacity
                        onPress={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="bg-[#3674B5] p-2 rounded-lg disabled:opacity-50"
                    >
                        <Text className="text-white text-sm">Next</Text>
                    </TouchableOpacity>
                </View>
            )}
            <View className="absolute bottom-5 left-0 right-0">
                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={Snackbar.DURATION_SHORT}
                    style={{ backgroundColor: snackbarType === 'success' ? 'green' : 'red', borderRadius: 8, padding: 10, marginHorizontal: 10 }}
                >
                    {snackbarMessage}
                </Snackbar>
            </View>
            <Modal isVisible={isModalVisible} onBackdropPress={() => setModalVisible(false)}>
                <View className="bg-white p-6 rounded-lg">
                    <Text className="text-lg font-bold mb-4">Create Appointment</Text>
                    <Text className="mb-2">Doctor: {selectedDoctor ? `${selectedDoctor.first_name} ${selectedDoctor.last_name}` : ''}</Text>
                    <Text className="mb-2">User: {userName}</Text>
                    <TouchableOpacity onPress={() => setDatePickerVisible(true)} className="bg-gray-200 p-2 rounded-lg mb-2">
                        <Text>{selectedDate ? selectedDate.toISOString().split('T')[0] : 'Select Date'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setTimePickerVisible(true)} className="bg-gray-200 p-2 rounded-lg mb-4">
                        <Text>{selectedTime ? selectedTime.toTimeString().split(' ')[0].slice(0, 5) : 'Select Time'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={submitAppointment} className="bg-[#3674B5] p-3 rounded-lg">
                        <Text className="text-white text-center">Submit Appointment</Text>
                    </TouchableOpacity>
                </View>
                <DateTimePickerModal
                    isVisible={isDatePickerVisible}
                    mode="date"
                    onConfirm={confirmDate}
                    onCancel={() => setDatePickerVisible(false)}
                    minimumDate={new Date()}
                />
                <DateTimePickerModal
                    isVisible={isTimePickerVisible}
                    mode="time"
                    onConfirm={confirmTime}
                    onCancel={() => setTimePickerVisible(false)}
                />
            </Modal>
        </View>
    );
};

export default SearchDoctorsScreen;