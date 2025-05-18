import { View, Text } from "react-native";
import { colors } from '../../config/colors';

const HomeScreen = () => {
    return (
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, color: colors.text, fontWeight: 'bold' }}>Home Screen for Vet</Text>
        </View>
    );
};

export default HomeScreen