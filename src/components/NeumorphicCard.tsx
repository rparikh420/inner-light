import React from 'react';
import { StyleSheet, View, Pressable, ViewStyle, Platform } from 'react-native';
import { COLORS } from '../constants/theme';

interface NeumorphicCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export default function NeumorphicCard({ children, style, onPress }: NeumorphicCardProps) {
  const cardContent = (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          { opacity: pressed ? 0.8 : 1 },
        ]}
      >
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    ...Platform.select({
      android: {
        elevation: 8,
      },
    }),
  },
});
