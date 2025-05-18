import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import { Snackbar } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../config/colors';

const LoginScreen = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

    const handleLogin = async () => {
        setIsLoading(true);
        const trimmedEmail = email.trim();
        console.log('Attempting login with email:', trimmedEmail);

        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        const isEmailValid = emailRegex.test(trimmedEmail);
        console.log('Email validation result:', isEmailValid);

        if (!isEmailValid) {
            showSnackbar('Invalid email! Please re-enter email', 'error');
            setIsLoading(false);
            return;
        }
        if (password.length < 6) {
            showSnackbar('Password must be at least 6 characters long', 'error');
            setIsLoading(false);
            return;
        }

        const user = await loginWithEmailPassword(trimmedEmail, password);
        if (user) {
            const userId = user.uid;
            const userRole = await checkUserRole(userId);
            console.log("User Role:", userRole);

            if (userRole === 'doctor') {
                console.log("Doctor Home");
                router.replace('/screens/DoctorHome');
            } else {
                console.log("Owner Home");
                router.replace('/screens/OwnerHome');
            }
        }

        setIsLoading(false);
    };

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const loginWithEmailPassword = async (email: string, password: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            console.log("Login successful:", user);
            showSnackbar('Login Successful!', 'success');

            return user;
        } catch (error: any) {
            console.error("Error signing in:", error.message);
            showSnackbar('Login Failed. Invalid email or password', 'error');
            return null;
        }
    };

    const checkUserRole = async (userId: string): Promise<string | null> => {
        try {
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const role = userData.role as string | undefined;

                if (role) {
                    return role;
                } else {
                    throw new Error('Role not found in user document');
                }
            } else {
                throw new Error('User document does not exist');
            }
        } catch (error: any) {
            console.error('Error fetching user role:', error.message);
            showSnackbar(`Error fetching user role: ${error.message}`, 'error');
            return null;
        }
    };

    const showSnackbar = (message: string, type: 'success' | 'error') => {
        setSnackbarMessage(message);
        setSnackbarType(type);
        setSnackbarVisible(true);
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                <ScrollView
                    contentContainerStyle={{ padding: 16, paddingBottom: 100, alignItems: 'center' }}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={{ width: '100%', marginTop: 20 }}>
                        <Image
                            source={require('../../assets/images/login.jpg')}
                            style={{ width: '100%', height: 200, borderRadius: 12, overflow: 'hidden' }}
                        />
                    </View>
                    <View style={{ marginTop: 30 }}>
                        <Text style={{ fontSize: 36, fontWeight: 'bold', color: colors.text, textAlign: 'center' }}>Login</Text>
                    </View>
                    <View style={{ width: '90%', marginTop: 20, backgroundColor: colors.cardBackground, borderRadius: 12, padding: 16, elevation: 3 }}>
                        <View style={{ marginBottom: 15 }}>
                            <Text style={{ fontSize: 16, color: colors.text, marginBottom: 5 }}>Email</Text>
                            <TextInput
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Enter your email"
                                placeholderTextColor={colors.inactiveTint}
                                style={{ borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, fontSize: 16, backgroundColor: '#FFF' }}
                                autoCapitalize="none"
                                keyboardType="email-address"
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
                        <TouchableOpacity
                            onPress={handleLogin}
                            style={{ marginTop: 20, backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center', elevation: 3, opacity: isLoading ? 0.5 : 1 }}
                            disabled={isLoading}
                        >
                            <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '600' }}>
                                {isLoading ? 'Logging In...' : 'Login'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 15, marginBottom: 20 }}>
                        <Text style={{ color: colors.inactiveTint }}>Don't have an account?</Text>
                        <Link href={'/screens/RegisterScreen'} style={{ color: colors.primary, fontWeight: '600', marginLeft: 5 }}>
                            Register
                        </Link>
                    </View>
                </ScrollView>
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
            </View>
        </KeyboardAvoidingView>
    );
};

export default LoginScreen;