import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { Snackbar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

const FaceDiseaseScanner = () => {
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [prediction, setPrediction] = useState<{ predicted_class: string; confidence: number } | null>(null);
    const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');
    const [loading, setLoading] = useState<boolean>(false);

    // Request camera and gallery permissions
    useEffect(() => {
        const requestPermissions = async () => {
            const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
            const galleryPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!cameraPerm.granted || !galleryPerm.granted) {
                Alert.alert(
                    'Permissions Required',
                    'Camera and gallery access are required to use this feature.',
                    [{ text: 'OK' }]
                );
            }
        };
        requestPermissions();
    }, []);

    // Pick image from gallery
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImageUri(result.assets[0].uri);
            setPrediction(null); // Reset prediction when a new image is selected
        }
    };

    // Capture image using camera
    const captureImage = async () => {
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImageUri(result.assets[0].uri);
            setPrediction(null); // Reset prediction when a new image is captured
        }
    };

    // Send image to backend for prediction
    const scanImage = async () => {
        if (!imageUri) {
            showSnackbar('Please select or capture an image first.', 'error');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', {
                uri: imageUri,
                name: 'face.jpg',
                type: 'image/jpeg',
            } as any);

            const response = await fetch('http://192.168.1.4:8000/api/predict/', {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to scan image');
            }

            const data = await response.json();
            setPrediction({
                predicted_class: data.predicted_class,
                confidence: data.confidence,
            });
            showSnackbar('Scan completed successfully!', 'success');
        } catch (error: any) {
            console.error('Scan error:', error.message);
            showSnackbar(`Error scanning image: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const showSnackbar = (message: string, type: 'success' | 'error') => {
        setSnackbarMessage(message);
        setSnackbarType(type);
        setSnackbarVisible(true);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Face Disease Scanner</Text>

            {/* Image Display */}
            {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
                <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>No Image Selected</Text>
                </View>
            )}

            {/* Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={pickImage} disabled={loading}>
                    <Text style={styles.buttonText}>Upload Image</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={captureImage} disabled={loading}>
                    <Text style={styles.buttonText}>Capture Photo</Text>
                </TouchableOpacity>
            </View>

            {/* Scan Button */}
            <TouchableOpacity style={[styles.scanButton, loading && styles.disabledButton]} onPress={scanImage} disabled={loading}>
                <Text style={styles.scanButtonText}>{loading ? 'Scanning...' : 'Scan Image'}</Text>
            </TouchableOpacity>

            {/* Prediction Result */}
            {prediction && (
                <View style={styles.resultContainer}>
                    <Text style={styles.resultText}>Predicted Condition: {prediction.predicted_class}</Text>
                    <Text style={styles.resultText}>Confidence: {(prediction.confidence * 100).toFixed(2)}%</Text>
                </View>
            )}

            {/* Snackbar */}
            <View style={styles.snackbarContainer}>
                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={Snackbar.DURATION_SHORT}
                    style={{
                        backgroundColor: snackbarType === 'success' ? 'green' : 'red',
                        borderRadius: 8,
                        padding: 10,
                        marginHorizontal: 10,
                    }}
                >
                    {snackbarMessage}
                </Snackbar>
            </View>
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
    image: {
        width: '100%',
        height: 300,
        borderRadius: 8,
        marginBottom: 16,
        resizeMode: 'contain',
    },
    placeholder: {
        width: '100%',
        height: 300,
        borderRadius: 8,
        backgroundColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    placeholderText: {
        fontSize: 16,
        color: '#3E4241',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#3674B5',
        padding: 12,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 5,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    scanButton: {
        backgroundColor: '#28a745',
        padding: 12,
        borderRadius: 8,
        alignSelf: 'center',
        marginBottom: 16,
    },
    disabledButton: {
        backgroundColor: '#A9A9A9',
    },
    scanButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    resultContainer: {
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 16,
    },
    resultText: {
        fontSize: 16,
        color: '#3E4241',
        marginBottom: 4,
    },
    snackbarContainer: {
        position: 'absolute',
        bottom: 5,
        left: 0,
        right: 0,
    },
});

export default FaceDiseaseScanner;