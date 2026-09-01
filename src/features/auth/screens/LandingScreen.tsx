import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../navigation/types';
import { AppLogo } from '../../../components/ui/AppLogo';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import {
  Shield,
  UserCheck,
  ScanLine,
  FileCheck2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Layers,
  Cpu,
  CheckCircle2,
} from 'lucide-react-native';

type LandingNavProp = NativeStackNavigationProp<AuthStackParamList, 'Landing'>;

export const LandingScreen: React.FC = () => {
  const navigation = useNavigation<LandingNavProp>();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const handleOfficerLogin = () => {
    navigation.navigate('Login', { initialRole: 'OFFICER' });
  };

  const handleSupervisorLogin = () => {
    navigation.navigate('Login', { initialRole: 'SUPERVISOR' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* 1. Header Bar */}
          <View style={styles.topBar}>
            <AppLogo size="sm" variant="horizontal" showTagline={!isMobile} />
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>SYSTEM ACTIVE</Text>
            </View>
          </View>

          {/* 2. Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.badgeWrapper}>
              <Shield size={14} color={colors.primaryNavy} />
              <Text style={styles.badgeText}>BORDER & IMMIGRATION SECURITY</Text>
            </View>

            <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
              Intelligent Document Verification & Border Security Platform
            </Text>

            <Text style={styles.heroSubtitle}>
              Next-generation identity validation for authorized checkpoint personnel. Powered by forensic MRZ validation, biometric facial verification, tampering analysis, and tamper-evident audit logging.
            </Text>

            {/* CTAs */}
            <View style={[styles.ctaRow, isMobile && styles.ctaRowMobile]}>
              <TouchableOpacity
                style={styles.primaryCta}
                onPress={handleOfficerLogin}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Officer Login"
              >
                <Shield size={18} color="#FFFFFF" />
                <Text style={styles.primaryCtaText}>Officer Login</Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryCta}
                onPress={handleSupervisorLogin}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Supervisor Login"
              >
                <UserCheck size={18} color={colors.primaryNavy} />
                <Text style={styles.secondaryCtaText}>Supervisor Login</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. Core Capabilities Grid */}
          <View style={styles.sectionHeaderBox}>
            <Text style={styles.sectionPreTitle}>SECURITY ARCHITECTURE</Text>
            <Text style={styles.sectionTitle}>Core Verification Capabilities</Text>
          </View>

          <View style={styles.featuresGrid}>
            {/* Card 1 */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: '#EFF6FF' }]}>
                <ScanLine size={22} color={colors.primaryNavy} />
              </View>
              <Text style={styles.featureTitle}>Document Verification</Text>
              <Text style={styles.featureDesc}>
                High-accuracy OCR passport extraction with ICAO 9303 MRZ parsing and mathematical check-digit verification.
              </Text>
            </View>

            {/* Card 2 */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: '#ECFDF5' }]}>
                <ShieldCheck size={22} color="#059669" />
              </View>
              <Text style={styles.featureTitle}>Biometric Face Match</Text>
              <Text style={styles.featureDesc}>
                Real-time facial landmark comparison and liveness detection against official passport portrait records.
              </Text>
            </View>

            {/* Card 3 */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Cpu size={22} color="#D97706" />
              </View>
              <Text style={styles.featureTitle}>Tampering & Risk Engine</Text>
              <Text style={styles.featureDesc}>
                Error Level Analysis (ELA), copy-move detection, and composite risk scoring across 7 security factors.
              </Text>
            </View>

            {/* Card 4 */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: '#F3E8FF' }]}>
                <Layers size={22} color="#7E22CE" />
              </View>
              <Text style={styles.featureTitle}>Secure Audit Trail</Text>
              <Text style={styles.featureDesc}>
                Immutable case verification logs with cryptographic hash anchoring, encrypted local caching, and offline sync.
              </Text>
            </View>
          </View>

          {/* 4. Security & Compliance Banner */}
          <View style={styles.complianceCard}>
            <View style={styles.complianceIconBox}>
              <Lock size={24} color={colors.primaryNavy} />
            </View>
            <View style={styles.complianceContent}>
              <Text style={styles.complianceTitle}>Built for High-Trust Operations</Text>
              <Text style={styles.complianceSub}>
                Role-scoped JWT authorization, strict PII privacy controls, and PostgreSQL database architecture designed for mission-critical border infrastructure.
              </Text>
            </View>
          </View>

          {/* 5. Clean Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>PEHCHAAN</Text>
            <Text style={styles.footerSub}>
              Government Security & Document Verification Framework • v1.0.0
            </Text>
            <Text style={styles.footerNotice}>
              Authorized checkpoint personnel only. All access is audited and logged.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexGrow: 1,
  },
  container: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },

  /* Top Bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
  },

  /* Hero Section */
  heroSection: {
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.xl,
    ...shadows.soft,
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  badgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryNavy,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: spacing.md,
    maxWidth: 720,
  },
  heroTitleMobile: {
    fontSize: 22,
    lineHeight: 30,
  },
  heroSubtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    maxWidth: 640,
  },

  /* CTAs */
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
    maxWidth: 440,
  },
  ctaRowMobile: {
    flexDirection: 'column',
    width: '100%',
  },
  primaryCta: {
    flex: 1,
    minHeight: 48,
    width: '100%',
    backgroundColor: colors.primaryNavy,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
    ...shadows.soft,
  },
  primaryCtaText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryCta: {
    flex: 1,
    minHeight: 48,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primaryNavy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
  },
  secondaryCtaText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryNavy,
  },

  /* Section Header */
  sectionHeaderBox: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionPreTitle: {
    fontFamily: typography.label.fontFamily,
    fontSize: 11,
    fontWeight: '800',
    color: colors.secondaryNavy,
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* Features Grid */
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  featureCard: {
    width: '48%',
    minWidth: 260,
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.lg,
    ...shadows.soft,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  featureTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  featureDesc: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },

  /* Compliance Banner */
  complianceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: '#F1F5F9',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  complianceIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  complianceContent: {
    flex: 1,
  },
  complianceTitle: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryNavy,
    marginBottom: 2,
  },
  complianceSub: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },

  /* Footer */
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 4,
  },
  footerBrand: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryNavy,
    letterSpacing: 2,
  },
  footerSub: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: '#64748B',
  },
  footerNotice: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
});

export default LandingScreen;
