import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import SearchDoctorsScreen from '../../components/User/DoctorList';
import DoctorMapView from '../../components/User/DoctporMapView';
// import AppointmentRequest from '../../components/User/AppointmentScreen';
import { colors } from '../../config/colors';

const AppointmentsScreen = () => {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.header}>Appointments Dashboard</Text>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Search Doctors</Text>
                <SearchDoctorsScreen />
            </View>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Doctor Map View</Text>
                <DoctorMapView />
            </View>
            {/* <View style={styles.card}>
                <Text style={styles.cardTitle}>Appointment Request</Text>
                <AppointmentRequest />
            </View> */}
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
        fontSize: 24,
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

export default AppointmentsScreen;