import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { auth } from '../../firebase/firebase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../config/colors';

const UserAppointmentHistoryScreen = () => {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'created_at' | 'date'>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const user = auth.currentUser;
    const router = useRouter();
    const { refresh } = useLocalSearchParams();

    const fetchAppointments = useCallback(async () => {
        if (!user) {
            setError('No authenticated user found');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`http://192.168.1.4:8000/api/appointments/user/${user.uid}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to fetch appointments');
            }
            const data = await response.json();
            const sortedData = [...data].sort((a, b) => {
                const valueA = sortBy === 'created_at' ? new Date(a.created_at) : new Date(`${a.date} ${a.time}`);
                const valueB = sortBy === 'created_at' ? new Date(b.created_at) : new Date(`${b.date} ${b.time}`);
                return sortOrder === 'asc' ? valueA.getTime() - valueB.getTime() : valueB.getTime() - valueA.getTime();
            });
            setAppointments(sortedData);
        } catch (error: any) {
            console.error('Fetch appointments error:', error.message);
            setError(`Error fetching appointments: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [user, sortBy, sortOrder]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments, refresh]);

    const handleRefresh = () => {
        fetchAppointments();
    };

    const toggleSort = (newSortBy: 'created_at' | 'date') => {
        setSortBy(newSortBy);
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    };

    const renderAppointment = ({ item }: { item: any }) => {
        const borderColor = item.status === 'accepted' ? colors.success : item.status === 'rejected' ? colors.error : colors.primary;

        return (
            <View style={[styles.appointmentCard, { borderColor, borderWidth: 2 }]}>
                <Text style={styles.appointmentText}>Doctor: {item.doctor_name}</Text>
                <Text style={styles.appointmentText}>Date: {item.date}</Text>
                <Text style={styles.appointmentText}>Time: {item.time}</Text>
                <Text style={styles.appointmentText}>Status: {item.status}</Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading appointments...</Text>
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
            <Text style={styles.header}>Appointment History</Text>
            <View style={styles.sortContainer}>
                <TouchableOpacity
                    style={[styles.sortButton, sortBy === 'created_at' && styles.activeSortButton]}
                    onPress={() => toggleSort('created_at')}
                >
                    <Text style={styles.sortButtonText}>Submit Date {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.sortButton, sortBy === 'date' && styles.activeSortButton]}
                    onPress={() => toggleSort('date')}
                >
                    <Text style={styles.sortButtonText}>Appointment Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
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
    sortContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    sortButton: {
        backgroundColor: colors.cardBackground,
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.inactiveTint,
    },
    activeSortButton: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    sortButtonText: {
        color: colors.text,
        fontSize: 14,
        textAlign: 'center',
    },
    refreshButton: {
        backgroundColor: colors.primary,
        padding: 10,
        borderRadius: 8,
        marginBottom: 16,
        alignSelf: 'center',
    },
    refreshButtonText: {
        color: colors.cardBackground,
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    appointmentCard: {
        backgroundColor: colors.cardBackground,
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    appointmentText: {
        fontSize: 16,
        color: colors.text,
        marginBottom: 4,
    },
    emptyText: {
        textAlign: 'center',
        color: colors.inactiveTint,
        marginTop: 20,
    },
    errorText: {
        color: colors.error,
        textAlign: 'center',
        marginTop: 20,
    },
    loadingText: {
        textAlign: 'center',
        color: colors.inactiveTint,
        fontSize: 16,
    },
});

export default UserAppointmentHistoryScreen;