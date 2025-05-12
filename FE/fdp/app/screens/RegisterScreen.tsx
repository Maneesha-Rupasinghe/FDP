import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';

const RegisterScreen = () => {
  const router = useRouter();
  const [role, setRole] = useState<'regular' | 'doctor'>('regular');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [doctorRegNo, setDoctorRegNo] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

  // Handle the registration logic (placeholder)
  const handleRegister = () => {
    setIsLoading(true);
    if (!email || !username || !password) {
      showSnackbar('All fields are required', 'error');
    } else if (role === 'doctor' && !doctorRegNo) {
      showSnackbar('Doctor Registration Number is required', 'error');
    } else {
      showSnackbar('Registration placeholder (connect to FastAPI later)', 'success');
      router.replace('/screens/LoginScreen');
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
    return role === 'doctor'
      ? require('../assets/images/doctor.webp') // Reuse vet image for doctor
      : require('../assets/images/patient.png'); // Default for regular user
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: '#FFF2F2' }} showsVerticalScrollIndicator={false}>
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
          <Text className="text-4xl font-extrabold text-[#2D336B] text-center">Register</Text>
        </View>

        {/* Toggle between Regular User and Doctor */}
        <View className="flex flex-row mt-4">
          <TouchableOpacity
            onPress={() => setRole('regular')}
            className={`px-4 py-2 rounded-l-md ${role === 'regular' ? 'bg-[#7886C7]' : 'bg-[#A9B5DF]'}`}
          >
            <Text className={`text-white ${role === 'regular' ? 'font-bold' : ''}`}>Regular User</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setRole('doctor')}
            className={`px-4 py-2 rounded-r-md ${role === 'doctor' ? 'bg-[#7886C7]' : 'bg-[#A9B5DF]'}`}
          >
            <Text className={`text-white ${role === 'doctor' ? 'font-bold' : ''}`}>Doctor</Text>
          </TouchableOpacity>
        </View>

        {/* Email Input Field */}
        <View className="mt-6 w-full">
          <Text className="text-lg text-[#2D336B] mb-2">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#888"
            className="border border-[#A9B5DF] rounded-lg py-3 px-4 w-full text-lg bg-white shadow-sm"
          />
        </View>

        {/* Username Input Field */}
        <View className="mt-6 w-full">
          <Text className="text-lg text-[#2D336B] mb-2">Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
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

        {/* Doctor Registration Number Input (if Doctor role is selected) */}
        {role === 'doctor' && (
          <View className="mt-6 w-full">
            <Text className="text-lg text-[#2D336B] mb-2">Doctor Reg Number</Text>
            <TextInput
              value={doctorRegNo}
              onChangeText={setDoctorRegNo}
              placeholder="Doctor Registration Number"
              placeholderTextColor="#888"
              className="border border-[#A9B5DF] rounded-lg py-3 px-4 w-full text-lg bg-white shadow-sm"
            />
          </View>
        )}

        {/* Register Button */}
        <TouchableOpacity
          onPress={handleRegister}
          className={`mt-8 bg-[#7886C7] p-4 w-full rounded-lg items-center ${isLoading ? 'opacity-50' : ''}`}
          disabled={isLoading}
        >
          <Text className="text-white text-lg font-semibold">
            {isLoading ? 'Registering...' : 'Register'}
          </Text>
        </TouchableOpacity>

        <View className="flex flex-row justify-center mt-4 gap-x-2">
          <Text className="text-[#2D336B]">Already have an account?</Text>
          <Link className="text-[#7886C7] font-semibold" href={'/screens/LoginScreen'}>
            Sign In
          </Link>
        </View>
      </View>

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
    </ScrollView>
  );
};

export default RegisterScreen;