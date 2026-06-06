import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SCREEN_PADDING } from '../constants/theme';

interface Props {
  children: React.ReactNode;
  padded?: boolean;
}

/**
 * Screen wrapper with a subtle purple atmosphere.
 *
 * The gradient is barely perceptible — a faint violet wash at the top
 * that fades into warm black. It's felt more than seen, like ambient
 * light in a dark room. NOT a visible stripe or AI-purple gradient.
 *
 * Colors are extremely desaturated and dark — the purple is at ~5% visibility.
 */
export default function GradientBackground({ children, padded = true }: Props) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Ambient purple glow — faint radial-like effect using stacked gradients */}
      <LinearGradient
        colors={[
          '#13101A',   // very dark purple-tinted (barely visible)
          '#0F0D14',   // transitioning
          COLORS.bg,   // #0D0D0F warm black
          COLORS.bg,   // stays black for bottom half
        ]}
        locations={[0, 0.25, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={[styles.safe, padded && styles.padded]}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  safe: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: SCREEN_PADDING,
  },
});
