import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Color Palette
const CYAN = '#00F2FF';
const PURPLE = '#BC00FF';
const DARK_BG = '#050B18';

export default function ExploreScreen() {
  const ambientScale = useSharedValue(1);
  const ambientOpacity = useSharedValue(0.3);

  useEffect(() => {
    // Soft ambient breathing effect
    ambientScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    ambientOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 4000, easing: Easing.inOut(Easing.ease) })
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
    <View style={styles.container}>
      {/* Ambient Background Glows */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Animated.View style={[styles.ambientGlow, { top: height * 0.1, left: -width * 0.2, backgroundColor: CYAN }, animatedAmbient]} />
        <Animated.View style={[styles.ambientGlow, { bottom: height * 0.1, right: -width * 0.2, backgroundColor: PURPLE }, animatedAmbient]} />
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.titleText}>Choose Path</Text>

        <View style={styles.buttonContainer}>
          {/* Host Button */}
          <Link href="/host" asChild>
            <TouchableOpacity activeOpacity={0.8} style={styles.touchableArea}>
              <LinearGradient
                colors={[CYAN, '#0088FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradientBorder, { shadowColor: CYAN }]}
              >
                <View style={styles.innerButton}>
                  <Text style={[styles.buttonText, { textShadowColor: CYAN }]}>Host</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Link>

          {/* Join Button */}
          <Link href="/join" asChild>
            <TouchableOpacity activeOpacity={0.8} style={styles.touchableArea}>
              <LinearGradient
                colors={[PURPLE, '#FF00A0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradientBorder, { shadowColor: PURPLE }]}
              >
                <View style={styles.innerButton}>
                  <Text style={[styles.buttonText, { textShadowColor: PURPLE }]}>Join</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  ambientGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    filter: 'blur(60px)',
    // Fallback shadow for ambient glow
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
    elevation: 20,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  titleText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#E0F8FF',
    letterSpacing: 2,
    marginBottom: 60,
    textAlign: 'center',
    textShadowColor: CYAN,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 30, // Space between buttons
  },
  touchableArea: {
    width: '80%',
  },
  gradientBorder: {
    borderRadius: 25,
    padding: 3, // Border thickness
    // Drop shadow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
  },
  innerButton: {
    backgroundColor: DARK_BG,
    borderRadius: 22,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
});
