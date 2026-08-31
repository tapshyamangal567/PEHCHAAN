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
import {
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Layers,
} from 'lucide-react-native';
import { AuthStackParamList } from '../../../navigation/types';
import { colors, typography, radius, shadows } from '../../../theme';
import { UserRole } from '../../../types/auth';
import { AuthService } from '../../../services/authService';

type RegisterNavProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen = () => {
  const navigation = useNavigation<RegisterNavProp>();

  // Selected Account Type
  const [selectedRole, setSelectedRole] = useState<UserRole>('OFFICER');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [officialId, setOfficialId] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Field Refs for smooth keyboard navigation
  const officialIdRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const departmentRef = useRef<TextInput>(null);
  const designationRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const validateForm = (): boolean => {
    setErrorMessage('');

    // Check empty required fields
    if (
      !fullName.trim() ||
      !officialId.trim() ||
      !email.trim() ||
      !department.trim() ||
      !designation.trim() ||
      !phoneNumber.trim() ||
      !password ||
      !confirmPassword
    ) {
      setErrorMessage('Please fill in all required fields.');
      return false;
    }

    // Email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return false;
    }

    // Password criteria (8+ chars, upper, lower, digit, special)
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/]/.test(password)
    ) {
      setErrorMessage(
        'Password does not meet the required requirements (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character).'
      );
      return false;
    }

    // Password match
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    Keyboard.dismiss();
    setLoading(true);
    setErrorMessage('');

    try {
      await AuthService.register({
        fullName: fullName.trim(),
        officialId: officialId.trim(),
        email: email.trim(),
        department: department.trim(),
        designation: designation.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
        role: selectedRole,
      });

      setRegistrationSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to PEHCHAAN server. Please check your connection and try again.');
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
              {/* Back Button */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <ArrowLeft size={18} color={colors.primaryNavy} />
                <Text style={styles.backButtonText}>Back to Login</Text>
              </TouchableOpacity>

              {/* SUCCESS CONFIRMATION STATE */}
              {registrationSuccess ? (
                <View style={styles.successCard}>
                  <View style={styles.successIconCircle}>
                    <CheckCircle2 size={48} color="#16A34A" />
                  </View>
                  <Text style={styles.successTitle}>Account Created Successfully ✓</Text>
                  <Text style={styles.successSub}>
                    Your PEHCHAAN personnel account has been registered successfully.
                  </Text>

                  <View style={styles.successInfoBox}>
                    <Text style={styles.successInfoRow}>
                      <Text style={styles.successInfoLabel}>Name: </Text>
                      {fullName}
                    </Text>
                    <Text style={styles.successInfoRow}>
                      <Text style={styles.successInfoLabel}>Official ID: </Text>
                      {officialId}
                    </Text>
                    <Text style={styles.successInfoRow}>
                      <Text style={styles.successInfoLabel}>Role: </Text>
                      {selectedRole === 'OFFICER' ? 'Investigating Officer' : 'Supervisor'}
                    </Text>
                    <Text style={styles.successInfoRow}>
                      <Text style={styles.successInfoLabel}>Department: </Text>
                      {department}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => navigation.navigate('Login')}
                    style={styles.primaryBtn}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryBtnText}>Go to Login</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* REGISTRATION FORM */
                <View style={styles.card}>
                  <Text style={styles.title}>Create PEHCHAAN Account</Text>
                  <Text style={styles.subtitle}>Select account type</Text>

                  {/* 1. Account Type Selection */}
                  <View style={styles.roleSelectionRow}>
                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        selectedRole === 'OFFICER' && styles.roleButtonActive,
                      ]}
                      onPress={() => {
                        setSelectedRole('OFFICER');
                        setErrorMessage('');
                      }}
                      activeOpacity={0.8}
                    >
                      <ShieldCheck
                        size={18}
                        color={selectedRole === 'OFFICER' ? colors.primaryNavy : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.roleButtonText,
                          selectedRole === 'OFFICER' && styles.roleButtonTextActive,
                        ]}
                      >
                        Investigating Officer
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        selectedRole === 'SUPERVISOR' && styles.roleButtonActive,
                      ]}
                      onPress={() => {
                        setSelectedRole('SUPERVISOR');
                        setErrorMessage('');
                      }}
                      activeOpacity={0.8}
                    >
                      <Layers
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

                  {/* Error Banner */}
                  {!!errorMessage && (
                    <View style={styles.errorBanner}>
                      <AlertCircle size={16} color={colors.danger} />
                      <Text style={styles.errorBannerText}>{errorMessage}</Text>
                    </View>
                  )}

                  {/* Form Fields */}
                  <View style={styles.fieldsContainer}>
                    {/* Full Name */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Full Name *</Text>
                      <TextInput
                        value={fullName}
                        onChangeText={(t) => {
                          setFullName(t);
                          if (errorMessage) setErrorMessage('');
                        }}
                        placeholder="Enter your full name"
                        placeholderTextColor="#94A3B8"
                        returnKeyType="next"
                        onSubmitEditing={() => officialIdRef.current?.focus()}
                        blurOnSubmit={false}
                        style={styles.input}
                        editable={!loading}
                      />
                    </View>

                    {/* Official ID */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>
                        {selectedRole === 'OFFICER' ? 'Officer ID *' : 'Supervisor ID *'}
                      </Text>
                      <TextInput
                        ref={officialIdRef}
                        value={officialId}
                        onChangeText={(t) => {
                          setOfficialId(t);
                          if (errorMessage) setErrorMessage('');
                        }}
                        placeholder={selectedRole === 'OFFICER' ? 'e.g. OFF-8842' : 'e.g. SUP-1090'}
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="characters"
                        autoCorrect={false}
                        returnKeyType="next"
                        onSubmitEditing={() => emailRef.current?.focus()}
                        blurOnSubmit={false}
                        style={styles.input}
                        editable={!loading}
                      />
                    </View>

                    {/* Official Email */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Official Email *</Text>
                      <TextInput
                        ref={emailRef}
                        value={email}
                        onChangeText={(t) => {
                          setEmail(t);
                          if (errorMessage) setErrorMessage('');
                        }}
                        placeholder="e.g. name@border.pehchaan.gov.in"
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        returnKeyType="next"
                        onSubmitEditing={() => departmentRef.current?.focus()}
                        blurOnSubmit={false}
                        style={styles.input}
                        editable={!loading}
                      />
                    </View>

                    {/* Department / Unit */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Department / Unit *</Text>
                      <TextInput
                        ref={departmentRef}
                        value={department}
                        onChangeText={(t) => {
                          setDepartment(t);
                          if (errorMessage) setErrorMessage('');
                        }}
                        placeholder="e.g. Border Checkpoint Alpha"
                        placeholderTextColor="#94A3B8"
                        returnKeyType="next"
                        onSubmitEditing={() => designationRef.current?.focus()}
                        blurOnSubmit={false}
                        style={styles.input}
                        editable={!loading}
                      />
                    </View>

                    {/* Designation */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Designation *</Text>
                      <TextInput
                        ref={designationRef}
                        value={designation}
                        onChangeText={(t) => {
                          setDesignation(t);
                          if (errorMessage) setErrorMessage('');
                        }}
                        placeholder={
                          selectedRole === 'OFFICER'
                            ? 'e.g. Senior Investigating Officer'
                            : 'e.g. Security Supervisor'
                        }
                        placeholderTextColor="#94A3B8"
                        returnKeyType="next"
                        onSubmitEditing={() => phoneRef.current?.focus()}
                        blurOnSubmit={false}
                        style={styles.input}
                        editable={!loading}
                      />
                    </View>

                    {/* Phone Number */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Phone Number *</Text>
                      <TextInput
                        ref={phoneRef}
                        value={phoneNumber}
                        onChangeText={(t) => {
                          setPhoneNumber(t);
                          if (errorMessage) setErrorMessage('');
                        }}
                        placeholder="e.g. 9876543210"
                        placeholderTextColor="#94A3B8"
                        keyboardType="phone-pad"
                        returnKeyType="next"
                        onSubmitEditing={() => passwordRef.current?.focus()}
                        blurOnSubmit={false}
                        style={styles.input}
                        editable={!loading}
                      />
                    </View>

                    {/* Password */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Password *</Text>
                      <View style={styles.passwordWrapper}>
                        <TextInput
                          ref={passwordRef}
                          value={password}
                          onChangeText={(t) => {
                            setPassword(t);
                            if (errorMessage) setErrorMessage('');
                          }}
                          placeholder="Min 8 chars with uppercase, number & symbol"
                          placeholderTextColor="#94A3B8"
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="next"
                          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                          blurOnSubmit={false}
                          style={styles.passwordInput}
                          editable={!loading}
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword(!showPassword)}
                          style={styles.eyeBtn}
                          activeOpacity={0.7}
                        >
                          {showPassword ? (
                            <EyeOff size={18} color="#64748B" />
                          ) : (
                            <Eye size={18} color="#64748B" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Confirm Password *</Text>
                      <View style={styles.passwordWrapper}>
                        <TextInput
                          ref={confirmPasswordRef}
                          value={confirmPassword}
                          onChangeText={(t) => {
                            setConfirmPassword(t);
                            if (errorMessage) setErrorMessage('');
                          }}
                          placeholder="Re-enter password"
                          placeholderTextColor="#94A3B8"
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="done"
                          onSubmitEditing={handleRegister}
                          style={styles.passwordInput}
                          editable={!loading}
                        />
                        <TouchableOpacity
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={styles.eyeBtn}
                          activeOpacity={0.7}
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={18} color="#64748B" />
                          ) : (
                            <Eye size={18} color="#64748B" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                      onPress={handleRegister}
                      disabled={loading}
                      style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                      activeOpacity={0.85}
                    >
                      {loading ? (
                        <View style={styles.loadingRow}>
                          <ActivityIndicator size="small" color="#FFFFFF" />
                          <Text style={styles.primaryBtnText}>Creating Account...</Text>
                        </View>
                      ) : (
                        <Text style={styles.primaryBtnText}>Create Account</Text>
                      )}
                    </TouchableOpacity>

                    {/* Already have an account */}
                    <View style={styles.footerRow}>
                      <Text style={styles.footerText}>Already have an account? </Text>
                      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.footerLink}>Login</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
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
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryNavy,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.soft,
  },
  title: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },

  /* Role Selection */
  roleSelectionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  roleButtonActive: {
    borderColor: colors.primaryNavy,
    backgroundColor: '#EFF6FF',
  },
  roleButtonText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  roleButtonTextActive: {
    color: colors.primaryNavy,
    fontWeight: '700',
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
  fieldsContainer: {
    gap: 14,
  },
  inputGroup: {
    gap: 5,
  },
  label: {
    fontFamily: typography.label.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  input: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: typography.body.fontFamily,
    color: '#0F172A',
  },
  passwordWrapper: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontFamily: typography.body.fontFamily,
    color: '#0F172A',
    padding: 0,
  },
  eyeBtn: {
    paddingLeft: 8,
  },

  /* Primary Button */
  primaryBtn: {
    height: 50,
    backgroundColor: colors.primaryNavy,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    ...shadows.soft,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  /* Footer */
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  footerText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: '#64748B',
  },
  footerLink: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryNavy,
  },

  /* Success Card */
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    ...shadows.soft,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryNavy,
    textAlign: 'center',
  },
  successSub: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  successInfoBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    marginBottom: 20,
  },
  successInfoRow: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: '#1E293B',
  },
  successInfoLabel: {
    fontWeight: '700',
    color: '#64748B',
  },
});

export default RegisterScreen;
