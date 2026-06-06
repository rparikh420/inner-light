import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: string;
}

export default function Card({ children, style }: CardProps) {
  return <View style={style}>{children}</View>;
}
