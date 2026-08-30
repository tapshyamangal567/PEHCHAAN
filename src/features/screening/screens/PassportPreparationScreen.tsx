import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { SelectedPassportDocument } from '../types/passportTypes';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { FadeInView, SlideUpView } from '../../../utils/animations';
import { CheckCircle2, ShieldAlert, FileText, ArrowLeft, Cpu } from 'lucide-react-native';

export const PassportPreparationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const passportDoc: SelectedPassportDocument | undefined = route.params?.passportDoc;

  const handleReturnDashboard = () => {
    navigation.navigate('OfficerMainTabs', { screen: 'Home' });
  };

  const handleBackToUpload = () => {
    navigation.goBack();
  };

  return (
    <ScreenContainer scrollable style={styles.screenBg} contentContainerStyle={styles.container}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={handleBackToUpload}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to upload screen"
        >
          <ArrowLeft size={18} color={colors.primaryNavy} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <SlideUpView delay={100} style={styles.heroCard}>
        {/* Success Icon Badge */}
        <View style={styles.iconCircle}>
          <CheckCircle2 size={36} color={colors.success} />
        </View>

        <Text style={styles.titleText}>Passport Ready</Text>
        <Text style={styles.subtitleText}>
          Your document is ready for verification.
        </Text>

        {/* Phase Disclaimer Badge */}
        <View style={styles.disclaimerPill}>
          <Cpu size={16} color={colors.secondaryNavy} />
          <Text style={styles.disclaimerText}>
            AI verification will be connected in the next phase.
          </Text>
        </View>
      </SlideUpView>

      {/* Selected Passport Document Card */}
      {passportDoc ? (
        <SlideUpView delay={200} style={styles.documentCard}>
          <Text style={styles.cardHeaderTitle}>ATTACHED DOCUMENT</Text>
          
          <View style={styles.documentRow}>
            <View style={styles.thumbnailWrapper}>
              <Image
                source={{ uri: passportDoc.uri }}
                style={styles.thumbnailImage}
                resizeMode="cover"
              />
            </View>

            <View style={styles.docInfoCol}>
              <Text style={styles.docNameText} numberOfLines={1} ellipsizeMode="middle">
                {passportDoc.fileName}
              </Text>
              <Text style={styles.docMetaText}>{passportDoc.fileSizeFormatted}</Text>
              <View style={styles.statusRow}>
                <View style={styles.dot} />
                <Text style={styles.statusLabel}>Pending AI Pipeline</Text>
              </View>
            </View>
          </View>
        </SlideUpView>
      ) : null}

      {/* Security Info */}
      <FadeInView delay={300} style={styles.infoBox}>
        <ShieldAlert size={18} color={colors.primaryNavy} />
        <Text style={styles.infoBoxText}>
          In this prototype build, document intake is validated locally. OCR extraction, MRZ reading, and facial comparison will be enabled in Phase 2.
        </Text>
      </FadeInView>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <PrimaryButton
          title="Return to Dashboard"
          onPress={handleReturnDashboard}
          accessibilityLabel="Return to Officer Dashboard"
        />
        <SecondaryButton
          title="Upload Different Document"
          onPress={handleBackToUpload}
          accessibilityLabel="Go back to document upload"
          style={styles.secondaryBtn}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screenBg: {
    backgroundColor: colors.background,
  },
  container: {
    paddingBottom: spacing.xxxl * 2,
  },
  headerRow: {
    marginBottom: spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    minHeight: 44,
  },
  backText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryNavy,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.softMint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 91, 0.2)',
  },
  titleText: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 22,
    fontWeight: '700',
    color: colors.primaryNavy,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitleText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  disclaimerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.softBlue,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(31, 78, 121, 0.15)',
  },
  disclaimerText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  documentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  cardHeaderTitle: {
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  thumbnailWrapper: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.paleBlue,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  docInfoCol: {
    flex: 1,
  },
  docNameText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryNavy,
    marginBottom: 2,
  },
  docMetaText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.secondaryText,
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning,
  },
  statusLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: colors.warning,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.paleBlue,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(18, 52, 91, 0.1)',
    marginBottom: spacing.xl,
  },
  infoBoxText: {
    flex: 1,
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.primaryText,
    lineHeight: 18,
  },
  actionsContainer: {
    gap: spacing.md,
  },
  secondaryBtn: {
    marginTop: 0,
  },
});

export default PassportPreparationScreen;
