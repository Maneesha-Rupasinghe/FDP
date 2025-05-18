import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Snackbar } from 'react-native-paper';
import { auth } from '../../firebase/firebase';
import { colors } from '../../config/colors';

interface Appointment {
    id: string;
    user_id: string;
    user_name: string;
    doctor_id: string;
    doctor_name: string;
    date: string;
    time: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
}

interface MarkedDates {
    [key: string]: { marked: boolean; dotColor: string };
}

const DoctorAppointmentCalendar = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [markedDates, setMarkedDates] = useState<MarkedDates>({});
    const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');
    const [calendarError, setCalendarError] = useState<boolean>(false);
    const doctor = auth.currentUser;

    useEffect(() => {
        try {
            require('react-native-calendars');
        } catch (e) {
            setCalendarError(true);
            setSnackbarMessage('Calendar component unavailable. Please check your setup.');
            setSnackbarType('error');
            setSnackbarVisible(true);
        }
    }, []);

    useEffect(() => {
        if (!doctor) {
            setSnackbarMessage('Doctor not authenticated.');
            setSnackbarType('error');
            setSnackbarVisible(true);
            return;
        }

        const fetchAppointments = async () => {
            try {
                const response = await fetch(`http://192.168.1.4:8000/api/appointments/doctor/${doctor.uid}`);
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || 'Failed to fetch appointments');
                }
                const data: Appointment[] = await response.json();

                const acceptedAppointments = data.filter(appointment => appointment.status === 'accepted');
                setAppointments(acceptedAppointments);

                const newMarkedDates: MarkedDates = {};
                acceptedAppointments.forEach((appointment) => {
                    newMarkedDates[appointment.date] = {
                        marked: true,
                        dotColor: '#28a745',
                    };
                });
                setMarkedDates(newMarkedDates);
            } catch (error: any) {
                setSnackbarMessage('Failed to fetch appointments.');
                setSnackbarType('error');
                setSnackbarVisible(true);
            }
        };

        fetchAppointments();
    }, [doctor]);

    const handleDayPress = (day: { dateString: string }) => {
        setSelectedDate(day.dateString);
    };

    const selectedAppointments = appointments.filter(
        (appointment) => appointment.date === selectedDate
    );

    return (
        <View style={{ flex: 1, padding: 10 }} className="bg-[#FBF8EF]">
            <Text className="text-2xl font-extrabold text-[#3E4241] mb-5" style={{ color: colors.text }}>
                Upcoming Appointments
            </Text>

            {calendarError ? (
                <Text style={{ fontSize: 16, color: colors.error, marginHorizontal: 8 }}>
                    Calendar unavailable. Please check your setup or select a date manually.
                </Text>
            ) : (
                <View style={{ marginBottom: 15 }}>
                    <Calendar
                        onDayPress={handleDayPress}
                        markedDates={markedDates}
                        theme={{
                            calendarBackground: colors.cardBackground,
                            textSectionTitleColor: colors.text,
                            selectedDayBackgroundColor: colors.primary,
                            selectedDayTextColor: '#FFF',
                            todayTextColor: colors.primary,
                            dayTextColor: colors.text,
                            textDisabledColor: '#D1D5DB',
                            arrowColor: colors.primary,
                        }}
                        style={{ borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB' }}
                    />
                </View>
            )}

            {selectedDate ? (
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 10, marginHorizontal: 8 }}>
                        Appointments on {selectedDate}
                    </Text>
                    {selectedAppointments.length === 0 ? (
                        <Text style={{ fontSize: 16, color: colors.text, marginHorizontal: 8 }}>
                            No accepted appointments on this day.
                        </Text>
                    ) : (
                        <ScrollView>
                            {selectedAppointments.map((appointment) => (
                                <View
                                    key={appointment.id}
                                    style={{
                                        backgroundColor: colors.cardBackground,
                                        borderRadius: 12,
                                        padding: 12,
                                        marginVertical: 8,
                                        marginHorizontal: 8,
                                        shadowColor: colors.shadow,
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.1,
                                        shadowRadius: 4,
                                        elevation: 3,
                                    }}
                                >
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                                        User: {appointment.user_name}
                                    </Text>
                                    <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
                                        Time: {appointment.time}
                                    </Text>
                                    <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
                                        Status: {appointment.status}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </View>
            ) : (
                <Text style={{ fontSize: 16, color: colors.text, marginHorizontal: 8 }}>
                    Select a date to view appointments.
                </Text>
            )}

            <View className="absolute bottom-5 left-0 right-0">
                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={Snackbar.DURATION_SHORT}
                    style={{
                        backgroundColor: snackbarType === 'success' ? 'green' : colors.error,
                        borderRadius: 8,
                        padding: 10,
                        marginHorizontal: 10,
                    }}
                >
                    {snackbarMessage}
                </Snackbar>
            </View>
        </View>
    );
};

export default DoctorAppointmentCalendar;