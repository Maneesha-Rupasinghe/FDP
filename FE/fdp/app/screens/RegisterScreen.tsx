import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../config/colors';

const RegisterScreen = ({ navigation }: any) => {
    const router = useRouter();
    const [role, setRole] = useState<'user' | 'doctor'>('user');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [medicalLicenseNo, setMedicalLicenseNo] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

    const firestore = getFirestore();

    useFocusEffect(
        React.useCallback(() => {
            setEmail('');
            setUsername('');
            setPassword('');
            setMedicalLicenseNo('');
            setRole('user');
            setIsPasswordVisible(false);
        }, [])
    );

    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleRegister = async () => {
        setIsLoading(true);
        const trimmedEmail = email.trim();
        const trimmedUsername = username.trim();
        const trimmedPassword = password.trim();

        if (!trimmedEmail || !trimmedUsername || !trimmedPassword) {
            showSnackbar('All fields are required', 'error');
            setIsLoading(false);
            return;
        }

        if (!isValidEmail(trimmedEmail)) {
            showSnackbar('Please enter a valid email address', 'error');
            setIsLoading(false);
            return;
        }

        if (role === 'doctor' && !medicalLicenseNo.trim()) {
            showSnackbar('Medical License Number is required for Doctor role', 'error');
            setIsLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
            const user = userCredential.user;
            const normalizedFirebaseUid = user.uid.trim();
            console.log('Firebase UID:', normalizedFirebaseUid);

            await setDoc(doc(firestore, 'users', user.uid), {
                email: user.email,
                username: trimmedUsername,
                role: role,
                ...(role === 'doctor' && { medicalLicenseNo: medicalLicenseNo.trim() }),
            });

            try {
                console.log('Sending request to MongoDB:', {
                    username: trimmedUsername,
                    email: user.email,
                    role,
                    firebase_uid: normalizedFirebaseUid,
                    ...(role === 'doctor' && { doctor_reg_no: medicalLicenseNo.trim() }),
                });
                const response = await fetch('http://192.168.1.4:8000/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: trimmedUsername,
                        email: user.email,
                        role,
                        firebase_uid: normalizedFirebaseUid,
                        ...(role === 'doctor' && { doctor_reg_no: medicalLicenseNo.trim() }),
                    }),
                });
                console.log('Response status:', response.status);
                const responseData = await response.json();
                console.log('Response data:', responseData);
                if (!response.ok) {
                    await user.delete();
                    throw new Error(responseData.detail || 'Failed to save data to MongoDB');
                }
            } catch (mongoError: any) {
                console.error('MongoDB save error:', mongoError);
                await user.delete();
                showSnackbar(`Failed to save data to MongoDB: ${mongoError.message}`, 'error');
                setIsLoading(false);
                return;
            }

            showSnackbar('Registration Successful!', 'success');
            router.replace('/screens/LoginScreen');
        } catch (error: any) {
            console.error('Registration error:', error.message);
            showSnackbar(`Error during registration: ${error.message}`, 'error');
        }

        setIsLoading(false);
    };

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const showSnackbar = (message: string, type: 'success' | 'error') => {
        setSnackbarMessage(message);
        setSnackbarType(type);
        setSnackbarVisible(true);
    };

    const getRoleImage = () => {
        if (role === 'doctor') {
            return require('../../assets/images/doctor.webp');
        } else {
            return require('../../assets/images/patient.png');
        }
    };

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
            <View style={{ padding: 16, alignItems: 'center' }}>
                <View style={{ width: '100%', marginTop: 20 }}>
                    <Image
                        source={getRoleImage()}
                        style={{ width: '100%', height: 220, borderRadius: 12, overflow: 'hidden' }}
                    />
                </View>
                <View style={{ marginTop: 30 }}>
                    <Text style={{ fontSize: 36, fontWeight: 'bold', color: colors.text, textAlign: 'center' }}>Register</Text>
                </View>
                <View style={{ flexDirection: 'row', marginTop: 20 }}>
                    <TouchableOpacity
                        onPress={() => setRole('user')}
                        style={{ padding: 12, borderTopLeftRadius: 8, borderBottomLeftRadius: 8, backgroundColor: role === 'user' ? colors.primary : '#DDD' }}
                    >
                        <Text style={{ color: '#FFF', fontWeight: role === 'user' ? 'bold' : 'normal' }}>User</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setRole('doctor')}
                        style={{ padding: 12, borderTopRightRadius: 8, borderBottomRightRadius: 8, backgroundColor: role === 'doctor' ? colors.primary : '#DDD' }}
                    >
                        <Text style={{ color: '#FFF', fontWeight: role === 'doctor' ? 'bold' : 'normal' }}>Doctor</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ width: '90%', marginTop: 20, backgroundColor: colors.cardBackground, borderRadius: 12, padding: 16, elevation: 3 }}>
                    <View style={{ marginBottom: 15 }}>
                        <Text style={{ fontSize: 16, color: colors.text, marginBottom: 5 }}>Email</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Email"
                            placeholderTextColor={colors.inactiveTint}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={{ borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, fontSize: 16, backgroundColor: '#FFF' }}
                        />
                    </View>
                    <View style={{ marginBottom: 15 }}>
                        <Text style={{ fontSize: 16, color: colors.text, marginBottom: 5 }}>User Name</Text>
                        <TextInput
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Username"
                            placeholderTextColor={colors.inactiveTint}
                            style={{ borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, fontSize: 16, backgroundColor: '#FFF' }}
                        />
                    </View>
                    <View style={{ marginBottom: 15 }}>
                        <Text style={{ fontSize: 16, color: colors.text, marginBottom: 5 }}>Password</Text>
                        <View style={{ position: 'relative' }}>
                            <TextInput
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Enter your password"
                                placeholderTextColor={colors.inactiveTint}
                                secureTextEntry={!isPasswordVisible}
                                style={{ borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, fontSize: 16, backgroundColor: '#FFF', paddingRight: 40 }}
                            />
                            <TouchableOpacity
                                onPress={togglePasswordVisibility}
                                style={{ position: 'absolute', right: 10, top: '50%', transform: [{ translateY: -10 }] }}
                            >
                                <Icon
                                    name={isPasswordVisible ? 'eye-off' : 'eye'}
                                    size={20}
                                    color={colors.inactiveTint}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                    {role === 'doctor' && (
                        <View style={{ marginBottom: 15 }}>
                            <TextInput
                                value={medicalLicenseNo}
                                onChangeText={setMedicalLicenseNo}
                                placeholder="Medical License Number"
                                placeholderTextColor={colors.inactiveTint}
                                style={{ borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, fontSize: 16, backgroundColor: '#FFF' }}
                            />
                        </View>
                    )}
                    <TouchableOpacity
                        onPress={handleRegister}
                        style={{ marginTop: 20, backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center', elevation: 3, opacity: isLoading ? 0.5 : 1 }}
                        disabled={isLoading}
                    >
                        <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '600' }}>Register</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 15, marginBottom: 20 }}>
                    <Text style={{ color: colors.inactiveTint }}>Already have an account?</Text>
                    <Link href={'/screens/LoginScreen'} style={{ color: colors.primary, fontWeight: '600', marginLeft: 5 }}>Sign in</Link>
                </View>
            </View>
            <View style={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={Snackbar.DURATION_SHORT}
                    style={{ backgroundColor: snackbarType === 'success' ? colors.success : colors.error, borderRadius: 8, elevation: 3 }}
                >
                    <Text style={{ color: '#FFF' }}>{snackbarMessage}</Text>
                </Snackbar>
            </View>
        </ScrollView>
    );
};

export default RegisterScreen;