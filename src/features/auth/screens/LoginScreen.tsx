import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Shield,
  Check,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react-native';
import { AuthStackParamList } from '../../../navigation/types';
import { colors, typography, radius, shadows, spacing } from '../../../theme';
import { UserRole } from '../../../types/auth';
import { AuthService } from '../../../services/authService';

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;
type LoginRouteProp = RouteProp<AuthStackParamList, 'Login'>;

export const LoginScreen = () => {
  const navigation = useNavigation<LoginNavProp>();
  const route = useRoute<LoginRouteProp>();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Selected Role (Default: from route params or SUPERVISOR to match reference screenshot default)
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    route.params?.initialRole || 'SUPERVISOR'
  );

  useEffect(() => {
    if (route.params?.initialRole) {
      setSelectedRole(route.params.initialRole);
    }
  }, [route.params?.initialRole]);

  // Input States
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Errors
  const [userIdError, setUserIdError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Refs for keyboard navigation
  const userIdRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    let isValid = true;
    setErrorMessage('');

    if (!userId.trim()) {
      setUserIdError('Please enter your Official ID or Email.');
      isValid = false;
    } else {
      setUserIdError('');
    }

    if (!password.trim()) {
      setPasswordError('Please enter your password.');
      isValid = false;
    } else {
      setPasswordError('');
    }

    if (!isValid) return;

    Keyboard.dismiss();
    setLoading(true);

    try {
      await AuthService.login({
        username: userId.trim(),
        password: password,
        role: selectedRole,
      });
      // Navigation is automatically handled by RootNavigator based on authenticated backend role
    } catch (error: any) {
      setErrorMessage(error.message || 'Invalid User ID or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F8FC" />

      {/* Top-Right Background Watermark Graphic (Government Dome & Security Badge) */}
      <View style={styles.backgroundGraphicWrapper} pointerEvents="none">
        <Svg width="260" height="240" viewBox="0 0 260 240" fill="none">
          {/* Government Building Dome Silhouette */}
          <G opacity="0.12" fill="#1E4E79">
            {/* Dome Arc */}
            <Path d="M160 80 C160 40 220 40 220 80 Z" />
            <Rect x="156" y="80" width="68" height="12" rx="2" />
            {/* Pillars */}
            <Rect x="162" y="92" width="6" height="40" />
            <Rect x="176" y="92" width="6" height="40" />
            <Rect x="190" y="92" width="6" height="40" />
            <Rect x="204" y="92" width="6" height="40" />
            <Rect x="214" y="92" width="6" height="40" />
            {/* Base building */}
            <Rect x="150" y="132" width="90" height="40" rx="2" />
            {/* Flagpole on Dome */}
            <Path d="M190 40 V20" stroke="#1E4E79" strokeWidth="1.5" />
            <Rect x="190" y="20" width="10" height="6" fill="#F28C28" />
          </G>

          {/* Large Translucent Security Shield Watermark */}
          <G transform="translate(100, 10)">
            <Path
              d="M50 8L86 24V56C86 82 68 100 50 106C32 100 14 82 14 56V24L50 8Z"
              fill="#E0EEFA"
              opacity="0.6"
              stroke="#CBD5E1"
              strokeWidth="1.5"
            />
            {/* Silhouette Inside Shield */}
            <Circle cx="50" cy="45" r="12" fill="#93C5FD" opacity="0.7" />
            <Path
              d="M32 76C32 64 40 60 50 60C60 60 68 64 68 76 Z"
              fill="#93C5FD"
              opacity="0.7"
            />
          </G>
        </Svg>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>
              {/* 1. Header: PEHCHAAN Brand & Government of India */}
              <View style={styles.headerBar}>
                {/* Shield Emblem */}
                <View style={styles.brandLogoBox}>
                  <Svg width="40" height="44" viewBox="0 0 100 110" fill="none">
                    <Path
                      d="M50 6L88 20V54C88 80 70 98 50 104C30 98 12 80 12 54V20L50 6Z"
                      fill="#0F2B48"
                    />
                    {/* Inner Person Silhouette */}
                    <Circle cx="50" cy="42" r="13" fill="#FFFFFF" />
                    <Path
                      d="M28 76C28 62 38 56 50 56C62 56 72 62 72 76 Z"
                      fill="#FFFFFF"
                    />
                    {/* Bottom Tricolor Identity Accents */}
                    <Rect x="32" y="86" width="16" height="3" rx="1.5" fill="#F28C28" />
                    <Rect x="52" y="86" width="16" height="3" rx="1.5" fill="#138A4B" />
                  </Svg>
                </View>

                {/* Brand Text & Government Title */}
                <View style={styles.brandTextColumn}>
                  <Text style={styles.brandName}>PEHCHAAN</Text>
                  <View style={styles.govRow}>
                    <View style={styles.flagBar}>
                      <View style={styles.flagOrange} />
                      <View style={styles.flagGreen} />
                    </View>
                    <Text style={styles.govSubtitle}>GOVERNMENT OF INDIA</Text>
                  </View>
                </View>
              </View>

              {/* 2. Welcome Titles */}
              <View style={styles.titleSection}>
                <Text style={styles.welcomeTitle}>Welcome Back!</Text>
                <Text style={styles.welcomeSubtitle}>Sign in to continue to your account</Text>
              </View>

              {/* General Error Banner */}
              {!!errorMessage && (
                <View style={styles.errorBanner}>
                  <AlertCircle size={16} color={colors.danger} />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              )}

              {/* 3. Main Login Card (Matching Reference Design) */}
              <View style={styles.loginCard}>
                {/* Field 1: Email / Officer ID */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.fieldLabel}>Email / Officer ID</Text>
                    <User size={16} color="#94A3B8" />
                  </View>
                  <View style={[styles.inputBox, !!userIdError && styles.inputBoxError]}>
                    <Mail size={18} color="#2563EB" style={styles.inputLeadingIcon} />
                    <TextInput
                      ref={userIdRef}
                      value={userId}
                      onChangeText={(text) => {
                        setUserId(text);
                        if (userIdError) setUserIdError('');
                        if (errorMessage) setErrorMessage('');
                      }}
                      placeholder="e.g. 4545 or OFF-8842"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={() => passwordRef.current?.focus()}
                      blurOnSubmit={false}
                      style={styles.textInput}
                      editable={!loading}
                    />
                  </View>
                  {!!userIdError && <Text style={styles.fieldErrorText}>{userIdError}</Text>}
                </View>

                {/* Field 2: Password */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.fieldLabel}>Password</Text>
                    <Lock size={16} color="#94A3B8" />
                  </View>
                  <View style={[styles.inputBox, !!passwordError && styles.inputBoxError]}>
                    <Lock size={18} color="#2563EB" style={styles.inputLeadingIcon} />
                    <TextInput
                      ref={passwordRef}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (passwordError) setPasswordError('');
                        if (errorMessage) setErrorMessage('');
                      }}
                      placeholder="Enter password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                      style={styles.textInput}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeToggleBtn}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff size={19} color="#0F172A" />
                      ) : (
                        <Eye size={19} color="#0F172A" />
                      )}
                    </TouchableOpacity>
                  </View>
                  {!!passwordError && <Text style={styles.fieldErrorText}>{passwordError}</Text>}
                </View>

                {/* Field 3: Login as (Role Selector Buttons) */}
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Login as</Text>
                  <View style={styles.roleSelectionRow}>
                    {/* Officer Button */}
                    <TouchableOpacity
                      style={[
                        styles.roleCard,
                        selectedRole === 'OFFICER' ? styles.roleCardActive : styles.roleCardInactive,
                      ]}
                      onPress={() => {
                        setSelectedRole('OFFICER');
                        if (errorMessage) setErrorMessage('');
                      }}
                      activeOpacity={0.85}
                    >
                      <Shield
                        size={18}
                        color={selectedRole === 'OFFICER' ? '#FFFFFF' : '#1E293B'}
                      />
                      <Text
                        style={[
                          styles.roleCardText,
                          selectedRole === 'OFFICER'
                            ? styles.roleCardTextActive
                            : styles.roleCardTextInactive,
                        ]}
                      >
                        Officer
                      </Text>
                      {selectedRole === 'OFFICER' && (
                        <View style={styles.activeCheckBadge}>
                          <Check size={11} color="#1D4ED8" strokeWidth={3.5} />
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Supervisor Button */}
                    <TouchableOpacity
                      style={[
                        styles.roleCard,
                        selectedRole === 'SUPERVISOR' ? styles.roleCardActive : styles.roleCardInactive,
                      ]}
                      onPress={() => {
                        setSelectedRole('SUPERVISOR');
                        if (errorMessage) setErrorMessage('');
                      }}
                      activeOpacity={0.85}
                    >
                      <User
                        size={18}
                        color={selectedRole === 'SUPERVISOR' ? '#FFFFFF' : '#1E293B'}
                      />
                      <Text
                        style={[
                          styles.roleCardText,
                          selectedRole === 'SUPERVISOR'
                            ? styles.roleCardTextActive
                            : styles.roleCardTextInactive,
                        ]}
                      >
                        Supervisor
                      </Text>
                      {selectedRole === 'SUPERVISOR' && (
                        <View style={styles.activeCheckBadge}>
                          <Check size={11} color="#1D4ED8" strokeWidth={3.5} />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 4. Login Action Button (With Lock on Left and Arrow on Right) */}
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={loading}
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  {loading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.loginButtonText}>Authenticating...</Text>
                    </View>
                  ) : (
                    <View style={styles.loginButtonContent}>
                      <Lock size={18} color="#FFFFFF" style={styles.btnLeftIcon} />
                      <Text style={styles.loginButtonText}>Login</Text>
                      <ChevronRight size={18} color="#FFFFFF" style={styles.btnRightIcon} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* 5. OR Divider */}
                <View style={styles.orDividerRow}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>OR</Text>
                  <View style={styles.orLine} />
                </View>

                {/* 6. Create Account Link */}
                <View style={styles.createAccountRow}>
                  <Text style={styles.createAccountPrompt}>Don't have an account? </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Register')}
                    activeOpacity={0.7}
                    style={styles.createAccountBtn}
                  >
                    <Text style={styles.createAccountLink}>Create Account</Text>
                    <ChevronRight size={13} color="#1D4ED8" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 4. Bottom 3 Value Props / Feature Cards */}
              <View style={styles.bottomFeaturesRow}>
                {/* Feature 1: Secure */}
                <View style={styles.bottomFeatureCard}>
                  <View style={styles.bottomFeatureIconBox}>
                    <ShieldCheck size={18} color="#0F172A" />
                  </View>
                  <View style={styles.bottomFeatureTextCol}>
                    <Text style={styles.bottomFeatureTitle}>Secure</Text>
                    <Text style={styles.bottomFeatureSub}>Your data is protected</Text>
                  </View>
                </View>

                {/* Feature 2: Trusted */}
                <View style={styles.bottomFeatureCard}>
                  <View style={styles.bottomFeatureIconBox}>
                    <ShieldCheck size={18} color="#0F172A" />
                  </View>
                  <View style={styles.bottomFeatureTextCol}>
                    <Text style={styles.bottomFeatureTitle}>Trusted</Text>
                    <Text style={styles.bottomFeatureSub}>Government verified access</Text>
                  </View>
                </View>

                {/* Feature 3: Simple */}
                <View style={styles.bottomFeatureCard}>
                  <View style={styles.bottomFeatureIconBox}>
                    <User size={18} color="#0F172A" />
                  </View>
                  <View style={styles.bottomFeatureTextCol}>
                    <Text style={styles.bottomFeatureTitle}>Simple</Text>
                    <Text style={styles.bottomFeatureSub}>One login for all services</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F6FC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    position: 'relative',
  },

  /* Background Watermark Graphic */
  backgroundGraphicWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: -1,
  },

  /* 1. Header */
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingTop: 4,
  },
  brandLogoBox: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTextColumn: {
    justifyContent: 'center',
  },
  brandName: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 22,
    fontWeight: '800',
    color: '#0F2B48',
    letterSpacing: 1.5,
  },
  govRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  flagBar: {
    width: 14,
    height: 6,
    justifyContent: 'space-between',
  },
  flagOrange: {
    width: 14,
    height: 2.5,
    backgroundColor: '#F28C28',
    borderRadius: 1,
  },
  flagGreen: {
    width: 14,
    height: 2.5,
    backgroundColor: '#138A4B',
    borderRadius: 1,
  },
  govSubtitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },

  /* 2. Welcome Title */
  titleSection: {
    marginBottom: 18,
  },
  welcomeTitle: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: '#64748B',
  },

  /* Error Banner */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: colors.danger,
    lineHeight: 18,
  },

  /* 3. Main Login Card */
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginBottom: 18,
    ...shadows.soft,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  inputBox: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  inputBoxError: {
    borderColor: colors.danger,
    backgroundColor: '#FFFBFB',
  },
  inputLeadingIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontFamily: typography.body.fontFamily,
    fontSize: 15,
    color: '#0F172A',
  },
  eyeToggleBtn: {
    padding: 6,
  },
  fieldErrorText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },

  /* Role Selection */
  roleSelectionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  roleCard: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'relative',
  },
  roleCardActive: {
    backgroundColor: '#1D4ED8',
    ...shadows.soft,
  },
  roleCardInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleCardText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 14,
    fontWeight: '700',
  },
  roleCardTextActive: {
    color: '#FFFFFF',
  },
  roleCardTextInactive: {
    color: '#0F172A',
  },
  activeCheckBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },

  /* Login Button */
  loginButton: {
    height: 52,
    backgroundColor: '#1D4ED8',
    borderRadius: 14,
    justifyContent: 'center',
    marginTop: 6,
    ...shadows.soft,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  btnLeftIcon: {
    width: 24,
  },
  btnRightIcon: {
    width: 24,
  },
  loginButtonText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  /* OR Divider */
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    gap: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },

  /* Create Account Row */
  createAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createAccountPrompt: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: '#64748B',
  },
  createAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  createAccountLink: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },

  /* 4. Bottom 3 Feature Cards */
  bottomFeaturesRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  bottomFeatureCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    ...shadows.soft,
  },
  bottomFeatureIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomFeatureTextCol: {
    flex: 1,
  },
  bottomFeatureTitle: {
    fontFamily: typography.label.fontFamily,
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 1,
  },
  bottomFeatureSub: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 9,
    color: '#64748B',
    lineHeight: 12,
  },
});

export default LoginScreen;
