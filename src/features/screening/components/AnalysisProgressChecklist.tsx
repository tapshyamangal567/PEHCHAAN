import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { CheckCircle2, Circle } from 'lucide-react-native';
import { AnalysisStepItem } from '../types/passportTypes';
import { colors, typography, spacing, radius } from '../../../theme';

interface AnalysisProgressChecklistProps {
  steps: AnalysisStepItem[];
  progressPercent: number; // 0 to 100
}

export const AnalysisProgressChecklist: React.FC<AnalysisProgressChecklistProps> = ({
  steps,
  progressPercent,
}) => {
  return (
    <View style={styles.container}>
      {/* 1. Progress Bar & Readout */}
      <View style={styles.progressHeaderRow}>
        <Text style={styles.progressTitle}>Analyzing...</Text>
        <Text style={styles.progressPercentText}>{Math.min(100, Math.max(0, Math.round(progressPercent)))}%</Text>
      </View>

      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${Math.min(100, Math.max(0, progressPercent))}%` },
          ]}
        />
      </View>

      {/* 2. Vertical Sequential Checklist */}
      <View style={styles.stepsList}>
        {steps.map((step, index) => {
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';

          return (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.iconContainer}>
                {isCompleted ? (
                  <CheckCircle2 size={18} color={colors.success} />
                ) : isActive ? (
                  <ActivityIndicator size="small" color={colors.primaryNavy} />
                ) : (
                  <Circle size={16} color={colors.mutedText} />
                )}
              </View>

              <Text
                style={[
                  styles.stepLabel,
                  isCompleted && styles.stepLabelCompleted,
                  isActive && styles.stepLabelActive,
                ]}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginVertical: spacing.md,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressTitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  progressPercentText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondaryNavy,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: colors.paleBlue,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primaryNavy,
    borderRadius: 3,
  },
  stepsList: {
    gap: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: colors.mutedText,
    fontWeight: '500',
  },
  stepLabelActive: {
    color: colors.primaryNavy,
    fontWeight: '700',
  },
  stepLabelCompleted: {
    color: colors.primaryText,
    fontWeight: '600',
  },
});

export default AnalysisProgressChecklist;
