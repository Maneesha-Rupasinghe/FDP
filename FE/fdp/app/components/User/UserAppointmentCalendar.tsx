import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
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

const UserAppointmentCalendar = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [markedDates, setMarkedDates] = useState<MarkedDates>({});
    const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');
    const [calendarError, setCalendarError] = useState<boolean>(false);
    const user = auth.currentUser;

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
        if (!user) {
            setSnackbarMessage('User not authenticated.');
            setSnackbarType('error');
            setSnackbarVisible(true);
            return;
        }

        const fetchAppointments = async () => {
            try {
                const response = await fetch(`http://192.168.1.4:8000/api/appointments/user/${user.uid}`);
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
                        dotColor: colors.success,
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
    }, [user]);

    const handleDayPress = (day: { dateString: string }) => {
        setSelectedDate(day.dateString);
    };

    const selectedAppointments = appointments.filter(
        (appointment) => appointment.date === selectedDate
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Upcoming Appointments</Text>
            {calendarError ? (
                <Text style={styles.errorText}>
                    Calendar unavailable. Please check your setup or select a date manually.
                </Text>
            ) : (
                <View style={styles.card}>
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
                        style={styles.calendar}
                    />
                    {selectedDate && (
                        <View style={styles.appointmentsContainer}>
                            <Text style={styles.subHeader}>Appointments on {selectedDate}</Text>
                            {selectedAppointments.length === 0 ? (
                                <Text style={styles.noAppointmentsText}>No accepted appointments on this day.</Text>
                            ) : (
                                <ScrollView>
                                    {selectedAppointments.map((appointment) => (
                                        <View key={appointment.id} style={styles.appointmentCard}>
                                            <Text style={styles.appointmentText}>Doctor: {appointment.doctor_name}</Text>
                                            <Text style={styles.appointmentText}>Time: {appointment.time}</Text>
                                            <Text style={styles.appointmentText}>Status: {appointment.status}</Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    )}
                </View>
            )}
            <View style={styles.snackbarContainer}>
                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={Snackbar.DURATION_SHORT}
                    style={{ backgroundColor: snackbarType === 'success' ? colors.success : colors.error, borderRadius: 8, elevation: 3 }}
                >
                    <Text style={styles.snackbarText}>{snackbarMessage}</Text>
                </Snackbar>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 8,
        paddingVertical: 16
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    card: {
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: 16,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 16,
    },
    calendar: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        marginBottom: 16,
    },
    appointmentsContainer: {
        flex: 1,
    },
    subHeader: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 10,
        marginHorizontal: 8,
    },
    noAppointmentsText: {
        fontSize: 16,
        color: colors.text,
        marginHorizontal: 8,
    },
    appointmentCard: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 12,
        marginVertical: 8,
        marginHorizontal: 8,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    appointmentText: {
        fontSize: 16,
        color: colors.text,
        marginBottom: 4,
    },
    errorText: {
        fontSize: 16,
        color: colors.error,
        marginHorizontal: 8,
    },
    snackbarContainer: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        right: 10,
    },
    snackbarText: {
        color: '#FFF',
    },
});

export default UserAppointmentCalendar;