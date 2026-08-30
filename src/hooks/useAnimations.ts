import { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing } from 'react-native-reanimated';

export const useFadeAnimation = (initialValue = 0) => {
  const opacity = useSharedValue(initialValue);

  const fadeIn = (duration = 300) => {
    opacity.value = withTiming(1, { duration, easing: Easing.out(Easing.ease) });
  };

  const fadeOut = (duration = 250) => {
    opacity.value = withTiming(0, { duration, easing: Easing.in(Easing.ease) });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return { opacity, fadeIn, fadeOut, animatedStyle };
};

export const usePressScale = (activeScale = 0.96) => {
  const scale = useSharedValue(1);

  const pressIn = () => {
    scale.value = withSpring(activeScale, { damping: 15, stiffness: 350 });
  };

  const pressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 350 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { scale, pressIn, pressOut, animatedStyle };
};
