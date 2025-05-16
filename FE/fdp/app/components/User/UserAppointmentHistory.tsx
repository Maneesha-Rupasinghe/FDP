import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { auth } from '../../firebase/firebase';
import { useRouter, useLocalSearchParams } from 'expo-router';

const UserAppointmentHistoryScreen = () => {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'created_at' | 'date'>('created_at'); // Default sort by submission date
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Default descending
    const user = auth.currentUser;
    const router = useRouter();
    const { refresh } = useLocalSearchParams(); // Get route params to detect new appointment

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
            // Apply sorting after fetching
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
    }, [user, sortBy, sortOrder]); // Re-fetch and sort when sort criteria changes

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments, refresh]); // Refetch when 'refresh' param changes

    const handleRefresh = () => {
        fetchAppointments();
    };

    const toggleSort = (newSortBy: 'created_at' | 'date') => {
        setSortBy(newSortBy);
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); // Toggle between asc and desc
    };

    const renderAppointment = ({ item }: { item: any }) => {
        const borderColor = item.status === 'accepted' ? 'green' : item.status === 'rejected' ? 'red' : '#3674B5';

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
                <Text>Loading appointments...</Text>
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
                    <Text style={styles.sortButtonText}>Sort by Submit Date {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.sortButton, sortBy === 'date' && styles.activeSortButton]}
                    onPress={() => toggleSort('date')}
                >
                    <Text style={styles.sortButtonText}>Sort by Appt Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}</Text>
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
    sortContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    sortButton: {
        backgroundColor: '#FFF',
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#CCC',
    },
    activeSortButton: {
        backgroundColor: '#3674B5',
        borderColor: '#3674B5',
    },
    sortButtonText: {
        color: '#3E4241',
        fontSize: 14,
        textAlign: 'center',
    },
    refreshButton: {
        backgroundColor: '#3674B5',
        padding: 10,
        borderRadius: 8,
        marginBottom: 16,
        alignSelf: 'center',
    },
    refreshButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    appointmentCard: {
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    appointmentText: {
        fontSize: 16,
        color: '#3E4241',
        marginBottom: 4,
    },
    emptyText: {
        textAlign: 'center',
        color: '#888',
        marginTop: 20,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 20,
    },
});

export default UserAppointmentHistoryScreen;