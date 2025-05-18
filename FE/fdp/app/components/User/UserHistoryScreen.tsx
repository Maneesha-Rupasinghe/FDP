import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import UserAppointmentHistoryScreen from '../../components/User/UserAppointmentHistory';
import ChartsDashboard from '../../components/User/ChartsDashboard';
import { colors } from '../../config/colors';

const HistoryScreen = () => {
    const [activeTab, setActiveTab] = useState<'appointments' | 'charts'>('appointments');

    return (
        <View style={styles.container}>
            <Text style={styles.header}>History Screen</Text>
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'appointments' && styles.activeTabButton]}
                    onPress={() => setActiveTab('appointments')}
                >
                    <Text style={styles.tabButtonText}>Appointments</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'charts' && styles.activeTabButton]}
                    onPress={() => setActiveTab('charts')}
                >
                    <Text style={styles.tabButtonText}>Charts</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.card}>
                {activeTab === 'appointments' ? (
                    <UserAppointmentHistoryScreen />
                ) : (
                    <ChartsDashboard />
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
});

export default HistoryScreen;