import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { colors } from '../../config/colors';

interface Update {
    id: string;
    title: string;
    description: string;
    date: string;
}

const RegularUpdatesScreen = () => {
    const [updates, setUpdates] = useState<Update[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Mock data for now; replace with API call later
    useEffect(() => {
        const mockUpdates: Update[] = [
            {
                id: '1',
                title: 'Health Tip: Stay Hydrated',
                description: 'Drink at least 8 glasses of water daily to keep your skin healthy.',
                date: 'May 18, 2025',
            },
            {
                id: '2',
                title: 'Reminder: Upcoming Appointment',
                description: 'You have an appointment with Dr. Smith on May 20, 2025, at 10:00 AM.',
                date: 'May 17, 2025',
            },
            {
                id: '3',
                title: 'App Update: New Feature',
                description: 'We’ve added a new feature to track your skin health progress.',
                date: 'May 16, 2025',
            },
        ];

        // Simulate API call
        setTimeout(() => {
            setUpdates(mockUpdates);
            setLoading(false);
        }, 1000);

        // Uncomment to fetch from API
        /*
        const fetchUpdates = async () => {
            setLoading(true);
            try {
                const response = await fetch('http://192.168.1.4:8000/api/updates');
                if (!response.ok) throw new Error('Failed to fetch updates');
                const data = await response.json();
                setUpdates(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUpdates();
        */
    }, []);

    const renderUpdate = ({ item }: { item: Update }) => (
        <View style={styles.updateCard}>
            <Text style={styles.updateTitle}>{item.title}</Text>
            <Text style={styles.updateDescription}>{item.description}</Text>
            <Text style={styles.updateDate}>{item.date}</Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading updates...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Error: {error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Regular Updates</Text>
            <FlatList
                data={updates}
                renderItem={renderUpdate}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={<Text style={styles.emptyText}>No updates available</Text>}
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
    updateCard: {
        backgroundColor: colors.cardBackground,
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    updateTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    updateDescription: {
        fontSize: 16,
        color: colors.text,
        marginBottom: 4,
    },
    updateDate: {
        fontSize: 14,
        color: colors.inactiveTint,
        textAlign: 'right',
    },
    emptyText: {
        fontSize: 16,
        color: colors.inactiveTint,
        textAlign: 'center',
        marginTop: 20,
    },
    loadingText: {
        fontSize: 16,
        color: colors.text,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 16,
        color: colors.error,
        textAlign: 'center',
    },
});

export default RegularUpdatesScreen;