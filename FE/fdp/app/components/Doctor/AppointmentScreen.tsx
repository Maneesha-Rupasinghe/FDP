import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { auth } from '../../firebase/firebase';
import { colors } from '../../config/colors';

const DoctorAppointmentScreen = () => {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const doctorId = auth.currentUser?.uid;
        if (!doctorId) {
            console.log('No authenticated doctor found');
            setError('No authenticated doctor found');
            setLoading(false);
            return;
        }

        const fetchAppointments = async () => {
            try {
                const response = await fetch(`http://192.168.1.4:8000/api/appointments/doctor/${doctorId}`);
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || 'Failed to fetch appointments');
                }
                const data = await response.json();
                console.log('Fetched appointments:', data);
                setAppointments(data);
            } catch (error: any) {
                console.error('Fetch appointments error:', error.message);
                setError(`Error fetching appointments: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, []);

    const updateAppointmentStatus = async (appointmentId: string, status: 'accepted' | 'rejected') => {
        try {
            const response = await fetch(`http://192.168.1.4:8000/api/appointments/${appointmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to update appointment');
            }
            const data = await response.json();
            console.log('Appointment updated:', data);
            setAppointments(appointments.map(app => app.id === appointmentId ? { ...app, status } : app));
        } catch (error: any) {
            console.error('Update appointment error:', error.message);
            alert(`Error updating appointment: ${error.message}`);
        }
    };

    const renderAppointment = ({ item }: { item: any }) => {
        const isPending = item.status === 'pending';
        return (
            <View style={styles.appointmentCard}>
                <Text style={styles.appointmentText}>User: {item.user_name}</Text>
                <Text style={styles.appointmentText}>Date: {item.date}</Text>
                <Text style={styles.appointmentText}>Time: {item.time}</Text>
                <Text style={styles.appointmentText}>Status: {item.status}</Text>
                {isPending && (
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.acceptButton}
                            onPress={() => updateAppointmentStatus(item.id, 'accepted')}
                        >
                            <Text style={styles.buttonText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.rejectButton}
                            onPress={() => updateAppointmentStatus(item.id, 'rejected')}
                        >
                            <Text style={styles.buttonText}>Reject</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={{ color: colors.text }}>Loading appointments...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Appointments</Text>
            <FlatList
                data={appointments}
                renderItem={renderAppointment}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={<Text style={styles.emptyText}>No appointments found</Text>}
            />
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
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    appointmentCard: {
        backgroundColor: colors.cardBackground,
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        shadowColor: colors.shadow,
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    appointmentText: {
        fontSize: 16,
        color: colors.text,
        marginBottom: 4,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    acceptButton: {
        backgroundColor: colors.primary,
        padding: 8,
        borderRadius: 5,
        flex: 1,
        marginRight: 5,
    },
    rejectButton: {
        backgroundColor: colors.error,
        padding: 8,
        borderRadius: 5,
        flex: 1,
        marginLeft: 5,
    },
    buttonText: {
        color: '#FFF',
        textAlign: 'center',
    },
    emptyText: {
        textAlign: 'center',
        color: colors.inactiveTint,
        marginTop: 20,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 20,
    },
});

export default DoctorAppointmentScreen;