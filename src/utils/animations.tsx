import React, { ReactNode } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  Easing,
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';

interface FadeInViewProps {
  children: ReactNode;
  duration?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  duration = 400,
  delay = 0,
  style,
}) => {
  return (
    <Animated.View
      entering={FadeIn.duration(duration).delay(delay)}
      style={style}
    >
      {children}
    </Animated.View>
  );
};

interface SlideUpViewProps {
  children: ReactNode;
  duration?: number;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

export const SlideUpView: React.FC<SlideUpViewProps> = ({
  children,
  duration = 450,
  delay = 0,
  style,
}) => {
  return (
    <Animated.View
      entering={SlideInDown.duration(duration)
        .delay(delay)
        .easing(Easing.out(Easing.cubic))}
      style={style}
    >
      {children}
    </Animated.View>
  );
};

interface StaggeredEntranceProps {
  children: ReactNode;
  index: number;
  staggerMs?: number;
  style?: StyleProp<ViewStyle>;
}

export const StaggeredEntrance: React.FC<StaggeredEntranceProps> = ({
  children,
  index,
  staggerMs = 80,
  style,
}) => {
  return (
    <Animated.View
      entering={SlideInDown.duration(400)
        .delay(index * staggerMs)
        .easing(Easing.out(Easing.quad))}
      style={style}
    >
      {children}
    </Animated.View>
  );
};

interface ScalePressableProps extends PressableProps {
  children: ReactNode;
  activeScale?: number;
  style?: StyleProp<ViewStyle>;
}

export const ScalePressable: React.FC<ScalePressableProps> = ({
  children,
  activeScale = 0.97,
  style,
  onPressIn,
  onPressOut,
  ...rest
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: any) => {
    scale.value = withSpring(activeScale, {
      damping: 15,
      stiffness: 300,
    });
    if (onPressIn) onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
    if (onPressOut) onPressOut(e);
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} {...rest}>
      <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
    </Pressable>
  );
};
