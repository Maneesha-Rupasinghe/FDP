import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { usePathname } from 'expo-router';

interface TabBarProps {
    state: { index: number; routes: { name: string }[] };
    navigation: any;
}

export function BottomNav({ state, navigation }: TabBarProps) {
    const router = useRouter();
    const pathname = usePathname();

    const tabs = [
        { name: 'index', label: 'Home', icon: '🏠' },
        { name: 'explore', label: 'Explore', icon: '🔍' },
        { name: 'profile', label: 'Profile', icon: '👤' },
        { name: 'settings', label: 'Settings', icon: '⚙️' },
    ];

    return (
        <View className="flex-row justify-around items-center bg-white dark:bg-gray-900 p-2 border-t border-gray-200 dark:border-gray-700">
            {tabs.map((tab, index) => (
                <TouchableOpacity
                    key={tab.name}
                    className={`p-2 ${state.index === index ? 'text-blue-500' : 'text-gray-500'}`}
                    onPress={() => {
                        // Use a type-safe approach by mapping tab.name to exact routes
                        const routes: Record<string, string> = {
                            index: '/(tabs)/index',
                            explore: '/(tabs)/explore',
                            profile: '/(tabs)/profile',
                            settings: '/(tabs)/settings',
                        };
                        router.push(routes[tab.name] as any); // Type assertion as a workaround
                    }}
                >
                    <Text className="text-xl">{tab.icon}</Text>
                    <Text className="text-xs">{tab.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}