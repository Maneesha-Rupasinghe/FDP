import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import ProfileScreen from '../components/Doctor/ProfileScreen';
import VetAppointments from '../components/Doctor/AppointmentScreen';
import DoctorChatListScreen from '../components/Doctor/DoctorChatListScreen';
import { colors } from '../config/colors';

const Tab = createBottomTabNavigator();

const VetHome = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 0,
          elevation: 8,
          shadowOpacity: 0.1,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingVertical: 10,
          height: 70,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inactiveTint,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
          marginBottom: 5,
        },
        tabBarIconStyle: {
          marginTop: 5,
        },
        headerStyle: {
          backgroundColor: colors.primary, // Changed app bar background color to primary
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontSize: 32,
          fontWeight: 'bold',
          color: '#FFF', // Changed text color to white for contrast with primary background
          textTransform: 'uppercase',
          textDecorationLine: 'underline', // Underline the header text
        },
        headerTitleContainerStyle: {
          paddingHorizontal: 16,
          paddingTop: 10,
        },
      }}
    >
      <Tab.Screen
        name="Appointments"
        component={VetAppointments}
        options={{
          tabBarLabel: 'Appointments',
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar" size={size + 4} color={color} />
          ),
          headerTitle: 'Home ',
          headerTitleStyle: {
            fontSize: 28,
            fontWeight: 'bold',
            color: '#FFF', // Ensure contrast with new background
            textTransform: 'uppercase',
            letterSpacing: 2,
            textDecorationLine: 'underline', // Underline per screen (optional override)
          },
        }}
      />
      <Tab.Screen
        name="Chat"
        component={DoctorChatListScreen}
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Icon name="message-square" size={size + 4} color={color} />
          ),
          headerTitle: 'Chat ',
          headerTitleStyle: {
            fontSize: 28,
            fontWeight: 'bold',
            color: '#FFF', // Ensure contrast with new background
            textTransform: 'uppercase',
            letterSpacing: 2,
            textDecorationLine: 'underline', // Underline per screen (optional override)
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="user" size={size + 4} color={color} />
          ),
          headerTitle: 'Profile ',
          headerTitleStyle: {
            fontSize: 28,
            fontWeight: 'bold',
            color: '#FFF', // Ensure contrast with new background
            textTransform: 'uppercase',
            letterSpacing: 2,
            textDecorationLine: 'underline', // Underline per screen (optional override)
          },
        }}
      />
    </Tab.Navigator>
  );
};

export default VetHome;