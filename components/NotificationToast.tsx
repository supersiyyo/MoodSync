import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, Text, Dimensions } from 'react-native';
import Animated, { 
    useAnimatedStyle, 
    useSharedValue, 
    withSpring, 
    withSequence, 
    withDelay,
    withTiming
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CYAN = '#00F2FF';
const PURPLE = '#BC00FF';

export interface ToastHandle {
    show: (message: string) => void;
}

const NotificationToast = forwardRef<ToastHandle, {}>((props, ref) => {
    const [message, setMessage] = useState('');
    const translateY = useSharedValue(-100);
    const opacity = useSharedValue(0);

    useImperativeHandle(ref, () => ({
        show: (msg: string) => {
            setMessage(msg);
            translateY.value = withSequence(
                withSpring(60, { damping: 15, stiffness: 120 }),
                withDelay(2000, withSpring(-100))
            );
            opacity.value = withSequence(
                withTiming(1, { duration: 300 }),
                withDelay(2000, withTiming(0, { duration: 500 }))
            );
        },
    }));

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <LinearGradient 
                colors={[CYAN, PURPLE]} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }} 
                style={styles.gradient}
            >
                <Text style={styles.text}>{message}</Text>
            </LinearGradient>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10000,
        pointerEvents: 'none',
    },
    gradient: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        shadowColor: CYAN,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    text: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});

export default NotificationToast;
