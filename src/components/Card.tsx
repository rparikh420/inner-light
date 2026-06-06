import React, { useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Animated,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { COLORS, PRESS } from '../constants/theme';

type CardVariant = 'default' | 'elevated' | 'glass';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: CardVariant;
}

export default function Card({
  children,
  style,
  onPress,
  variant = 'default',
}: CardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: PRESS.scale,
      ...PRESS.springConfig,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...PRESS.springConfig,
    }).start();
  }, [scaleAnim]);

  const variantStyle = variantStyles[variant];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View
          style={[
            styles.card,
            variantStyle,
            style,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, variantStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
});

const variantStyles = StyleSheet.create({
  default: {
    backgroundColor: COLORS.bgCard,
  },
  elevated: {
    backgroundColor: COLORS.bgCard,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  glass: {
    backgroundColor: COLORS.surface,
  },
});
