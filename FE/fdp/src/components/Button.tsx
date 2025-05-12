import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

interface ButtonProps {
    title: string;
    onPress: () => void;
    className?: string;
}

export function Button({ title, onPress, className = '' }: ButtonProps) {
    return (
        <TouchableOpacity
            className={`bg-blue-500 p-3 rounded text-white ${className}`}
            onPress={onPress}
        >
            <Text className="text-white text-center font-bold">{title}</Text>
        </TouchableOpacity>
    );
}