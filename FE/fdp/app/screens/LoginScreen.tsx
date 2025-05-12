import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';

const LoginScreen = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

    const handleLogin = () => {
        setIsLoading(true);
        if (!email || !password) {
            showSnackbar('Please enter email and password', 'error');
        } else {
            showSnackbar('Login placeholder (connect to FastAPI later)', 'success');
            // Simulate role (replace with API response later)
            const role: 'doctor' | 'regular' = 'regular' as 'doctor' | 'regular'; // Placeholder
            if (role === 'doctor') {
                router.replace('/(tabs)/DoctorHome');
            } else {
                router.replace('/(tabs)/UserHome');
            }
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

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: '#FFF2F2' }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Image Section */}
                <View className="justify-start items-center w-full mt-8">
                    <Image
                        source={require('../assets/images/login.jpeg')}
                        className="w-full h-48 rounded-lg object-cover shadow-md"
                    />
                </View>

                {/* Login Title Section */}
                <View className="mt-10">
                    <Text className="text-4xl font-extrabold text-[#2D336B] text-center">Login</Text>
                </View>

                {/* Email Input Field */}
                <View className="mt-8 w-full">
                    <Text className="text-lg text-[#2D336B] mb-2">Email</Text>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        placeholderTextColor="#888"
                        className="border border-[#A9B5DF] rounded-lg py-3 px-4 w-full text-lg bg-white shadow-sm"
                    />
                </View>

                {/* Password Input Field */}
                <View className="mt-6 w-full">
                    <Text className="text-lg text-[#2D336B] mb-2">Password</Text>
                    <View className="relative">
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter your password"
                            placeholderTextColor="#888"
                            secureTextEntry={!isPasswordVisible}
                            className="border border-[#A9B5DF] rounded-lg py-3 px-4 w-full text-lg bg-white shadow-sm"
                        />
                        <TouchableOpacity
                            onPress={togglePasswordVisibility}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                            <Icon
                                name={isPasswordVisible ? 'eye-off' : 'eye'}
                                size={20}
                                color="#2D336B"
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Login Button */}
                <TouchableOpacity
                    onPress={handleLogin}
                    className={`mt-10 bg-[#7886C7] p-4 w-full rounded-lg items-center shadow-lg ${isLoading ? 'opacity-50' : ''}`}
                    disabled={isLoading}
                >
                    <Text className="text-white text-lg font-semibold">
                        {isLoading ? 'Logging In...' : 'Login'}
                    </Text>
                </TouchableOpacity>

                {/* Register Link */}
                <View className="flex flex-row justify-center mt-6 gap-x-2">
                    <Text className="text-[#2D336B]">Don&apos;t have an account?</Text>
                    <Link className="text-[#7886C7] font-semibold" href={'/screens/RegisterScreen'}>
                        Register
                    </Link>
                </View>
            </ScrollView>

            {/* Snackbar for displaying success or error messages */}
            <View className="absolute bottom-5 left-0 right-0">
                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={Snackbar.DURATION_SHORT}
                    style={{
                        backgroundColor: snackbarType === 'success' ? '#4CAF50' : '#F44336',
                        borderRadius: 8,
                        padding: 10,
                        marginHorizontal: 10,
                    }}
                >
                    {snackbarMessage}
                </Snackbar>
            </View>
        </KeyboardAvoidingView>
    );
};

export default LoginScreen;