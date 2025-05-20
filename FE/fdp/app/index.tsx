import { View } from 'react-native';
import React, { useState } from 'react';
import RegisterScreen from './screens/RegisterScreen';
import IntroVideo from './screens/IntroVideo'; // Make sure path is correct
import '../global.css';

const Index = () => {
    const [showIntro, setShowIntro] = useState(true);

    const handleIntroFinish = () => {
        setShowIntro(false);
    };

    return (
        <View className="flex-1">
            {showIntro ? (
                <IntroVideo onFinish={handleIntroFinish} />
            ) : (
                <View className="">
                    <RegisterScreen />
                </View>
            )}
        </View>
    );
};

export default Index;
