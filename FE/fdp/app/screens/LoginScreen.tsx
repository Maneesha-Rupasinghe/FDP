import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
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
    const [isNavigating, setIsNavigating] = useState(false);

    const handleLogin = () => {
        setIsLoading(true);
        if (!email || !password) {
            showSnackbar('Please enter email and password', 'error');
        } else {
            showSnackbar('Login placeholder (connect to FastAPI later)', 'success');
            setTimeout(() => {
                router.replace('/screens/UserHome');
            }, 100);
        }
        setIsLoading(false);
    };

    const handleNavigateToRegister = () => {
        setIsNavigating(true);
        setTimeout(() => {
            router.replace('/screens/RegisterScreen');
            setIsNavigating(false);
        }, 100);
    };

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const showSnackbar = (message: string, type: 'success' | 'error') => {
        setSnackbarMessage(message);
        setSnackbarType(type);
        setSnackbarVisible(true);
    };

    if (isNavigating) {
        return (
            <View className="flex-1 justify-center items-center bg-[#FFF2F2]">
                <Text className="text-lg text-[#2D336B]">Loading...</Text>
            </View>
        );
    }

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
                <View className="justify-center items-center w-full mt-8">
                    <Image
                        source={require('../assets/images/login.jpeg')}
                        className="w-full h-72 rounded-lg object-contain shadow-md"
                        onError={(e) => console.log('Image error:', e.nativeEvent.error)}
                    />
                </View>

                <View className="mt-10">
                    <Text className="text-4xl font-extrabold text-[#2D336B] text-center">Login</Text>
                </View>

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

                <TouchableOpacity
                    onPress={handleLogin}
                    className={`mt-10 bg-[#7886C7] p-4 w-full rounded-lg items-center shadow-lg ${isLoading ? 'opacity-50' : ''}`}
                    disabled={isLoading}
                >
                    <Text className="text-white text-lg font-semibold">
                        {isLoading ? 'Logging In...' : 'Login'}
                    </Text>
                </TouchableOpacity>

                <View className="flex flex-row justify-center mt-6 gap-x-2">
                    <Text className="text-[#2D336B]">Don&apos;t have an account?</Text>
                    <TouchableOpacity onPress={handleNavigateToRegister}>
                        <Text className="text-[#7886C7] font-semibold">Register</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

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