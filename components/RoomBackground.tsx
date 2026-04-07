import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const CYAN = '#00F2FF';
const PURPLE = '#BC00FF';

interface RoomBackgroundProps {
    artworkUrl?: string | null;
}

export default function RoomBackground({ artworkUrl }: RoomBackgroundProps) {
    const ambientScale = useSharedValue(1);
    const ambientOpacity = useSharedValue(0.3);

    useEffect(() => {
        // Soft ambient breathing effect
        ambientScale.value = withRepeat(
            withSequence(
                withTiming(1.3, { duration: 4500, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 4500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
        ambientOpacity.value = withRepeat(
            withSequence(
                withTiming(0.5, { duration: 4500, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.2, { duration: 4500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, [ambientScale, ambientOpacity]);

    const animatedAmbient = useAnimatedStyle(() => {
        return {
            transform: [{ scale: ambientScale.value }],
            opacity: ambientOpacity.value,
        };
    });

    return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            {artworkUrl ? (
                <Image
                    source={{ uri: artworkUrl }}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                    blurRadius={100}
                />
            ) : null}

            {/* Dark overlay to ensure foreground text/UI remains readable */}
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(5, 11, 24, 0.65)' }]} />

            {!artworkUrl && (
                <>
                    <Animated.View style={[styles.ambientGlow, { top: height * 0.1, left: -width * 0.1, backgroundColor: CYAN }, animatedAmbient]} />
                    <Animated.View style={[styles.ambientGlow, { bottom: height * 0.1, right: -width * 0.1, backgroundColor: PURPLE }, animatedAmbient]} />
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    ambientGlow: {
        position: 'absolute',
        width: 350,
        height: 350,
        borderRadius: 175,
        filter: 'blur(70px)',
        shadowColor: CYAN,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 70,
        elevation: 20,
    },
});
