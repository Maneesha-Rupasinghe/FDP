import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { Link, useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Feather';
import { BASE_URL } from "../config/config"

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

    // Handle the registration logic
    const handleRegister = async () => {
        setIsLoading(true);
        if (!email || !username || !password) {
            showSnackbar('All fields are required', 'error');
            setIsLoading(false);
            return;
        }

        if (role === 'doctor' && !medicalLicenseNo) {
            showSnackbar('Medical License Number is required for Doctor role', 'error');
            setIsLoading(false);
            return;
        }

        try {
            // Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Store user data and role in Firestore
            await setDoc(doc(firestore, 'users', user.uid), {
                email: user.email,
                username: username,
                role: role,
                ...(role === 'doctor' && { medicalLicenseNo }), // Include medicalLicenseNo for doctors
            });

            // Store username, email, role, and firebase_uid in MongoDB via FastAPI
            try {
                console.log('Sending request to MongoDB...');
                const response = await fetch(`${BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username,
                        email: user.email,
                        role,
                        firebase_uid: user.uid,
                        ...(role === 'doctor' && { doctor_reg_no: medicalLicenseNo }),
                    }),
                });
                console.log('Response status:', response.status);
                const responseData = await response.json();
                console.log('Response data:', responseData);
                if (!response.ok) {
                    throw new Error(responseData.detail || 'Failed to save data to MongoDB');
                }
            } catch (mongoError: any) {
                console.error('MongoDB save error:', mongoError.message);
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

    // Toggle password visibility
    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    // Function to show Snackbar messages
    const showSnackbar = (message: string, type: 'success' | 'error') => {
        setSnackbarMessage(message);
        setSnackbarType(type);
        setSnackbarVisible(true);
    };

    // Determine the image based on the selected role
    const getRoleImage = () => {
        if (role === 'doctor') {
            return require('../../assets/images/doctor.webp');
        } else {
            return require('../../assets/images/patient.png');
        }
    };

    return (
        <>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: '#FBF8EF' }} showsVerticalScrollIndicator={false}>
                <View className="flex flex-col items-center p-4">

                    {/* Image Section */}
                    <View className="justify-start items-center w-full mt-8">
                        <Image
                            source={getRoleImage()}
                            className="w-full h-52 rounded-lg object-cover shadow-md"
                        />
                    </View>

                    {/* Registration Title Section */}
                    <View className="mt-12">
                        <Text className="text-4xl font-extrabold text-[#3E4241] text-center">Register</Text>
                    </View>

                    {/* Toggle between User and Doctor */}
                    <View className="flex flex-row mt-4">
                        <TouchableOpacity
                            onPress={() => setRole('user')}
                            className={`px-4 py-2 rounded-l-md ${role === 'user' ? 'bg-[#3674B5]' : 'bg-gray-300'}`}
                        >
                            <Text className={`text-white ${role === 'user' ? 'font-bold' : ''}`}>User</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setRole('doctor')}
                            className={`px-4 py-2 rounded-r-md ${role === 'doctor' ? 'bg-[#3674B5]' : 'bg-gray-300'}`}
                        >
                            <Text className={`text-white ${role === 'doctor' ? 'font-bold' : ''}`}>Doctor</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Email Input Field */}
                    <View className="mt-6 w-full">
                        <Text className="text-lg text-gray-700 mb-2">Email</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Email"
                            placeholderTextColor="#888"
                            className="border border-gray-300 rounded-lg py-3 px-4 w-full text-lg bg-white shadow-sm"
                        />
                    </View>

                    {/* Username Input Field */}
                    <View className="mt-6 w-full">
                        <Text className="text-lg text-gray-700 mb-2">User Name</Text>
                        <TextInput
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Username"
                            placeholderTextColor="#888"
                            className="border border-gray-300 rounded-lg py-3 px-4 w-full text-lg bg-white shadow-sm"
                        />
                    </View>

                    {/* Password Input Field */}
                    <View className="mt-6 w-full">
                        <Text className="text-lg text-[#3E4241] mb-2">Password</Text>
                        <View className="relative">
                            <TextInput
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Enter your password"
                                placeholderTextColor="#888"
                                secureTextEntry={!isPasswordVisible}
                                className="border border-gray-300 rounded-lg py-3 px-4 w-full text-lg bg-white shadow-sm"
                            />
                            <TouchableOpacity
                                onPress={togglePasswordVisibility}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            >
                                <Icon
                                    name={isPasswordVisible ? 'eye-off' : 'eye'}
                                    size={20}
                                    color="gray"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Medical License Number Input (if Doctor role is selected) */}
                    {role === 'doctor' && (
                        <View className="mt-6 w-full">
                            <TextInput
                                value={medicalLicenseNo}
                                onChangeText={setMedicalLicenseNo}
                                placeholder="Medical License Number"
                                placeholderTextColor="#888"
                                className="border-b border-gray-300 py-2 px-3 w-full text-lg"
                            />
                        </View>
                    )}

                    {/* Register Button */}
                    <TouchableOpacity
                        onPress={handleRegister}
                        className="mt-8 bg-[#3674B5] p-4 w-full rounded-lg items-center"
                        disabled={isLoading}
                    >
                        <Text className="text-white text-lg font-semibold">Register</Text>
                    </TouchableOpacity>

                    <View className="flex flex-row justify-center mt-[12px] gap-x-2">
                        <Text>Already have an account?</Text>
                        <Link className="text-[#3674B5] font-semibold" href={'/screens/LoginScreen'}>Sign in</Link>
                    </View>

                </View>
            </ScrollView>
            <View className="absolute bottom-5 left-0 right-0">
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
        </>
    );
};

export default RegisterScreen;