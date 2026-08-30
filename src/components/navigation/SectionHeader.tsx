import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { typography, spacing } from '../../theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  rightAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleColumn}>
        <Text style={typography.h3}>{title}</Text>
        {subtitle && <Text style={[typography.subtitle, styles.subtitleText]}>{subtitle}</Text>}
      </View>
      {rightAction && <View style={styles.actionBox}>{rightAction}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  titleColumn: {
    flex: 1,
  },
  subtitleText: {
    marginTop: 2,
  },
  actionBox: {
    marginLeft: spacing.md,
  },
});

export default SectionHeader;
