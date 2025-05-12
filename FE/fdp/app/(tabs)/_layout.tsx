import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import { useColorScheme } from '../../src/hooks/useColorScheme';
import { Colors } from '../../src/constants/Colors';
import { BottomNav } from '../../src/components/BottomNav';

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                headerShown: false,
                // Remove tabBar from screenOptions
            }}
            tabBar={(props) => <BottomNav {...props} />} // Move tabBar here
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ focused, color, size }) => (
                        <Text style={{ color, fontSize: size }}>{focused ? '🏠' : '🏠'}</Text>
                    ),
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Explore',
                    tabBarIcon: ({ focused, color, size }) => (
                        <Text style={{ color, fontSize: size }}>{focused ? '🔍' : '🔍'}</Text>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ focused, color, size }) => (
                        <Text style={{ color, fontSize: size }}>{focused ? '👤' : '👤'}</Text>
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ focused, color, size }) => (
                        <Text style={{ color, fontSize: size }}>{focused ? '⚙️' : '⚙️'}</Text>
                    ),
                }}
            />
        </Tabs>
    );
}