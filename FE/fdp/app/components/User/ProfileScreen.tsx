import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { auth } from '../../firebase/firebase';
import { signOut, deleteUser } from 'firebase/auth';
import { Link, useRouter } from 'expo-router';

const UserProfileScreen = () => {
    const router = useRouter();
    const user = auth.currentUser;
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [age, setAge] = useState('');
    const [contactNo, setContactNo] = useState('');
    const [address, setAddress] = useState('');
    const [skinType, setSkinType] = useState(''); // New state for skin type
    const [isLoading, setIsLoading] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

    // List of skin types for the dropdown
    const skinTypes = [
        { label: 'Select Skin Type', value: '' },
        { label: 'Normal', value: 'normal' },
        { label: 'Dry', value: 'dry' },
        { label: 'Oily', value: 'oily' },
        { label: 'Combination', value: 'combination' },
        { label: 'Sensitive', value: 'sensitive' },
    ];

    // Fetch user profile on mount
    useEffect(() => {
        if (!user) {
            showSnackbar('User not authenticated', 'error');
            router.replace('/screens/LoginScreen');
            return;
        }

        const fetchUserProfile = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`http://192.168.1.4:8000/auth/user/${user.uid}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    const responseData = await response.json();
                    setFirstName(responseData.first_name || '');
                    setLastName(responseData.last_name || '');
                    setAge(responseData.age ? String(responseData.age) : '');
                    setContactNo(responseData.contact_no || '');
                    setAddress(responseData.address || '');
                    setSkinType(responseData.skin_type || ''); // Fetch skin type
                }
            } catch (error: any) {
                console.error('Fetch profile error:', error.message);
            }
            setIsLoading(false);
        };

        fetchUserProfile();
    }, []);

    // Update user profile
    const handleUpdateProfile = async () => {
        if (!user) {
            showSnackbar('User not authenticated', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`http://192.168.1.4:8000/auth/user/${user.uid}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    age: age ? parseInt(age) : null,
                    contact_no: contactNo,
                    address,
                    skin_type: skinType, // Include skin type in the update
                }),
            });
            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData.detail || 'Failed to update profile');
            }
            showSnackbar('Profile updated successfully!', 'success');
        } catch (error: any) {
            console.error('Update profile error:', error.message);
            showSnackbar(`Failed to update profile: ${error.message}`, 'error');
        }
        setIsLoading(false);
    };

    // Sign out
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            showSnackbar('Signed out successfully', 'success');
            router.replace('/screens/LoginScreen');
        } catch (error: any) {
            console.error('Sign out error:', error.message);
            showSnackbar(`Failed to sign out: ${error.message}`, 'error');
        }
    };

    // Delete account
    const handleDeleteAccount = async () => {
        if (!user) {
            showSnackbar('User not authenticated', 'error');
            return;
        }

        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            const response = await fetch(`http://192.168.1.4:8000/auth/user/${user.uid}`, {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                            });
                            const responseData = await response.json();
                            if (!response.ok) {
                                throw new Error(responseData.detail || 'Failed to delete account from MongoDB');
                            }

                            await deleteUser(user);
                            showSnackbar('Account deleted successfully', 'success');
                            router.replace('/screens/LoginScreen');
                        } catch (error: any) {
                            console.error('Delete account error:', error.message);
                            showSnackbar(`Failed to delete account: ${error.message}`, 'error');
                        }
                        setIsLoading(false);
                    },
                },
            ]
        );
    };

    const showSnackbar = (message: string, type: 'success' | 'error') => {
        setSnackbarMessage(message);
        setSnackbarType(type);
        setSnackbarVisible(true);
    };

    return (
        <>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: '#FBF8EF' }} showsVerticalScrollIndicator={false}>
                <View className="flex flex-col items-center p-4">
                    <View className="mt-12">
                        <Text className="text-4xl font-extrabold text-[#3E4241] text-center">User Profile</Text>
                    </View>

                    <View className="mt-6 w-full">
                        <Text className="text-lg text-gray-700 mb-2">First Name</Text>
                        <TextInput
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="First Name"
                            placeholderTextColor="#888"
                            className="border border-gray-300 rounded-lg py-3 px-4 w-full text-lg bg-white shadow-sm"
                        />
                    </View>

                    <View className="mt-6 w-full">
                        <Text className="text-lg text-gray-700 mb-2">Last Name</Text>
                        <TextInput
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Last Name"
                            placeholderTextColor="#888"
                            className="border border-gray-300 rounded-lg py-3 px-4 w-full text-lg bg-white shadow-sm"
                        />
                    </View>

                    <View className="mt-6 w-full">
                        <Text className="text-lg text-gray-700 mb-2">Age</Text>
                        <TextInput
                            value={age}
                            onChangeText={setAge}
                            placeholder="Age"
                            placeholderTextColor="#888"
                            keyboardType="numeric"
                            className="border border-gray-300 rounded-lg py-3 px-4 w-full text-lg bg-white shadow-sm"
                        />
                    </View>

                    <View className="mt-6 w-full">
                        <Text className="text-lg text-gray-700 mb-2">Contact No</Text>
                        <TextInput
                            value={contactNo}
                            onChangeText={setContactNo}
                            placeholder="Contact No"
                            placeholderTextColor="#888"
                            keyboardType="phone-pad"
                            className="border border-gray-300 rounded-lg py-3 px-4 w-full text-lg bg-white shadow-sm"
                        />
                    </View>

                    {/* Skin Type Dropdown */}
                    <View className="mt-6 w-full">
                        <Text className="text-lg text-gray-700 mb-2">Skin Type</Text>
                        <View className="border border-gray-300 rounded-lg bg-white shadow-sm">
                            <Picker
                                selectedValue={skinType}
                                onValueChange={(itemValue) => setSkinType(itemValue)}
                                style={{
                                    height: Platform.OS === 'ios' ? 150 : 50,
                                    width: '100%',
                                }}
                            >
                                {skinTypes.map((type, index) => (
                                    <Picker.Item key={index} label={type.label} value={type.value} />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    <View className="mt-6 w-full">
                        <Text className="text-lg text-gray-700 mb-2">Address</Text>
                        <TextInput
                            value={address}
                            onChangeText={setAddress}
                            placeholder="Address"
                            placeholderTextColor="#888"
                            className="border border-gray-300 rounded-lg py-3 px-4 w-full text-lg bg-white shadow-sm"
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleUpdateProfile}
                        className="mt-8 bg-[#3674B5] p-4 w-full rounded-lg items-center"
                        disabled={isLoading}
                    >
                        <Text className="text-white text-lg font-semibold">Update Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleSignOut}
                        className="mt-4 bg-gray-500 p-4 w-full rounded-lg items-center"
                        disabled={isLoading}
                    >
                        <Text className="text-white text-lg font-semibold">Sign Out</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleDeleteAccount}
                        className="mt-4 bg-red-500 p-4 w-full rounded-lg items-center"
                        disabled={isLoading}
                    >
                        <Text className="text-white text-lg font-semibold">Delete Account</Text>
                    </TouchableOpacity>

                    {/* <View className="flex flex-row justify-center mt-4 gap-x-2">
                        <Link className="text-[#3674B5] font-semibold" href={'../HomeScreen'}>Back to Home</Link>
                    </View> */}
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

export default UserProfileScreen;