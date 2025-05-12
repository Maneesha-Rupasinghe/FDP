import React from 'react';
import { View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-white dark:bg-gray-900">
      <Text className="text-2xl text-black dark:text-white">Welcome Home!</Text>
    </View>
  );
}