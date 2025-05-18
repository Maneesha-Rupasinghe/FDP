import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform, Modal } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { auth } from '../../firebase/firebase';
import { signOut, deleteUser } from 'firebase/auth';
import { Link, useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../config/colors';

const DoctorProfileScreen = () => {
  const router = useRouter();
  const user = auth.currentUser;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [doctorRegNo, setDoctorRegNo] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [skinType, setSkinType] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const skinTypes = [
    { label: 'Select Skin Type', value: '' },
    { label: 'Normal', value: 'normal' },
    { label: 'Dry', value: 'dry' },
    { label: 'Oily', value: 'oily' },
    { label: 'Combination', value: 'combination' },
    { label: 'Sensitive', value: 'sensitive' },
  ];

  const initialRegion = {
    latitude: 7.8731,
    longitude: 80.7718,
    latitudeDelta: 4.0,
    longitudeDelta: 4.0,
  };

  useEffect(() => {
    if (!user) {
      showSnackbar('User not authenticated', 'error');
      router.replace('/screens/LoginScreen');
      return;
    }

    const fetchDoctorProfile = async () => {
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
          if (responseData.role !== 'doctor') {
            showSnackbar('Access denied: Not a doctor account', 'error');
            router.replace('/screens/LoginScreen');
            return;
          }
          setFirstName(responseData.first_name || '');
          setLastName(responseData.last_name || '');
          setContactNo(responseData.contact_no || '');
          setDoctorRegNo(responseData.doctor_reg_no || '');
          setSpecialization(responseData.specialization || '');
          setYearsExperience(responseData.years_experience ? String(responseData.years_experience) : '');
          setSkinType(responseData.skin_type || '');
          setLatitude(responseData.latitude ? String(responseData.latitude) : '');
          setLongitude(responseData.longitude ? String(responseData.longitude) : '');
          if (responseData.latitude && responseData.longitude) {
            setSelectedLocation({
              latitude: parseFloat(responseData.latitude),
              longitude: parseFloat(responseData.longitude),
            });
          }
        }
      } catch (error: any) {
        console.error('Fetch profile error:', error.message);
      }
      setIsLoading(false);
    };

    fetchDoctorProfile();
  }, []);

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
          contact_no: contactNo,
          specialization,
          years_experience: yearsExperience ? parseInt(yearsExperience) : null,
          skin_type: skinType,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
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

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    setLatitude(latitude.toFixed(6));
    setLongitude(longitude.toFixed(6));
  };

  const validateCoordinate = (value: string, setValue: (value: string) => void) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      setValue('');
    } else {
      setValue(num.toFixed(6));
    }
  };

  const showSnackbar = (message: string, type: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  return (
    <>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
        <View className="flex flex-col items-center p-4">
          <View className="mt-0">
             <Text className={`text-[24px] font-bold text-${colors.text} mb-[16px] text-center`}>Doctor Profile</Text>
          </View>

          <View className="mt-6 w-full">
            <Text className="text-lg text-gray-700 mb-2" style={{ color: colors.text }}>First Name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First Name"
              placeholderTextColor={colors.inactiveTint}
              className="border border-gray-300 rounded-lg py-3 px-4 w-full text-lg bg-white shadow-sm"
              style={{ borderColor: colors.inactiveTint, backgroundColor: colors.cardBackground }}
            />
          </View>

          <View className="mt-6 w-full">
            <Text className="text-lg text-gray-700 mb-2" style={{ color: colors.text }}>Last Name</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last Name"
              placeholderTextColor={colors.inactiveTint}
              className="border border-gray-300 rounded-lg py-3 px-4 w-full text-lg bg-white shadow-sm"
              style={{ borderColor: colors.inactiveTint, backgroundColor: colors.cardBackground }}
            />
          </View>

          <View className="mt-6 w-full">
            <Text className="text-lg text-gray-700 mb-2" style={{ color: colors.text }}>Contact No</Text>
            <TextInput
              value={contactNo}
              onChangeText={setContactNo}
              placeholder="Contact No"
              placeholderTextColor={colors.inactiveTint}
              keyboardType="phone-pad"
              className="border border-gray-300 rounded-lg py-3 px-4 w-full text-lg bg-white shadow-sm"
              style={{ borderColor: colors.inactiveTint, backgroundColor: colors.cardBackground }}
            />
          </View>

          <View className="mt-6 w-full">
            <Text className="text-lg text-gray-700 mb-2" style={{ color: colors.text }}>Doctor Registration No</Text>
            <TextInput
              value={doctorRegNo}
              editable={false}
              placeholder="Doctor Registration No"
              placeholderTextColor={colors.inactiveTint}
              className="border border-gray-300 rounded-lg py-3 px-4 w-full text-lg bg-gray-100 shadow-sm"
              style={{ borderColor: colors.inactiveTint, backgroundColor: colors.cardBackground }}
            />
          </View>

          <View className="mt-6 w-full">
            <Text className="text-lg text-gray-700 mb-2" style={{ color: colors.text }}>Specialization</Text>
            <TextInput
              value={specialization}
              onChangeText={setSpecialization}
              placeholder="Specialization (e.g., Dermatology)"
              placeholderTextColor={colors.inactiveTint}
              className="border border-gray-300 rounded-lg py-3 px-4 w-full text-lg bg-white shadow-sm"
              style={{ borderColor: colors.inactiveTint, backgroundColor: colors.cardBackground }}
            />
          </View>

          <View className="mt-6 w-full">
            <Text className="text-lg text-gray-700 mb-2" style={{ color: colors.text }}>Years of Experience</Text>
            <TextInput
              value={yearsExperience}
              onChangeText={setYearsExperience}
              placeholder="Years of Experience"
              placeholderTextColor={colors.inactiveTint}
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg py-3 px-4 w-full text-lg bg-white shadow-sm"
              style={{ borderColor: colors.inactiveTint, backgroundColor: colors.cardBackground }}
            />
          </View>

          <View className="mt-6 w-full">
            <Text className="text-lg text-gray-700 mb-2" style={{ color: colors.text }}>Latitude</Text>
            <TextInput
              value={latitude}
              onChangeText={(text) => setLatitude(text)}
              onBlur={() => validateCoordinate(latitude, setLatitude)}
              placeholder="Latitude (e.g., 6.9271)"
              placeholderTextColor={colors.inactiveTint}
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg py-3 px-4 w-full text-lg bg-white shadow-sm"
              style={{ borderColor: colors.inactiveTint, backgroundColor: colors.cardBackground }}
            />
          </View>

          <View className="mt-6 w-full">
            <Text className="text-lg text-gray-700 mb-2" style={{ color: colors.text }}>Longitude</Text>
            <TextInput
              value={longitude}
              onChangeText={(text) => setLongitude(text)}
              onBlur={() => validateCoordinate(longitude, setLongitude)}
              placeholder="Longitude (e.g., 79.8612)"
              placeholderTextColor={colors.inactiveTint}
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg py-3 px-4 w-full text-lg bg-white shadow-sm"
              style={{ borderColor: colors.inactiveTint, backgroundColor: colors.cardBackground }}
            />
          </View>

          <TouchableOpacity
            onPress={() => setMapModalVisible(true)}
            className="mt-6 bg-[#FF9800] p-4 w-full rounded-lg items-center"
            style={{ backgroundColor: colors.secondary }}
          >
            <Text className="text-white text-lg font-semibold">Set Location on Map</Text>
          </TouchableOpacity>

          <Modal
            animationType="fade"
            transparent={true}
            visible={mapModalVisible}
            onRequestClose={() => setMapModalVisible(false)}
          >
            <View className="flex-1 bg-black bg-opacity-50 justify-center items-center">
              <View className="bg-white rounded-lg p-4 w-[90%] h-[70%] shadow-lg">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-xl font-bold text-[#3E4241]" style={{ color: colors.text }}>Pin Your Location</Text>
                  <TouchableOpacity onPress={() => setMapModalVisible(false)}>
                    <Icon name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <MapView
                  style={{ flex: 1, borderRadius: 8 }}
                  initialRegion={initialRegion}
                  onPress={handleMapPress}
                >
                  {selectedLocation && (
                    <Marker coordinate={selectedLocation} title="Your Location" />
                  )}
                </MapView>
                <TouchableOpacity
                  onPress={() => setMapModalVisible(false)}
                  className="mt-4 bg-[#3674B5] p-4 rounded-lg items-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-white text-lg font-semibold">Confirm Location</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <TouchableOpacity
            onPress={handleUpdateProfile}
            className="mt-8 bg-[#3674B5] p-4 w-full rounded-lg items-center"
            style={{ backgroundColor: colors.primary }}
            disabled={isLoading}
          >
            <Text className="text-white text-lg font-semibold">Update Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSignOut}
            className="mt-4 bg-gray-500 p-4 w-full rounded-lg items-center"
            style={{ backgroundColor: colors.inactiveTint }}
            disabled={isLoading}
          >
            <Text className="text-white text-lg font-semibold">Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteAccount}
            className="mt-4 bg-red-500 p-4 w-full rounded-lg items-center"
            style={{ backgroundColor: colors.error }}
            disabled={isLoading}
          >
            <Text className="text-white text-lg font-semibold">Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <View className="absolute bottom-5 left-0 right-0">
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={Snackbar.DURATION_SHORT}
          style={{
            backgroundColor: snackbarType === 'success' ? 'green' : colors.error,
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

export default DoctorProfileScreen;