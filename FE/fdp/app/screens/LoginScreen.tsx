import React, { useState } from 'react';
import { View, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/Button';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleLogin = () => {
        // Simple validation (replace with actual API call to Django backend later)
        if (username === 'User' && password === 'Pass') {
            router.push('/(tabs)'); // Navigate to the default tab
        } else {
            Alert.alert('Error', 'Invalid credentials');
        }
    };

    return (
        <View className="flex-1 justify-center items-center p-4 bg-white dark:bg-gray-900">
            <TextInput
                className="w-full p-2 mb-4 border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />
            <TextInput
                className="w-full p-2 mb-4 border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <Button title="Login" onPress={handleLogin} className="w-full" />
        </View>
    );
}