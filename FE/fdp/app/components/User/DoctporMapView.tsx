import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { auth } from '../../firebase/firebase';

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
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null); // State for custom callout

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
                    headers: {
                        'Content-Type': 'application/json',
                    },
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
        setSelectedDoctor(doctor); // Show custom callout
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <Text style={styles.loadingText}>Loading doctors...</Text>
            ) : (
                <>
                    <MapView
                        style={styles.map}
                        initialRegion={initialRegion}
                        onPress={() => {
                            console.log('Map pressed');
                            setSelectedDoctor(null); // Hide custom callout when tapping outside
                        }}
                    >
                        {doctors.map((doctor) => (
                            <Marker
                                key={doctor._id}
                                coordinate={{
                                    latitude: doctor.latitude,
                                    longitude: doctor.longitude,
                                }}
                                title={doctor.first_name + ' ' + doctor.last_name}
                                onPress={() => handleMarkerPress(doctor)}
                            >
                                {/* Attempt native Callout */}
                                <Callout tooltip style={styles.callout}>
                                    <Text style={styles.calloutText}>Dr. {doctor.first_name} {doctor.last_name}</Text>
                                    <Text style={styles.calloutText}>Contact: {doctor.contact_no}</Text>
                                </Callout>
                            </Marker>
                        ))}
                    </MapView>

                    {/* Custom Callout Overlay */}
                    {selectedDoctor && (
                        <View style={styles.customCallout}>
                            <Text style={styles.calloutText}>Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}</Text>
                            <Text style={styles.calloutText}>Contact: {selectedDoctor.contact_no}</Text>
                        </View>
                    )}
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height - 100,
    },
    loadingText: {
        fontSize: 18,
        color: '#3E4241',
        textAlign: 'center',
    },
    callout: {
        padding: 10,
        backgroundColor: '#FFF',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        maxWidth: 200,
        minHeight: 60,
    },
    customCallout: {
        position: 'absolute',
        bottom: 120, // Position above the map's bottom edge
        backgroundColor: '#FFF',
        padding: 10,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        width: Dimensions.get('window').width - 40,
        marginHorizontal: 20,
    },
    calloutText: {
        fontSize: 14,
        color: '#3E4241',
        marginBottom: 4,
    },
});

export default DoctorMapView;