import React, { ReactNode } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  RefreshControlProps,
} from 'react-native';
import { colors, spacing } from '../../theme';

interface ScreenContainerProps {
  children: ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = false,
  style,
  contentContainerStyle,
  refreshControl,
  keyboardShouldPersistTaps = 'handled',
}) => {
  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scrollable ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            refreshControl={refreshControl}
          >
            <View style={styles.maxWidthWrapper}>{children}</View>
          </ScrollView>
        ) : (
          <View style={[styles.mainContent, contentContainerStyle]}>
            <View style={styles.maxWidthWrapper}>{children}</View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexGrow: 1,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  maxWidthWrapper: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
});

export default ScreenContainer;
