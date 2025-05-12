import React from 'react';
import { View, TouchableOpacity, Text, Animated, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { usePathname } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons'; // Install: npm install @expo/vector-icons
import { useColorScheme } from 'react-native';

// Install dependencies if not already present:
// npm install @expo/vector-icons react-native-reanimated

interface TabBarProps {
    state: { index: number; routes: { name: string }[] };
    navigation: any;
}

export function BottomNav({ state, navigation }: TabBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const colorScheme = useColorScheme();
    const fadeAnim = new Animated.Value(0); // For animation

    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [state.index]);

    const tabs = [
        { name: 'index', label: 'Home', icon: 'home' },
        { name: 'explore', label: 'Explore', icon: 'search' },
        { name: 'profile', label: 'Profile', icon: 'user' },
        { name: 'settings', label: 'Settings', icon: 'cog' },
    ];

    const isDarkMode = colorScheme === 'dark';
    const backgroundColor = isDarkMode ? '#1F2937' : '#FFF2F2';
    const activeColor = '#7886C7';
    const inactiveColor = isDarkMode ? '#A9B5DF' : '#2D336B';
    const borderColor = isDarkMode ? '#4B5563' : '#A9B5DF';

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: backgroundColor,
                    borderTopColor: borderColor,
                    opacity: fadeAnim,
                },
            ]}
        >
            {tabs.map((tab, index) => {
                const isFocused = state.index === index;
                return (
                    <TouchableOpacity
                        key={tab.name}
                        style={styles.tab}
                        onPress={() => {
                            const routes: Record<string, string> = {
                                index: '/(tabs)/screens/Home',
                                explore: '/(tabs)/screens/explore',
                                profile: '/(tabs)/screens/profile',
                                settings: '/(tabs)/screens/settings',
                            };
                            router.push(routes[tab.name] as any); // Type assertion as workaround
                        }}
                    >
                        <FontAwesome
                            name={tab.icon as any}
                            size={24}
                            color={isFocused ? activeColor : inactiveColor}
                        />
                        <Text
                            style={[
                                styles.label,
                                {
                                    color: isFocused ? activeColor : inactiveColor,
                                    fontWeight: isFocused ? '600' : '400',
                                },
                            ]}
                        >
                            {tab.label}
                        </Text>
                        {isFocused && (
                            <View style={[styles.activeIndicator, { backgroundColor: activeColor }]} />
                        )}
                    </TouchableOpacity>
                );
            })}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 8,
        borderTopWidth: 1,
        elevation: 8, // Shadow for Android
        shadowColor: '#000', // Shadow for iOS
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    tab: {
        alignItems: 'center',
        padding: 6,
    },
    label: {
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
    activeIndicator: {
        position: 'absolute',
        bottom: -2,
        height: 2,
        width: '60%',
        borderRadius: 1,
    },
});