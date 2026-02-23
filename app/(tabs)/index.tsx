import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import React, { useEffect } from 'react';
import { Dimensions, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Color Palette
const CYAN = '#00F2FF';
const PURPLE = '#BC00FF';
const DARK_BG = '#050B18';

// Reusable animated floating emoji component
const FloatingEmoji = ({ emoji, initialX, initialY, delay }: { emoji: string; initialX: number; initialY: number; delay: number }) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-20, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
  }, [delay, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View style={[styles.floatingEmojiContainer, { left: initialX, top: initialY }, animatedStyle]}>
      <Text style={styles.floatingEmoji}>{emoji}</Text>
    </Animated.View>
  );
};

export default function MoodSyncLandingPage() {
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
      {/* Outer Viewport Glow Simulation */}
      <View style={styles.viewportGlow}>
        {/* Layer 1: Floating Assets Layer */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <FloatingEmoji emoji="💖" initialX={30} initialY={120} delay={0} />
          <FloatingEmoji emoji="⚡" initialX={width - 70} initialY={150} delay={500} />
          <FloatingEmoji emoji="⭐" initialX={width - 90} initialY={height * 0.6} delay={1000} />
          <FloatingEmoji emoji="🎵" initialX={40} initialY={300} delay={200} />
          <FloatingEmoji emoji="🎵" initialX={width - 60} initialY={350} delay={800} />
          <FloatingEmoji emoji="💖" initialX={70} initialY={height * 0.75} delay={600} />
          <FloatingEmoji emoji="😞" initialX={width - 80} initialY={height * 0.85} delay={1200} />
          <FloatingEmoji emoji="😊" initialX={30} initialY={height * 0.9} delay={300} />
        </View>

        <SafeAreaView style={styles.safeArea}>
          {/* Ambient Background Glows */}
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <Animated.View style={[styles.ambientGlow, { top: height * 0.2, left: width * 0.1, backgroundColor: CYAN }, animatedAmbient]} />
            <Animated.View style={[styles.ambientGlow, { top: height * 0.5, left: width * 0.5, backgroundColor: PURPLE }, animatedAmbient]} />
          </View>

          {/* Layer 2: Centered Header Section */}
          <View style={styles.headerContainer}>
            <View style={styles.moodTextWrapper}>
              {/* Emojis directly above the 'oo' */}
              <View style={styles.emojiOverlaysRow}>
                <Text style={styles.emojiOverlayText}>😊</Text>
                <Text style={styles.emojiOverlayText}>😊</Text>
              </View>
              <Text style={styles.headerText}>Mood</Text>
            </View>
            <Link href="/explore" asChild>
              <Text style={styles.headerTextLink}>Sync</Text>
            </Link>
          </View>

          {/* Layer 4: Spotify Button Component */}
          <View style={styles.footerContainer}>
            <LinearGradient
              colors={[CYAN, PURPLE]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.spotifyButtonGradient}
            >
              <View style={styles.spotifyButtonInner}>
                {/* Background emojis inside the button */}
                <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                  <Text style={[styles.tinyDecorEmoji, { left: 15, top: 12 }]}>😊</Text>
                  <Text style={[styles.tinyDecorEmoji, { right: 15, top: 12 }]}>😞</Text>
                  <Text style={[styles.tinyDecorEmoji, { left: 15, bottom: 12 }]}>💖</Text>
                  <Text style={[styles.tinyDecorEmoji, { right: 15, bottom: 12 }]}>😞</Text>
                  <Text style={[styles.tinyDecorEmoji, { left: 90, bottom: 8, fontSize: 10 }]}>😊</Text>
                  <Text style={[styles.tinyDecorEmoji, { right: 90, bottom: 8, fontSize: 10 }]}>⭐</Text>
                </View>

                {/* Spotify Logo and Text */}
                <View style={styles.spotifyIconTextRow}>
                  <Svg width="28" height="28" viewBox="0 0 24 24">
                    <Path
                      fill="#FFFFFF"
                      d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.84-.12-.96-.54-.12-.42.12-.84.54-.96 4.56-1.08 8.52-.66 11.64 1.26.36.24.48.72.36 1.14zm1.44-3.3c-.3.42-.84.54-1.26.24-3.24-1.98-8.16-2.58-11.94-1.44-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.32-1.26 9.72-.6 13.5 1.68.42.24.54.84.24 1.26zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.54.18-1.14-.12-1.32-.66-.18-.54.12-1.14.66-1.32 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72.96.42 1.5-.3.54-.96.72-1.5.42z"
                    />
                  </Svg>
                  <Text style={styles.spotifyText}>Spotify</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  viewportGlow: {
    flex: 1,
    // Emulating the hue-rotate / neon bloom around viewport
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  floatingEmojiContainer: {
    position: 'absolute',
    opacity: 0.6,
  },
  floatingEmoji: {
    fontSize: 28,
    textShadowColor: PURPLE,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  headerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    filter: 'blur(50px)', // Uses web blur or works broadly on newer RN
    // Fallback shadow for ambient glow if blur is unsupported natively
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 50,
    elevation: 20,
  },
  moodTextWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emojiOverlaysRow: {
    flexDirection: 'row',
    position: 'absolute',
    top: -24,
    left: '50%',
    marginLeft: -26, // Center the emojis perfectly over 'oo'
    gap: 12,
    zIndex: 10,
  },
  emojiOverlayText: {
    fontSize: 20,
    textShadowColor: CYAN,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerText: {
    fontSize: 64,
    fontWeight: '800',
    color: '#E0F8FF', // Soft glowing cyan-white
    letterSpacing: 2,
    lineHeight: 74,
    textAlign: 'center',
    textShadowColor: CYAN,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },

  headerTextLink: {
    fontSize: 64,
    fontWeight: '800',
    color: '#E0F8FF',
    letterSpacing: 2,
    lineHeight: 74,
    textAlign: 'center',
    textShadowColor: PURPLE,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  footerContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  spotifyButtonGradient: {
    width: width * 0.85,
    height: 70,
    borderRadius: 35,
    padding: 2.5, // Border thickness
    // Drop-shadow using accent colors
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
  },
  spotifyButtonInner: {
    flex: 1,
    backgroundColor: DARK_BG,
    borderRadius: 32.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden', // Contain the floating emojis
  },
  spotifyIconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 5,
  },
  spotifyText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  tinyDecorEmoji: {
    position: 'absolute',
    fontSize: 14,
    opacity: 0.7,
    textShadowColor: CYAN,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
