import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SCREEN_PADDING } from '../constants/theme';

interface Props {
  children: React.ReactNode;
  padded?: boolean;
}

export default function GradientBackground({ children, padded = true }: Props) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
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
