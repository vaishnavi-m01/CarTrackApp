import React, { useEffect } from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/MainNavigator';
import { useAuth } from '../context/AuthContext';

type SplashNavProp = StackNavigationProp<RootStackParamList, 'Splash'>;

type Props = {
    navigation: SplashNavProp;
};

const SplashScreen = ({ navigation }: Props) => {
    const { setHasSeenSplash } = useAuth();

    useEffect(() => {
        const timer = setTimeout(() => {
            setHasSeenSplash(true);
            navigation.replace('Login');
        }, 1500); // Reduced slightly for smoother transition

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <ImageBackground
                source={require('../assets/Splash.png')}
                style={styles.background}
                resizeMode="cover"
            />
        </View>
    );
};

export default SplashScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    background: {
        width: '100%',
        height: '100%',
    },
});
