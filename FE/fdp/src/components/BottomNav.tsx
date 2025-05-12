import React from 'react';
import { View, TouchableOpacity, Text, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { usePathname } from 'expo-router';
import Icon from 'react-native-vector-icons/Feather';

interface TabBarProps {
    state: { index: number; routes: { name: string }[] };
    navigation: any;
}

export function BottomNav({ state, navigation }: TabBarProps) {
    const router = useRouter();
    const pathname = usePathname();

    const tabs = [
        { name: 'index', label: 'Home', icon: 'home', route: '/screens/Home' },
        { name: 'explore', label: 'Explore', icon: 'search', route: '/screens/explore' },
        { name: 'profile', label: 'Profile', icon: 'user', route: '/screens/profile' },
        { name: 'settings', label: 'Settings', icon: 'settings', route: '/screens/settings' },
        // { name: 'doctor', label: 'Doctor', icon: 'user-md', route: '/screens/DoctorHome' },
        // { name: 'user', label: 'User', icon: 'user', route: '/screens/UserHome' },
    ];

    const activeTab = tabs.findIndex(tab => pathname === tab.route);

    return (
        <View className="absolute bottom-0 left-0 right-0 z-50 pb-2 px-2">
            <View className="flex-row justify-around items-center bg-[#FFF2F2] dark:bg-[#27548A] py-3 px-2 mx-2 rounded-3xl shadow-2xl">
                {tabs.map((tab, index) => {
                    const isActive = activeTab === index;

                    return (
                        <TouchableOpacity
                            key={tab.name}
                            className="flex items-center justify-center"
                            onPress={() => {
                                router.push(tab.route as any);
                            }}
                        >
                            <View
                                className={`
                  p-3 rounded-full transition-all duration-300 ease-in-out
                  ${isActive ? `bg-opacity-20` : 'bg-opacity-0'}
                `}
                                style={{
                                    backgroundColor: isActive ? `#7886C720` : 'transparent',
                                }}
                            >
                                <Icon
                                    name={tab.icon}
                                    size={24}
                                    color={isActive ? '#7886C7' : '#A9B5DF'}
                                    style={{
                                        transform: [{ scale: isActive ? 1.1 : 1 }],
                                    }}
                                />
                            </View>
                            {isActive && (
                                <View
                                    className="absolute -bottom-1 w-1 h-1 rounded-full"
                                    style={{ backgroundColor: '#7886C7' }}
                                />
                            )}
                            <Text
                                className={`text-xs mt-1 transition-all duration-300 ease-in-out text-[${isActive ? '#7886C7' : '#A9B5DF'}] ${isActive
                                    ? 'font-bold'
                                    : 'font-normal text-gray-500'
                                    }`}
                                style={{
                                    color: isActive ? '#7886C7' : '#A9B5DF',
                                }}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}