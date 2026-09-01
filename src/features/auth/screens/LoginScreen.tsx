import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Eye, EyeOff, AlertCircle, Shield, UserCheck } from 'lucide-react-native';
import { AuthStackParamList } from '../../../navigation/types';
import { AppLogo } from '../../../components/ui/AppLogo';
import { colors, typography, radius, shadows } from '../../../theme';
import { UserRole } from '../../../types/auth';
import { AuthService } from '../../../services/authService';

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen = () => {
  const navigation = useNavigation<LoginNavProp>();

  // Selected Role (Default: OFFICER)
  const [selectedRole, setSelectedRole] = useState<UserRole>('OFFICER');

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

    // Dismiss keyboard on submit
    Keyboard.dismiss();
    setLoading(true);

    try {
      await AuthService.login({
        username: userId.trim(),
        password: password,
        role: selectedRole,
      });
      // Navigation is automatically handled by RootNavigator based on the authenticated backend role
    } catch (error: any) {
      setErrorMessage(error.message || 'Invalid User ID or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

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
            <View style={styles.contentContainer}>
              {/* Header: Logo, Title, Welcome Back */}
              <View style={styles.headerContainer}>
                <AppLogo size="md" align="center" showTagline={false} />
                <Text style={styles.brandTitle}>PEHCHAAN</Text>
                <Text style={styles.welcomeTitle}>Welcome Back</Text>
                <Text style={styles.welcomeSubtitle}>Sign in to continue</Text>
              </View>

              {/* General Error Banner */}
              {!!errorMessage && (
                <View style={styles.errorBanner}>
                  <AlertCircle size={16} color={colors.danger} />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              )}

              {/* Form Section */}
              <View style={styles.formContainer}>
                {/* 1. Official ID / Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email / Officer ID</Text>
                  <TextInput
                    ref={userIdRef}
                    value={userId}
                    onChangeText={(text) => {
                      setUserId(text);
                      if (userIdError) setUserIdError('');
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Enter your Official ID or Email"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    blurOnSubmit={false}
                    style={[styles.input, !!userIdError && styles.inputError]}
                    editable={!loading}
                  />
                  {!!userIdError && <Text style={styles.fieldErrorText}>{userIdError}</Text>}
                </View>

                {/* 2. Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={[styles.passwordWrapper, !!passwordError && styles.inputError]}>
                    <TextInput
                      ref={passwordRef}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (passwordError) setPasswordError('');
                        if (errorMessage) setErrorMessage('');
                      }}
                      placeholder="Enter your password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                      style={styles.passwordInput}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#64748B" />
                      ) : (
                        <Eye size={20} color="#64748B" />
                      )}
                    </TouchableOpacity>
                  </View>
                  {!!passwordError && <Text style={styles.fieldErrorText}>{passwordError}</Text>}
                </View>

                {/* 3. Role Selection: Login as (Above the Login button) */}
                <View style={styles.roleSelectionContainer}>
                  <Text style={styles.roleSectionLabel}>Login as</Text>
                  <View style={styles.roleSelectionRow}>
                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        selectedRole === 'OFFICER' && styles.roleButtonActive,
                      ]}
                      onPress={() => {
                        setSelectedRole('OFFICER');
                        if (errorMessage) setErrorMessage('');
                      }}
                      activeOpacity={0.8}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selectedRole === 'OFFICER' }}
                    >
                      <Shield
                        size={18}
                        color={selectedRole === 'OFFICER' ? colors.primaryNavy : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.roleButtonText,
                          selectedRole === 'OFFICER' && styles.roleButtonTextActive,
                        ]}
                      >
                        Officer
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        selectedRole === 'SUPERVISOR' && styles.roleButtonActive,
                      ]}
                      onPress={() => {
                        setSelectedRole('SUPERVISOR');
                        if (errorMessage) setErrorMessage('');
                      }}
                      activeOpacity={0.8}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selectedRole === 'SUPERVISOR' }}
                    >
                      <UserCheck
                        size={18}
                        color={selectedRole === 'SUPERVISOR' ? colors.primaryNavy : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.roleButtonText,
                          selectedRole === 'SUPERVISOR' && styles.roleButtonTextActive,
                        ]}
                      >
                        Supervisor
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 4. Login Button */}
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={loading}
                  style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  {loading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.loginBtnText}>Signing in...</Text>
                    </View>
                  ) : (
                    <Text style={styles.loginBtnText}>Login</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Footer: Create Account Link */}
              <View style={styles.footerContainer}>
                <Text style={styles.footerPrompt}>Don't have an account? </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Register')}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.createAccountLink}>Create Account</Text>
                </TouchableOpacity>
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
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },

  /* Header */
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandTitle: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 26,
    fontWeight: '800',
    color: colors.primaryNavy,
    letterSpacing: 2,
    marginTop: 8,
    textAlign: 'center',
  },
  welcomeTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },

  /* Error Banner */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: colors.danger,
    lineHeight: 18,
  },

  /* Form */
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontFamily: typography.label.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  input: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: typography.body.fontFamily,
    color: '#0F172A',
  },
  passwordWrapper: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontFamily: typography.body.fontFamily,
    color: '#0F172A',
    padding: 0,
  },
  eyeBtn: {
    paddingLeft: 10,
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: '#FFFBFB',
  },
  fieldErrorText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.danger,
    marginTop: 2,
  },

  /* Role Selection */
  roleSelectionContainer: {
    gap: 6,
    marginTop: 2,
  },
  roleSectionLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  roleSelectionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  roleButtonActive: {
    borderWidth: 1.5,
    borderColor: colors.primaryNavy,
    backgroundColor: '#EFF6FF',
  },
  roleButtonText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  roleButtonTextActive: {
    color: colors.primaryNavy,
    fontWeight: '700',
  },

  /* Login Button */
  loginBtn: {
    height: 50,
    backgroundColor: colors.primaryNavy,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    ...shadows.soft,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginBtnText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  /* Footer */
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
    paddingVertical: 8,
  },
  footerPrompt: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: '#64748B',
  },
  createAccountLink: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
});

export default LoginScreen;
