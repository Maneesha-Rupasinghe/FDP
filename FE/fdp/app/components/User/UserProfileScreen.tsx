import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../../firebase/firebase';
import { colors } from '../../config/colors';
import UserProfileScreen from '../../components/User/ProfileScreen';
import RegularUpdatesScreen from '../../components/User/RegularUpdatesScreen';
import { scheduleDailyFaceScanReminder, requestNotificationPermission, testNotification } from '../../utils/NotificationService';

const ProfileScreen = () => {
    const [activeTab, setActiveTab] = useState<'profile' | 'updates'>('profile');
    const [isReady, setIsReady] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const setupNotifications = async () => {
            await requestNotificationPermission();
            await testNotification(); // Test notification to confirm setup
            await scheduleDailyFaceScanReminder(); // Schedule daily at 8:00 AM
        };

        setupNotifications();

        if (!auth.currentUser) {
            console.log('No authenticated user, redirecting to LoginScreen');
            router.replace('/screens/LoginScreen');
            return;
        }
        setIsReady(true);
    }, []);

    if (!isReady) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Profile Screen</Text>
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'profile' && styles.activeTabButton]}
                    onPress={() => setActiveTab('profile')}
                >
                    <Text style={styles.tabButtonText}>Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'updates' && styles.activeTabButton]}
                    onPress={() => setActiveTab('updates')}
                >
                    <Text style={styles.tabButtonText}>Regular Updates</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.card}>
                {activeTab === 'profile' ? (
                    <UserProfileScreen />
                ) : (
                    <RegularUpdatesScreen />
                )}
            </View>
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
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    tabButton: {
        backgroundColor: colors.cardBackground,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.inactiveTint,
    },
    activeTabButton: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    tabButtonText: {
        color: colors.text,
        fontSize: 16,
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
        flex: 1,
    },
    loadingText: {
        color: colors.text,
        fontSize: 16,
        textAlign: 'center',
    },
});

export default ProfileScreen;