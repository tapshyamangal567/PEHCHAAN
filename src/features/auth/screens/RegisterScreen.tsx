import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../navigation/types';
import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { AppLogo } from '../../../components/ui/AppLogo';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { useAuthStore, MOCK_OFFICER_USER, MOCK_SUPERVISOR_USER } from '../../../store/useAuthStore';
import { UserRole } from '../../../types/auth';
import { FadeInView, SlideUpView, ScalePressable } from '../../../utils/animations';
import {
  User,
  BadgeCheck,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  Check,
  KeyRound,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react-native';

type RegisterNavProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen = () => {
  const navigation = useNavigation<RegisterNavProp>();
  const { login } = useAuthStore();

  // Form State
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('OFFICER');
  const [supervisorCode, setSupervisorCode] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Focus states
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Errors & Loading
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!employeeId.trim()) newErrors.employeeId = 'Employee ID is required';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Valid official email is required';
    if (!mobileNumber.trim() || mobileNumber.length < 10) newErrors.mobileNumber = 'Valid 10-digit mobile number required';
    if (!password || password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (selectedRole === 'SUPERVISOR' && !supervisorCode.trim()) {
      newErrors.supervisorCode = 'Supervisor authorization key is required for supervisor accounts';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = () => {
    if (!validateForm()) return;

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const newUser = selectedRole === 'OFFICER'
        ? { ...MOCK_OFFICER_USER, name: fullName, id: employeeId, email }
        : { ...MOCK_SUPERVISOR_USER, name: fullName, id: employeeId, email };

      login(selectedRole, newUser);
    }, 800);
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      {/* Background Security Ambient Glows */}
      <View style={styles.ambientGlowTop} />
      
      {/* Top Header Row with Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to login"
        >
          <ArrowLeft size={20} color={colors.primaryNavy} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>PEHCHAAN Identity Registration</Text>
      </View>

      {/* Brand Logo Header */}
      <FadeInView delay={100} style={styles.brandHeader}>
        <AppLogo size="sm" showTagline={false} align="center" />
      </FadeInView>

      {/* Screen Title */}
      <SlideUpView delay={150} style={styles.titleSection}>
        <Text style={[typography.h2, styles.mainTitle]}>Create Account</Text>
        <Text style={[typography.subtitle, styles.subTitle]}>
          Register for official document verification access
        </Text>
      </SlideUpView>

      {/* Main Registration Form Card */}
      <SlideUpView delay={200} style={styles.formCard}>
        {/* 1. Full Name */}
        <View style={styles.inputGroup}>
          <Text style={typography.label}>FULL NAME</Text>
          <View
            style={[
              styles.inputWrapper,
              focusedField === 'fullName' && styles.inputFocused,
              !!errors.fullName && styles.inputError,
            ]}
          >
            <User size={18} color={focusedField === 'fullName' ? colors.primaryNavy : colors.mutedText} />
            <TextInput
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (errors.fullName) setErrors({ ...errors, fullName: '' });
              }}
              onFocus={() => setFocusedField('fullName')}
              onBlur={() => setFocusedField(null)}
              placeholder="Enter your full official name"
              placeholderTextColor={colors.mutedText}
              style={styles.textInput}
            />
          </View>
          {!!errors.fullName && (
            <View style={styles.errorRow}>
              <AlertCircle size={13} color={colors.danger} />
              <Text style={styles.errorText}>{errors.fullName}</Text>
            </View>
          )}
        </View>

        {/* 2. Employee ID */}
        <View style={styles.inputGroup}>
          <Text style={typography.label}>EMPLOYEE / OFFICER ID</Text>
          <View
            style={[
              styles.inputWrapper,
              focusedField === 'employeeId' && styles.inputFocused,
              !!errors.employeeId && styles.inputError,
            ]}
          >
            <BadgeCheck size={18} color={focusedField === 'employeeId' ? colors.primaryNavy : colors.mutedText} />
            <TextInput
              value={employeeId}
              onChangeText={(text) => {
                setEmployeeId(text);
                if (errors.employeeId) setErrors({ ...errors, employeeId: '' });
              }}
              onFocus={() => setFocusedField('employeeId')}
              onBlur={() => setFocusedField(null)}
              placeholder="Enter official ID (e.g. IND-8842)"
              placeholderTextColor={colors.mutedText}
              style={styles.textInput}
              autoCapitalize="characters"
            />
          </View>
          {!!errors.employeeId && (
            <View style={styles.errorRow}>
              <AlertCircle size={13} color={colors.danger} />
              <Text style={styles.errorText}>{errors.employeeId}</Text>
            </View>
          )}
        </View>

        {/* 3. Official Email */}
        <View style={styles.inputGroup}>
          <Text style={typography.label}>OFFICIAL EMAIL</Text>
          <View
            style={[
              styles.inputWrapper,
              focusedField === 'email' && styles.inputFocused,
              !!errors.email && styles.inputError,
            ]}
          >
            <Mail size={18} color={focusedField === 'email' ? colors.primaryNavy : colors.mutedText} />
            <TextInput
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              placeholder="name@pehchaan.gov.in"
              placeholderTextColor={colors.mutedText}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.textInput}
            />
          </View>
          {!!errors.email && (
            <View style={styles.errorRow}>
              <AlertCircle size={13} color={colors.danger} />
              <Text style={styles.errorText}>{errors.email}</Text>
            </View>
          )}
        </View>

        {/* 4. Mobile Number */}
        <View style={styles.inputGroup}>
          <Text style={typography.label}>MOBILE NUMBER</Text>
          <View
            style={[
              styles.inputWrapper,
              focusedField === 'mobileNumber' && styles.inputFocused,
              !!errors.mobileNumber && styles.inputError,
            ]}
          >
            <Phone size={18} color={focusedField === 'mobileNumber' ? colors.primaryNavy : colors.mutedText} />
            <TextInput
              value={mobileNumber}
              onChangeText={(text) => {
                setMobileNumber(text);
                if (errors.mobileNumber) setErrors({ ...errors, mobileNumber: '' });
              }}
              onFocus={() => setFocusedField('mobileNumber')}
              onBlur={() => setFocusedField(null)}
              placeholder="Enter 10-digit phone number"
              placeholderTextColor={colors.mutedText}
              keyboardType="phone-pad"
              style={styles.textInput}
            />
          </View>
          {!!errors.mobileNumber && (
            <View style={styles.errorRow}>
              <AlertCircle size={13} color={colors.danger} />
              <Text style={styles.errorText}>{errors.mobileNumber}</Text>
            </View>
          )}
        </View>

        {/* 5. Role Selection Cards */}
        <View style={styles.roleContainer}>
          <Text style={[typography.label, styles.roleHeaderLabel]}>SELECT YOUR ROLE</Text>
          <View style={styles.roleGrid}>
            {/* OFFICER CARD */}
            <ScalePressable
              onPress={() => setSelectedRole('OFFICER')}
              activeScale={0.97}
              style={[
                styles.roleCard,
                selectedRole === 'OFFICER' ? styles.roleCardActive : styles.roleCardInactive,
              ]}
            >
              <View style={styles.roleCardTop}>
                <Text style={[styles.roleTitle, selectedRole === 'OFFICER' && styles.roleTitleActive]}>
                  OFFICER
                </Text>
                {selectedRole === 'OFFICER' && (
                  <View style={styles.checkBadge}>
                    <Check size={12} color={colors.white} />
                  </View>
                )}
              </View>
              <Text style={styles.roleSubtitle}>Document Verification & Processing</Text>
            </ScalePressable>

            {/* SUPERVISOR CARD */}
            <ScalePressable
              onPress={() => setSelectedRole('SUPERVISOR')}
              activeScale={0.97}
              style={[
                styles.roleCard,
                selectedRole === 'SUPERVISOR' ? styles.roleCardActive : styles.roleCardInactive,
              ]}
            >
              <View style={styles.roleCardTop}>
                <Text style={[styles.roleTitle, selectedRole === 'SUPERVISOR' && styles.roleTitleActive]}>
                  SUPERVISOR
                </Text>
                {selectedRole === 'SUPERVISOR' && (
                  <View style={styles.checkBadge}>
                    <Check size={12} color={colors.white} />
                  </View>
                )}
              </View>
              <Text style={styles.roleSubtitle}>Review, Approval & Management</Text>
            </ScalePressable>
          </View>
        </View>

        {/* Conditional Supervisor Authorization Field */}
        {selectedRole === 'SUPERVISOR' && (
          <SlideUpView delay={100} style={styles.inputGroup}>
            <View style={styles.labelWithBadge}>
              <Text style={typography.label}>SUPERVISOR AUTHORIZATION</Text>
              <Text style={styles.authBadge}>VERIFICATION REQUIRED</Text>
            </View>
            <View
              style={[
                styles.inputWrapper,
                styles.inputWrapperAuth,
                focusedField === 'supervisorCode' && styles.inputFocused,
                !!errors.supervisorCode && styles.inputError,
              ]}
            >
              <KeyRound size={18} color={colors.saffron} />
              <TextInput
                value={supervisorCode}
                onChangeText={(text) => {
                  setSupervisorCode(text);
                  if (errors.supervisorCode) setErrors({ ...errors, supervisorCode: '' });
                }}
                onFocus={() => setFocusedField('supervisorCode')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter authorization key (e.g. SUP-AUTH-2026)"
                placeholderTextColor={colors.mutedText}
                style={styles.textInput}
                autoCapitalize="characters"
              />
            </View>
            <Text style={styles.authHintText}>
              Supervisor accounts require pre-authorized administrator clearance.
            </Text>
            {!!errors.supervisorCode && (
              <View style={styles.errorRow}>
                <AlertCircle size={13} color={colors.danger} />
                <Text style={styles.errorText}>{errors.supervisorCode}</Text>
              </View>
            )}
          </SlideUpView>
        )}

        {/* 6. Passwords */}
        <View style={styles.inputGroup}>
          <Text style={typography.label}>CREATE PASSWORD</Text>
          <View
            style={[
              styles.inputWrapper,
              focusedField === 'password' && styles.inputFocused,
              !!errors.password && styles.inputError,
            ]}
          >
            <Lock size={18} color={focusedField === 'password' ? colors.primaryNavy : colors.mutedText} />
            <TextInput
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              placeholder="Create strong password"
              placeholderTextColor={colors.mutedText}
              secureTextEntry={!showPassword}
              style={styles.textInput}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              {showPassword ? <EyeOff size={18} color={colors.mutedText} /> : <Eye size={18} color={colors.mutedText} />}
            </TouchableOpacity>
          </View>
          {!!errors.password && (
            <View style={styles.errorRow}>
              <AlertCircle size={13} color={colors.danger} />
              <Text style={styles.errorText}>{errors.password}</Text>
            </View>
          )}
        </View>

        {/* Confirm Password */}
        <View style={styles.inputGroup}>
          <Text style={typography.label}>CONFIRM PASSWORD</Text>
          <View
            style={[
              styles.inputWrapper,
              focusedField === 'confirmPassword' && styles.inputFocused,
              !!errors.confirmPassword && styles.inputError,
            ]}
          >
            <ShieldCheck size={18} color={focusedField === 'confirmPassword' ? colors.primaryNavy : colors.mutedText} />
            <TextInput
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
              }}
              onFocus={() => setFocusedField('confirmPassword')}
              onBlur={() => setFocusedField(null)}
              placeholder="Re-enter password"
              placeholderTextColor={colors.mutedText}
              secureTextEntry={!showConfirmPassword}
              style={styles.textInput}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
              {showConfirmPassword ? <EyeOff size={18} color={colors.mutedText} /> : <Eye size={18} color={colors.mutedText} />}
            </TouchableOpacity>
          </View>
          {!!errors.confirmPassword && (
            <View style={styles.errorRow}>
              <AlertCircle size={13} color={colors.danger} />
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <View style={styles.btnRow}>
          <PrimaryButton
            title="CREATE ACCOUNT"
            onPress={handleRegister}
            loading={loading}
            icon={<ShieldCheck size={18} color={colors.white} />}
          />
        </View>

        {/* Sign In Link */}
        <View style={styles.loginLinkRow}>
          <Text style={styles.alreadyText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SlideUpView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xxxl,
  },
  ambientGlowTop: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(2, 132, 199, 0.06)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryNavy,
    letterSpacing: 0.5,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  mainTitle: {
    color: colors.primaryNavy,
    fontWeight: '700',
  },
  subTitle: {
    color: colors.secondaryText,
    marginTop: 4,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    ...shadows.card,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  labelWithBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  authBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.saffron,
    backgroundColor: colors.saffronSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    height: 52,
    backgroundColor: colors.inputBg,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  inputWrapperAuth: {
    borderColor: 'rgba(255, 107, 0, 0.4)',
    backgroundColor: '#FFFBF5',
  },
  inputFocused: {
    borderColor: colors.primaryNavy,
    backgroundColor: colors.white,
    shadowColor: colors.primaryNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerBg,
  },
  textInput: {
    flex: 1,
    height: '100%',
    color: colors.primaryText,
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
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
  authHintText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 4,
  },
  roleContainer: {
    marginBottom: spacing.lg,
  },
  roleHeaderLabel: {
    marginBottom: spacing.sm,
  },
  roleGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  roleCard: {
    flex: 1,
    borderRadius: radius.input,
    borderWidth: 1.5,
    padding: spacing.md,
    minHeight: 88,
    justifyContent: 'center',
  },
  roleCardInactive: {
    backgroundColor: colors.inputBg,
    borderColor: colors.border,
  },
  roleCardActive: {
    backgroundColor: colors.accentBlueSoft,
    borderColor: colors.primaryNavy,
  },
  roleCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondaryText,
    letterSpacing: 0.5,
  },
  roleTitleActive: {
    color: colors.primaryNavy,
  },
  checkBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primaryNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleSubtitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.secondaryText,
    lineHeight: 15,
  },
  btnRow: {
    marginTop: spacing.md,
  },
  loginLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  alreadyText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.secondaryText,
  },
  loginLinkText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
});

export default RegisterScreen;
