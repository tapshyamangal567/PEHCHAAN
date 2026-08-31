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
import { Eye, EyeOff, AlertCircle } from 'lucide-react-native';
import { AuthStackParamList } from '../../../navigation/types';
import { AppLogo } from '../../../components/ui/AppLogo';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { AuthService } from '../../../services/authService';

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen = () => {
  const navigation = useNavigation<LoginNavProp>();

  // Input States
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Errors
  const [userIdError, setUserIdError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Refs for seamless keyboard navigation
  const userIdRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    let isValid = true;
    setErrorMessage('');

    if (!userId.trim()) {
      setUserIdError('Please enter your User ID.');
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
      });
      // Navigation is automatically handled by RootNavigator based on role returned by backend
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
              {/* Header: PEHCHAAN Branding */}
              <View style={styles.headerContainer}>
                <AppLogo size="md" align="center" showTagline={false} />
                <Text style={styles.brandTitle}>PEHCHAAN</Text>
                <Text style={styles.brandSubtitle}>Secure Personnel Access</Text>
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
                {/* 1. Official User ID Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Official User ID</Text>
                  <TextInput
                    ref={userIdRef}
                    value={userId}
                    onChangeText={(text) => {
                      setUserId(text);
                      if (userIdError) setUserIdError('');
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Enter your User ID"
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

                {/* 2. Password Field */}
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

                {/* 3. Login Button */}
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
    marginBottom: 32,
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
  brandSubtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
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
    marginBottom: 20,
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
    gap: 18,
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
