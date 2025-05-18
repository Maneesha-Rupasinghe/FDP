import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import UserAppointmentCalendar from '../../components/User/UserAppointmentCalendar';
import FaceDiseaseScanner from '../../components/User/FaceDiseasesScanner';
import ScanHistoryDashboard from '../../components/User/ScanHistoryDashboard';
import { colors } from '../../config/colors';

const HomeScreen = () => {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.header}>Home Dashboard</Text>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Appointment Calendar</Text>
                <UserAppointmentCalendar />
            </View>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Face Disease Scanner</Text>
                <FaceDiseaseScanner />
            </View>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Scan History</Text>
                <ScanHistoryDashboard />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 20,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 20,
    },
    card: {
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 10,
    },
});

export default HomeScreen;