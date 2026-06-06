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
 * Screen wrapper with a visible purple-to-black atmosphere.
 * The purple is real and noticeable at the top, fading to warm black.
 */
export default function GradientBackground({ children, padded = true }: Props) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[
          '#1A1030',   // visible dark purple at top
          '#150E24',   // mid purple
          '#0F0C18',   // fading
          COLORS.bg,   // warm black
        ]}
        locations={[0, 0.2, 0.4, 0.7]}
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
