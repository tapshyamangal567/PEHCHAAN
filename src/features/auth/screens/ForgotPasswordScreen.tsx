import React, { useState, useEffect } from 'react';
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
import { FadeInView, SlideUpView } from '../../../utils/animations';
import {
  Mail,
  KeyRound,
  Lock,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  Send,
} from 'lucide-react-native';

type ForgotNavProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<ForgotNavProp>();

  // Flow Steps: 1 = Email/ID, 2 = Verify OTP, 3 = New Password, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Focus & Loading
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errorText, setErrorText] = useState('');
  const [loading, setLoading] = useState(false);

  // Timer for OTP
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Step 1: Send OTP
  const handleSendOTP = () => {
    if (!identifier.trim()) {
      setErrorText('Please enter your email or employee ID');
      return;
    }
    setErrorText('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setStep(2);
      setTimer(60);
      setCanResend(false);
    }, 700);
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = () => {
    const code = otpCode.join('');
    if (code.length < 6) {
      setErrorText('Please enter the complete 6-digit OTP code');
      return;
    }
    setErrorText('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 700);
  };

  // Step 3: Reset Password
  const handleResetPassword = () => {
    if (!newPassword || newPassword.length < 6) {
      setErrorText('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorText('Passwords do not match');
      return;
    }
    setErrorText('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setStep(4);
    }, 800);
  };

  // Handle OTP digit input
  const handleOtpChange = (text: string, index: number) => {
    const updated = [...otpCode];
    updated[index] = text;
    setOtpCode(updated);
    if (errorText) setErrorText('');
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      {/* Ambient background glow */}
      <View style={styles.ambientGlow} />

      {/* Top Bar with Navigation */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => {
            if (step > 1 && step < 4) {
              setStep((step - 1) as any);
            } else {
              navigation.goBack();
            }
          }}
          style={styles.backButton}
        >
          <ArrowLeft size={20} color={colors.primaryNavy} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Password Recovery</Text>
      </View>

      {/* App Logo Header */}
      <FadeInView delay={100} style={styles.brandHeader}>
        <AppLogo size="sm" showTagline={false} align="center" />
      </FadeInView>

      {/* Progress Step Indicator */}
      {step < 4 && (
        <View style={styles.stepIndicatorRow}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={styles.stepItem}>
              <View
                style={[
                  styles.stepBadge,
                  step === s
                    ? styles.stepBadgeActive
                    : step > s
                    ? styles.stepBadgeCompleted
                    : styles.stepBadgeInactive,
                ]}
              >
                {step > s ? (
                  <CheckCircle2 size={14} color={colors.white} />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      step === s && styles.stepNumberActive,
                    ]}
                  >
                    {s}
                  </Text>
                )}
              </View>
              {s < 3 && (
                <View
                  style={[
                    styles.stepLine,
                    step > s && styles.stepLineCompleted,
                  ]}
                />
              )}
            </View>
          ))}
        </View>
      )}

      {/* STEP 1: Enter Email / Employee ID */}
      {step === 1 && (
        <SlideUpView delay={150} style={styles.card}>
          <Text style={[typography.h2, styles.cardTitle]}>Forgot Password</Text>
          <Text style={[typography.subtitle, styles.cardDesc]}>
            Enter your registered Email or Employee ID to receive a secure OTP verification code.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={typography.label}>EMAIL OR EMPLOYEE ID</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === 'id' && styles.inputFocused,
                !!errorText && styles.inputError,
              ]}
            >
              <Mail size={18} color={focusedField === 'id' ? colors.primaryNavy : colors.mutedText} />
              <TextInput
                value={identifier}
                onChangeText={(text) => {
                  setIdentifier(text);
                  if (errorText) setErrorText('');
                }}
                onFocus={() => setFocusedField('id')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter email or employee ID"
                placeholderTextColor={colors.mutedText}
                autoCapitalize="none"
                style={styles.textInput}
              />
            </View>
            {!!errorText && (
              <View style={styles.errorRow}>
                <AlertCircle size={14} color={colors.danger} />
                <Text style={styles.errorText}>{errorText}</Text>
              </View>
            )}
          </View>

          <PrimaryButton
            title="SEND VERIFICATION CODE"
            onPress={handleSendOTP}
            loading={loading}
            icon={<Send size={18} color={colors.white} />}
          />
        </SlideUpView>
      )}

      {/* STEP 2: Verify 6-digit OTP Code */}
      {step === 2 && (
        <SlideUpView delay={150} style={styles.card}>
          <Text style={[typography.h2, styles.cardTitle]}>Verify OTP Code</Text>
          <Text style={[typography.subtitle, styles.cardDesc]}>
            We have sent a 6-digit security code to your registered contact.
          </Text>

          <View style={styles.otpGrid}>
            {otpCode.map((digit, idx) => (
              <TextInput
                key={idx}
                value={digit}
                onChangeText={(t) => handleOtpChange(t, idx)}
                maxLength={1}
                keyboardType="number-pad"
                style={styles.otpBox}
              />
            ))}
          </View>

          {!!errorText && (
            <View style={styles.errorRowCenter}>
              <AlertCircle size={14} color={colors.danger} />
              <Text style={styles.errorText}>{errorText}</Text>
            </View>
          )}

          {/* Countdown & Resend */}
          <View style={styles.timerRow}>
            <Clock size={16} color={colors.secondaryText} />
            <Text style={styles.timerText}>
              {canResend ? 'Code expired.' : `Resend code in ${timer}s`}
            </Text>
            {canResend && (
              <TouchableOpacity
                onPress={() => {
                  setTimer(60);
                  setCanResend(false);
                }}
              >
                <Text style={styles.resendBtnText}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>

          <PrimaryButton
            title="VERIFY OTP"
            onPress={handleVerifyOTP}
            loading={loading}
            icon={<KeyRound size={18} color={colors.white} />}
          />
        </SlideUpView>
      )}

      {/* STEP 3: Create New Password */}
      {step === 3 && (
        <SlideUpView delay={150} style={styles.card}>
          <Text style={[typography.h2, styles.cardTitle]}>Create New Password</Text>
          <Text style={[typography.subtitle, styles.cardDesc]}>
            Your identity has been verified. Create a new strong password.
          </Text>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={typography.label}>NEW PASSWORD</Text>
            <View style={[styles.inputWrapper, focusedField === 'pass' && styles.inputFocused]}>
              <Lock size={18} color={focusedField === 'pass' ? colors.primaryNavy : colors.mutedText} />
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                onFocus={() => setFocusedField('pass')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter new password"
                placeholderTextColor={colors.mutedText}
                secureTextEntry={!showNewPassword}
                style={styles.textInput}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                {showNewPassword ? <EyeOff size={18} color={colors.mutedText} /> : <Eye size={18} color={colors.mutedText} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm New Password */}
          <View style={styles.inputGroup}>
            <Text style={typography.label}>CONFIRM NEW PASSWORD</Text>
            <View style={[styles.inputWrapper, focusedField === 'confirm' && styles.inputFocused]}>
              <ShieldCheck size={18} color={focusedField === 'confirm' ? colors.primaryNavy : colors.mutedText} />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setFocusedField('confirm')}
                onBlur={() => setFocusedField(null)}
                placeholder="Confirm new password"
                placeholderTextColor={colors.mutedText}
                secureTextEntry={!showConfirmPassword}
                style={styles.textInput}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff size={18} color={colors.mutedText} /> : <Eye size={18} color={colors.mutedText} />}
              </TouchableOpacity>
            </View>
          </View>

          {!!errorText && (
            <View style={styles.errorRow}>
              <AlertCircle size={14} color={colors.danger} />
              <Text style={styles.errorText}>{errorText}</Text>
            </View>
          )}

          <PrimaryButton
            title="RESET PASSWORD"
            onPress={handleResetPassword}
            loading={loading}
            icon={<ShieldCheck size={18} color={colors.white} />}
          />
        </SlideUpView>
      )}

      {/* STEP 4: Success View */}
      {step === 4 && (
        <SlideUpView delay={150} style={styles.cardSuccess}>
          <View style={styles.successIconBox}>
            <CheckCircle2 size={48} color={colors.indiaGreen} />
          </View>
          <Text style={[typography.h2, styles.successTitle]}>Password Updated!</Text>
          <Text style={[typography.subtitle, styles.successDesc]}>
            Your PEHCHAAN security credentials have been updated successfully. You can now sign in with your new password.
          </Text>

          <PrimaryButton
            title="BACK TO LOGIN"
            onPress={() => navigation.navigate('Login')}
          />
        </SlideUpView>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xxxl,
  },
  ambientGlow: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(2, 132, 199, 0.05)',
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
    marginBottom: spacing.lg,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeInactive: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBadgeActive: {
    backgroundColor: colors.primaryNavy,
  },
  stepBadgeCompleted: {
    backgroundColor: colors.indiaGreen,
  },
  stepNumber: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedText,
  },
  stepNumberActive: {
    color: colors.white,
  },
  stepLine: {
    width: 48,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 6,
  },
  stepLineCompleted: {
    backgroundColor: colors.indiaGreen,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    ...shadows.card,
  },
  cardSuccess: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.card,
  },
  cardTitle: {
    color: colors.primaryNavy,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  cardDesc: {
    color: colors.secondaryText,
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
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
  inputFocused: {
    borderColor: colors.primaryNavy,
    backgroundColor: colors.white,
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
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  errorRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  errorText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.danger,
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.primaryNavy,
    backgroundColor: colors.inputBg,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  timerText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    color: colors.secondaryText,
  },
  resendBtnText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryNavy,
    marginLeft: 6,
  },
  successIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.successBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    color: colors.primaryNavy,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  successDesc: {
    textAlign: 'center',
    color: colors.secondaryText,
    marginBottom: spacing.xxl,
  },
});

export default ForgotPasswordScreen;
