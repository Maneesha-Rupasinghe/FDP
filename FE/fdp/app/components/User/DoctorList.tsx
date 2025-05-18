import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { auth, db } from '../../firebase/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Modal from 'react-native-modal';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { colors } from '../../config/colors';

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

    const renderDoctorCard = ({ item }: { item: Doctor }) => {
        const isExpanded = expandedCard === item.firebase_uid;
        const dummyImage = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Image source={{ uri: dummyImage }} style={styles.doctorImage} />
                    <View style={styles.doctorInfo}>
                        <Text style={styles.doctorName}>{item.first_name} {item.last_name}</Text>
                        <Text style={styles.doctorContact}>{item.contact_no}</Text>
                    </View>
                </View>
                {isExpanded && (
                    <View style={styles.expandedContent}>
                        <Text style={styles.detailText}>Specialization: {item.specialization || 'N/A'}</Text>
                        <Text style={styles.detailText}>Years of Experience: {item.years_experience || 'N/A'}</Text>
                        {/* <Text style={styles.detailText}>Skin Type: {item.skin_type || 'N/A'}</Text> */}
                    </View>
                )}
                <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => toggleCard(item.firebase_uid)} style={styles.toggleButton}>
                        <Text style={styles.toggleButtonText}>{isExpanded ? 'See Less' : 'See More'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => initiateChat(item)} style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openAppointmentModal(item)} style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>Appointment</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Search Doctors</Text>
            <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by name or specialization..."
                placeholderTextColor={colors.inactiveTint}
                style={styles.searchBar}
            />
            {isLoading ? (
                <Text style={styles.loadingText}>Loading...</Text>
            ) : (
                <FlatList
                    data={doctors}
                    renderItem={renderDoctorCard}
                    keyExtractor={(item) => item.firebase_uid}
                    ListEmptyComponent={<Text style={styles.emptyText}>No doctors found</Text>}
                    contentContainerStyle={styles.listContent}
                />
            )}
            {totalDoctors > 0 && !isLoading && (
                <View style={styles.pagination}>
                    <TouchableOpacity
                        onPress={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={[styles.paginationButton, currentPage === 1 && styles.disabledButton]}
                    >
                        <Text style={styles.paginationButtonText}>Previous</Text>
                    </TouchableOpacity>
                    <Text style={styles.paginationText}>Page {currentPage} of {totalPages}</Text>
                    <TouchableOpacity
                        onPress={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        style={[styles.paginationButton, currentPage === totalPages && styles.disabledButton]}
                    >
                        <Text style={styles.paginationButtonText}>Next</Text>
                    </TouchableOpacity>
                </View>
            )}
            <View style={styles.snackbarContainer}>
                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={Snackbar.DURATION_SHORT}
                    style={{ backgroundColor: snackbarType === 'success' ? colors.success : colors.error, borderRadius: 8 }}
                >
                    <Text style={styles.snackbarText}>{snackbarMessage}</Text>
                </Snackbar>
            </View>
            <Modal isVisible={isModalVisible} onBackdropPress={() => setModalVisible(false)}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Create Appointment</Text>
                    <Text style={styles.modalText}>Doctor: {selectedDoctor ? `${selectedDoctor.first_name} ${selectedDoctor.last_name}` : ''}</Text>
                    <Text style={styles.modalText}>User: {userName}</Text>
                    <TouchableOpacity onPress={() => setDatePickerVisible(true)} style={styles.dateButton}>
                        <Text style={styles.dateButtonText}>{selectedDate ? selectedDate.toISOString().split('T')[0] : 'Select Date'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setTimePickerVisible(true)} style={styles.timeButton}>
                        <Text style={styles.timeButtonText}>{selectedTime ? selectedTime.toTimeString().split(' ')[0].slice(0, 5) : 'Select Time'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={submitAppointment} style={styles.submitButton}>
                        <Text style={styles.submitButtonText}>Submit Appointment</Text>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 16,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 20,
    },
    searchBar: {
        height: 48,
        borderColor: colors.inactiveTint,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 16,
        backgroundColor: colors.cardBackground,
        color: colors.text,
    },
    card: {
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    doctorImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 12,
    },
    doctorInfo: {
        flex: 1,
    },
    doctorName: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    doctorContact: {
        fontSize: 14,
        color: colors.inactiveTint,
    },
    expandedContent: {
        marginTop: 12,
    },
    detailText: {
        fontSize: 14,
        color: colors.inactiveTint,
        marginBottom: 8,
    },
    cardActions: {
        flexDirection: 'column',
        gap: 8,
        marginTop: 12,
    },
    toggleButton: {
        backgroundColor: colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    toggleButtonText: {
        color: colors.cardBackground,
        fontSize: 14,
        textAlign: 'center',
    },
    actionButton: {
        backgroundColor: colors.secondary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    actionButtonText: {
        color: colors.text,
        fontSize: 14,
        textAlign: 'center',
    },
    listContent: {
        paddingBottom: 16,
    },
    loadingText: {
        textAlign: 'center',
        color: colors.inactiveTint,
        fontSize: 16,
    },
    emptyText: {
        textAlign: 'center',
        color: colors.inactiveTint,
        fontSize: 16,
        paddingVertical: 20,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
    },
    paginationButton: {
        backgroundColor: colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    disabledButton: {
        backgroundColor: colors.inactiveTint,
    },
    paginationButtonText: {
        color: colors.cardBackground,
        fontSize: 14,
    },
    paginationText: {
        fontSize: 14,
        color: colors.text,
    },
    snackbarContainer: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        right: 10,
    },
    snackbarText: {
        color: colors.cardBackground,
    },
    modalContainer: {
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: 20,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 16,
    },
    modalText: {
        fontSize: 16,
        color: colors.inactiveTint,
        marginBottom: 12,
    },
    dateButton: {
        backgroundColor: colors.secondary,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    dateButtonText: {
        color: colors.text,
        fontSize: 16,
    },
    timeButton: {
        backgroundColor: colors.secondary,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    timeButtonText: {
        color: colors.text,
        fontSize: 16,
    },
    submitButton: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    submitButtonText: {
        color: colors.cardBackground,
        fontSize: 16,
        textAlign: 'center',
    },
});

export default SearchDoctorsScreen;