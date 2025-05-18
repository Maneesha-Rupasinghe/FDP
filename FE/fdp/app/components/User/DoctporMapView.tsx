import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { auth } from '../../firebase/firebase';
import { colors } from '../../config/colors';

interface Doctor {
    _id: string;
    first_name: string;
    last_name: string;
    contact_no?: string;
    latitude: number;
    longitude: number;
}

const DoctorMapView = () => {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

    const initialRegion = {
        latitude: 7.8731,
        longitude: 80.7718,
        latitudeDelta: 8.0,
        longitudeDelta: 8.0,
    };

    useEffect(() => {
        const fetchDoctors = async () => {
            setLoading(true);
            try {
                const response = await fetch(`http://192.168.1.4:8000/auth/search/doctors?page=1&limit=100`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log('Fetched doctors data:', data);
                    const filteredDoctors = data.doctors
                        .filter((doctor: any) => doctor.latitude && doctor.longitude)
                        .map((doctor: any) => ({
                            _id: doctor._id || `temp-${doctor.firebase_uid}`,
                            first_name: doctor.first_name || 'Unknown',
                            last_name: doctor.last_name || '',
                            contact_no: doctor.contact_no || 'N/A',
                            latitude: parseFloat(doctor.latitude),
                            longitude: parseFloat(doctor.longitude),
                        }));
                    setDoctors(filteredDoctors);
                } else {
                    console.error('Failed to fetch doctors:', await response.text());
                }
            } catch (error: any) {
                console.error('Error fetching doctors:', error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDoctors();
    }, []);

    const handleMarkerPress = (doctor: Doctor) => {
        console.log('Marker pressed:', doctor);
        setSelectedDoctor(doctor);
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <Text style={styles.loadingText}>Loading doctors...</Text>
            ) : (
                <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        initialRegion={initialRegion}
                        onPress={() => setSelectedDoctor(null)}
                    >
                        {doctors.map((doctor) => (
                            <Marker
                                key={doctor._id}
                                coordinate={{ latitude: doctor.latitude, longitude: doctor.longitude }}
                                title={doctor.first_name + ' ' + doctor.last_name}
                                onPress={() => handleMarkerPress(doctor)}
                            >
                                <Callout style={styles.callout}>
                                    <Text style={styles.calloutText}>Dr. {doctor.first_name} {doctor.last_name}</Text>
                                    <Text style={styles.calloutText}>Contact: {doctor.contact_no}</Text>
                                </Callout>
                            </Marker>
                        ))}
                    </MapView>
                    {selectedDoctor && (
                        <View style={styles.customCallout}>
                            <Text style={styles.calloutText}>Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}</Text>
                            <Text style={styles.calloutText}>Contact: {selectedDoctor.contact_no}</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 16,
    },
    mapContainer: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    map: {
        width: '100%',
        height: 300, // Fixed height to ensure map visibility
    },
    loadingText: {
        fontSize: 18,
        color: colors.text,
        textAlign: 'center',
    },
    callout: {
        padding: 10,
        backgroundColor: colors.cardBackground,
        borderRadius: 8,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        maxWidth: 200,
    },
    customCallout: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: colors.cardBackground,
        padding: 12,
        borderRadius: 8,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    calloutText: {
        fontSize: 14,
        color: colors.text,
        marginBottom: 4,
    },
});

export default DoctorMapView;