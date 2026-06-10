import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

import { COLORS, RADIUS, S } from '../constants/theme';
import { CBT_TOOLS } from '../data/cbt-tools';

const POSITION_KEY = '@inner_light/tool_wheel_position';

const HUB_SIZE = 64;
const ICON_SIZE = 52;
const BLOOM_RADIUS = 104;
const SELECT_RADIUS = 44;
const REACH = BLOOM_RADIUS + ICON_SIZE / 2;
const LONG_PRESS_MS = 380;
const MOVE_CANCEL_PX = 10;
const LOCK_DELAY_MS = 240;

type GestureMode = 'idle' | 'reposition' | 'bloom';
type Point = { x: number; y: number };

// 5 tools at 72° (2π/5) intervals, symmetric around east (0°):
// upper-left, upper-right, right, lower-right, lower-left — pentagonal bloom
const TOOL_ANGLES = [
  -(4 * Math.PI) / 5,
  -(2 * Math.PI) / 5,
  0,
  (2 * Math.PI) / 5,
  (4 * Math.PI) / 5,
];

function clamp(value: number, lo: number, hi: number) {
  const min = Math.min(lo, hi);
  const max = Math.max(lo, hi);
  return Math.min(Math.max(value, min), max);
}

function clampCenter(point: Point, size: { width: number; height: number }): Point {
  return {
    x: clamp(point.x, REACH, size.width - REACH),
    y: clamp(point.y, REACH, size.height - REACH),
  };
}

/**
 * A draggable hub that blooms into a radial menu of CBT tools on long press.
 * Dragging while bloomed highlights the nearest tool; lifting while one is
 * highlighted locks it in and opens that tool's worksheet. Its resting spot
 * is remembered between visits.
 */
export default function ToolWheel() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  const [ready, setReady] = useState(false);
  const [bloomOpen, setBloomOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const bloom = useRef(new Animated.Value(0)).current;
  const hubScale = useRef(new Animated.Value(1)).current;
  const highlights = useRef(CBT_TOOLS.map(() => new Animated.Value(0))).current;

  const positionRef = useRef<Point>({ x: 0, y: 0 });
  const containerRef = useRef<{ width: number; height: number } | null>(null);
  const modeRef = useRef<GestureMode>('idle');
  const startPosRef = useRef<Point>({ x: 0, y: 0 });
  const hubCenterRef = useRef<Point>({ x: 0, y: 0 });
  const selectedIndexRef = useRef<number | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const movePosition = (next: Point) => {
    positionRef.current = next;
    position.setValue(next);
  };

  const closeBloom = () => {
    setBloomOpen(false);
    setSelectedIndex(null);
    selectedIndexRef.current = null;
    Animated.spring(bloom, { toValue: 0, useNativeDriver: false, friction: 9, tension: 90 }).start();
  };

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    const size = { width, height };
    containerRef.current = size;
    setContainerSize(size);
  };

  // Place the hub once we know how much room we have — restoring its last
  // resting spot if one was saved, else tucking it in the lower-right corner.
  useEffect(() => {
    if (!containerSize || ready) return;
    let cancelled = false;
    (async () => {
      let initial: Point = {
        x: containerSize.width - REACH + (REACH - HUB_SIZE / 2 - S.sm),
        y: containerSize.height - REACH + (REACH - HUB_SIZE / 2 - S.lg),
      };
      try {
        const stored = await AsyncStorage.getItem(POSITION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
            initial = parsed;
          }
        }
      } catch {
        // keep the default corner placement
      }
      if (cancelled) return;
      const clamped = clampCenter(initial, containerSize);
      movePosition(clamped);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [containerSize, ready]);

  // Drive each tool's highlight toward the currently-selected one
  useEffect(() => {
    highlights.forEach((highlight, index) => {
      Animated.spring(highlight, {
        toValue: selectedIndex === index ? 1 : 0,
        useNativeDriver: false,
        speed: 22,
        bounciness: 6,
      }).start();
    });
  }, [selectedIndex, highlights]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        modeRef.current = 'idle';
        selectedIndexRef.current = null;
        setSelectedIndex(null);
        startPosRef.current = positionRef.current;
        hubCenterRef.current = positionRef.current;

        Animated.spring(hubScale, { toValue: 0.92, useNativeDriver: false, speed: 30 }).start();

        longPressTimer.current = setTimeout(() => {
          if (modeRef.current !== 'idle') return;
          modeRef.current = 'bloom';
          setBloomOpen(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          Animated.spring(bloom, { toValue: 1, useNativeDriver: false, friction: 7, tension: 80 }).start();
        }, LONG_PRESS_MS);
      },
      onPanResponderMove: (_evt, gesture) => {
        const { dx, dy } = gesture;

        if (modeRef.current === 'idle') {
          if (Math.hypot(dx, dy) <= MOVE_CANCEL_PX) return;
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
          modeRef.current = 'reposition';
        }

        if (modeRef.current === 'reposition') {
          const size = containerRef.current;
          if (!size) return;
          const next = clampCenter(
            { x: startPosRef.current.x + dx, y: startPosRef.current.y + dy },
            size,
          );
          movePosition(next);
          return;
        }

        if (modeRef.current === 'bloom') {
          const touch = { x: hubCenterRef.current.x + dx, y: hubCenterRef.current.y + dy };
          let nearest: number | null = null;
          let nearestDist = Infinity;
          TOOL_ANGLES.forEach((angle, index) => {
            const toolCenter = {
              x: hubCenterRef.current.x + BLOOM_RADIUS * Math.cos(angle),
              y: hubCenterRef.current.y + BLOOM_RADIUS * Math.sin(angle),
            };
            const dist = Math.hypot(touch.x - toolCenter.x, touch.y - toolCenter.y);
            if (dist < nearestDist) {
              nearestDist = dist;
              nearest = index;
            }
          });
          const next = nearestDist <= SELECT_RADIUS ? nearest : null;
          if (next !== selectedIndexRef.current) {
            if (next !== null) Haptics.selectionAsync().catch(() => {});
            selectedIndexRef.current = next;
            setSelectedIndex(next);
          }
        }
      },
      onPanResponderRelease: () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        Animated.spring(hubScale, { toValue: 1, useNativeDriver: false, speed: 20 }).start();

        if (modeRef.current === 'reposition') {
          AsyncStorage.setItem(POSITION_KEY, JSON.stringify(positionRef.current)).catch(() => {});
          modeRef.current = 'idle';
          return;
        }

        if (modeRef.current === 'bloom') {
          const index = selectedIndexRef.current;
          if (index !== null) {
            const tool = CBT_TOOLS[index];
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            setTimeout(() => {
              closeBloom();
              routerRef.current.push(`/tool/${tool.id}` as never);
            }, LOCK_DELAY_MS);
          } else {
            closeBloom();
          }
        }

        modeRef.current = 'idle';
      },
      onPanResponderTerminate: () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        Animated.spring(hubScale, { toValue: 1, useNativeDriver: false }).start();
        closeBloom();
        modeRef.current = 'idle';
      },
    }),
  ).current;

  const toolStyle = (index: number) => {
    const angle = TOOL_ANGLES[index];
    const dx = BLOOM_RADIUS * Math.cos(angle);
    const dy = BLOOM_RADIUS * Math.sin(angle);
    const translateX = bloom.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
    const translateY = bloom.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
    const scale = Animated.add(
      bloom.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
      highlights[index].interpolate({ inputRange: [0, 1], outputRange: [0, 0.2] }),
    );
    return {
      opacity: bloom,
      transform: [{ translateX }, { translateY }, { scale }],
    };
  };

  const selectedTool = selectedIndex !== null ? CBT_TOOLS[selectedIndex] : null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" onLayout={onLayout}>
      {ready && (
        <>
          <Animated.View
            pointerEvents="none"
            style={[styles.backdrop, { opacity: bloom.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }) }]}
          />

          <Animated.View pointerEvents="none" style={[styles.namePill, { opacity: bloom }]}>
            <Text style={styles.namePillText}>
              {selectedTool ? selectedTool.label : 'drag to a tool, then lift'}
            </Text>
          </Animated.View>

          {CBT_TOOLS.map((tool, index) => (
            <Animated.View
              key={tool.id}
              pointerEvents="none"
              style={[
                styles.toolIcon,
                selectedIndex === index && styles.toolIconSelected,
                {
                  left: Animated.subtract(position.x, ICON_SIZE / 2),
                  top: Animated.subtract(position.y, ICON_SIZE / 2),
                },
                toolStyle(index),
              ]}
            >
              <Ionicons
                name={tool.icon}
                size={22}
                color={selectedIndex === index ? COLORS.bg : COLORS.accent}
              />
            </Animated.View>
          ))}

          <Animated.View
            style={[
              styles.hub,
              bloomOpen && styles.hubBloomed,
              {
                left: Animated.subtract(position.x, HUB_SIZE / 2),
                top: Animated.subtract(position.y, HUB_SIZE / 2),
                transform: [{ scale: hubScale }],
              },
            ]}
            accessible
            accessibilityRole="button"
            accessibilityLabel="CBT tool wheel — drag to move, long-press to open"
            {...panResponder.panHandlers}
          >
            <Ionicons name="build-outline" size={26} color={COLORS.accent} />
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.bg,
  },
  namePill: {
    position: 'absolute',
    top: S.lg,
    alignSelf: 'center',
    paddingVertical: S.xs + 2,
    paddingHorizontal: S.md,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.accentBorder,
  },
  namePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
    letterSpacing: 0.2,
  },
  hub: {
    position: 'absolute',
    width: HUB_SIZE,
    height: HUB_SIZE,
    borderRadius: HUB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.accentBorder,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  hubBloomed: {
    backgroundColor: COLORS.accentSoft,
  },
  toolIcon: {
    position: 'absolute',
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.accentBorder,
  },
  toolIconSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
});
