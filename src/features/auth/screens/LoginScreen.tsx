import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle, Path } from 'react-native-svg';
import { AuthStackParamList } from '../../../navigation/types';
import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { AppLogo } from '../../../components/ui/AppLogo';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { useAuthStore, MOCK_OFFICER_USER, MOCK_SUPERVISOR_USER } from '../../../store/useAuthStore';
import { FadeInView, SlideUpView, ScalePressable } from '../../../utils/animations';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Check,
  Fingerprint,
  ShieldCheck,
  AlertCircle,
  LockKeyhole,
} from 'lucide-react-native';

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen = () => {
  const navigation = useNavigation<LoginNavProp>();
  const { login } = useAuthStore();

  // Form Fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Focus & Validation
  const [idFocused, setIdFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [idError, setIdError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Modals
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricAuthenticating, setBiometricAuthenticating] = useState(false);

  const handleLogin = () => {
    let isValid = true;

    if (!identifier.trim()) {
      setIdError('Email or Employee ID is required.');
      isValid = false;
    } else {
      setIdError('');
    }

    if (!password.trim()) {
      setPasswordError('Password is required.');
      isValid = false;
    } else {
      setPasswordError('');
    }

    if (!isValid) return;

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      // Role determination logic:
      // If identifier contains 'sup' or 'supervisor', route to SUPERVISOR dashboard, otherwise OFFICER
      const isSupervisor = identifier.toLowerCase().includes('sup');
      const userToLogin = isSupervisor ? MOCK_SUPERVISOR_USER : MOCK_OFFICER_USER;
      const roleToLogin = isSupervisor ? 'SUPERVISOR' : 'OFFICER';

      login(roleToLogin, userToLogin);
    }, 700);
  };

  const handleBiometricAuth = () => {
    setBiometricAuthenticating(true);
    setTimeout(() => {
      setBiometricAuthenticating(false);
      setShowBiometricModal(false);
      login('OFFICER', MOCK_OFFICER_USER);
    }, 1100);
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container} style={styles.screenBg}>
      {/* 1. LAYERED BACKGROUND DEPTH (SUBTLE TONAL SHAPES & FAINT VERIFICATION VECTOR RINGS) */}
      <View style={styles.ambientRadialGlowTop} />
      <View style={styles.ambientCornerShape} />
      <View style={styles.vectorRingWrapper}>
        <Svg width="280" height="280" viewBox="0 0 280 280" fill="none">
          <Circle cx="140" cy="140" r="130" stroke={colors.primaryNavy} strokeWidth="1" strokeDasharray="6 6" opacity="0.04" />
          <Circle cx="140" cy="140" r="100" stroke={colors.secondaryNavy} strokeWidth="1" opacity="0.03" />
          <Circle cx="140" cy="140" r="70" stroke={colors.primaryNavy} strokeWidth="1" strokeDasharray="4 4" opacity="0.03" />
        </Svg>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        {/* 2. BRAND AREA */}
        <FadeInView delay={100} style={styles.brandContainer}>
          <AppLogo size="md" align="center" showTagline={true} />
        </FadeInView>

        {/* 3. WELCOME AREA */}
        <SlideUpView delay={200} style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Welcome Back</Text>
          <Text style={styles.welcomeSubtitle}>Sign in securely to continue</Text>
        </SlideUpView>

        {/* 4. AUTHENTICATION SURFACE (PREMIUM WHITE CARD WITH DIFFUSED SHADOW) */}
        <SlideUpView delay={300} style={styles.authSurface}>
          {/* EMAIL OR EMPLOYEE ID INPUT */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL OR EMPLOYEE ID</Text>
            <View
              style={[
                styles.inputWrapper,
                idFocused && styles.inputWrapperFocused,
                !!idError && styles.inputWrapperError,
              ]}
            >
              <User size={18} color={idFocused ? colors.secondaryNavy : colors.secondaryText} />
              <TextInput
                value={identifier}
                onChangeText={(text) => {
                  setIdentifier(text);
                  if (idError) setIdError('');
                }}
                onFocus={() => setIdFocused(true)}
                onBlur={() => setIdFocused(false)}
                placeholder="Enter your email or employee ID"
                placeholderTextColor={colors.mutedText}
                style={styles.textInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {!!idError && (
              <View style={styles.errorRow}>
                <AlertCircle size={13} color={colors.danger} />
                <Text style={styles.errorText}>{idError}</Text>
              </View>
            )}
          </View>

          {/* PASSWORD INPUT */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View
              style={[
                styles.inputWrapper,
                passwordFocused && styles.inputWrapperFocused,
                !!passwordError && styles.inputWrapperError,
              ]}
            >
              <Lock size={18} color={passwordFocused ? colors.secondaryNavy : colors.secondaryText} />
              <TextInput
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError('');
                }}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholder="Enter your password"
                placeholderTextColor={colors.mutedText}
                secureTextEntry={!showPassword}
                style={styles.textInput}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff size={18} color={colors.secondaryText} />
                ) : (
                  <Eye size={18} color={colors.secondaryText} />
                )}
              </TouchableOpacity>
            </View>
            {!!passwordError && (
              <View style={styles.errorRow}>
                <AlertCircle size={13} color={colors.danger} />
                <Text style={styles.errorText}>{passwordError}</Text>
              </View>
            )}
          </View>

          {/* REMEMBER ME + FORGOT PASSWORD ROW */}
          <View style={styles.rememberRow}>
            <TouchableOpacity
              onPress={() => setRememberMe(!rememberMe)}
              style={styles.checkboxTouch}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rememberMe }}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Check size={12} color={colors.white} strokeWidth={3} />}
              </View>
              <Text style={styles.rememberLabel}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Forgot password link"
            >
              <Text style={styles.forgotPasswordLink}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* PRIMARY LOGIN CTA */}
          <View style={styles.loginBtnContainer}>
            <PrimaryButton
              title="LOGIN"
              onPress={handleLogin}
              loading={loading}
              icon={<ShieldCheck size={18} color={colors.white} />}
            />
          </View>

          {/* BIOMETRIC SECTION DIVIDER */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* OUTLINED SECONDARY BIOMETRIC BUTTON */}
          <ScalePressable
            onPress={() => setShowBiometricModal(true)}
            activeScale={0.98}
            style={styles.biometricBtn}
            accessibilityRole="button"
            accessibilityLabel="Login using Fingerprint"
          >
            <Fingerprint size={20} color={colors.primaryNavy} />
            <Text style={styles.biometricBtnText}>Login using Fingerprint</Text>
          </ScalePressable>

          <Text style={styles.biometricCaption}>Secure biometric authentication</Text>
        </SlideUpView>

        {/* 5. REGISTER NAVIGATION LINK */}
        <SlideUpView delay={350} style={styles.registerRow}>
          <Text style={styles.registerPromptText}>Don’t have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Register account link"
          >
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </SlideUpView>

        {/* 6. SECURITY REASSURANCE & FOOTER */}
        <FadeInView delay={450} style={styles.securityReassuranceSection}>
          <View style={styles.reassuranceBadge}>
            <LockKeyhole size={13} color={colors.secondaryNavy} />
            <Text style={styles.reassuranceBadgeText}>
              Secure access for authorized personnel
            </Text>
          </View>

          <Text style={styles.footerText}>
            Your information is protected with secure authentication
          </Text>
          <Text style={styles.footerVersion}>PEHCHAAN • v1.0</Text>
        </FadeInView>
      </KeyboardAvoidingView>

      {/* BIOMETRIC BOTTOM SHEET MODAL */}
      <Modal
        visible={showBiometricModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBiometricModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowBiometricModal(false)}>
          <Pressable style={styles.bottomSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandleBar} />

            <Text style={styles.sheetTitle}>Confirm Using Your Fingerprint</Text>

            {/* Fingerprint Touch Sensor Zone */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleBiometricAuth}
              style={styles.fingerprintPulseContainer}
            >
              <View
                style={[
                  styles.pulseRing,
                  biometricAuthenticating && styles.pulseRingActive,
                ]}
              />
              <View style={styles.fingerprintCircle}>
                <Fingerprint
                  size={46}
                  color={biometricAuthenticating ? colors.info : colors.primaryNavy}
                />
              </View>
            </TouchableOpacity>

            <Text style={styles.sensorText}>
              {biometricAuthenticating
                ? 'Authenticating fingerprint...'
                : 'Touch the fingerprint sensor'}
            </Text>

            {/* Fallback Password Button */}
            <TouchableOpacity
              onPress={() => setShowBiometricModal(false)}
              style={styles.fallbackBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.fallbackBtnText}>Use Password</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screenBg: {
    backgroundColor: '#F5F7FA',
  },
  container: {
    paddingBottom: spacing.xxxl,
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },

  /* 1. LAYERED BACKGROUND TONAL SHAPES */
  ambientRadialGlowTop: {
    position: 'absolute',
    top: -80,
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(244, 248, 252, 0.9)',
  },
  ambientCornerShape: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(238, 244, 249, 0.6)',
  },
  vectorRingWrapper: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },

  /* 2. BRAND AREA */
  brandContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },

  /* 3. WELCOME AREA */
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  welcomeTitle: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 28,
    fontWeight: '700',
    color: colors.primaryText,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 14,
    color: colors.secondaryText,
    marginTop: 4,
    textAlign: 'center',
  },

  /* 4. AUTHENTICATION SURFACE */
  authSurface: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    ...shadows.card,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryText,
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  inputWrapperFocused: {
    borderColor: colors.secondaryNavy,
    shadowColor: colors.secondaryNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  inputWrapperError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerBg,
  },
  textInput: {
    flex: 1,
    height: '100%',
    color: colors.primaryText,
    fontFamily: typography.body.fontFamily,
    fontSize: 15,
  },
  eyeBtn: {
    padding: spacing.xs,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 4,
  },
  errorText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.danger,
  },

  /* REMEMBER ME + FORGOT PASSWORD */
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  checkboxTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primaryNavy,
    borderColor: colors.primaryNavy,
  },
  rememberLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: colors.secondaryText,
  },
  forgotPasswordLink: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondaryNavy,
  },

  /* PRIMARY LOGIN CTA */
  loginBtnContainer: {
    marginBottom: spacing.lg,
  },

  /* BIOMETRIC DIVIDER & BUTTON */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedText,
  },
  biometricBtn: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryNavy,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  biometricBtnText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  biometricCaption: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: spacing.xs + 2,
  },

  /* 5. REGISTER ROW */
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  registerPromptText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.secondaryText,
  },
  registerLink: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryNavy,
  },

  /* 6. SECURITY REASSURANCE & FOOTER */
  securityReassuranceSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  reassuranceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.softBlue,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(31, 78, 121, 0.15)',
    marginBottom: spacing.md,
  },
  reassuranceBadgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondaryNavy,
  },
  footerText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.mutedText,
    textAlign: 'center',
  },
  footerVersion: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: colors.mutedText,
    marginTop: 2,
  },

  /* BIOMETRIC BOTTOM SHEET */
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    alignItems: 'center',
    ...shadows.floating,
  },
  sheetHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderDark,
    marginBottom: spacing.xl,
  },
  sheetTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryNavy,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  fingerprintPulseContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  pulseRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(18, 52, 91, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(18, 52, 91, 0.15)',
  },
  pulseRingActive: {
    backgroundColor: 'rgba(47, 111, 237, 0.12)',
    borderColor: colors.info,
  },
  fingerprintCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.paleBlue,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sensorText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    color: colors.secondaryText,
    marginBottom: spacing.xxl,
  },
  fallbackBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  fallbackBtnText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: colors.info,
  },
});

export default LoginScreen;
