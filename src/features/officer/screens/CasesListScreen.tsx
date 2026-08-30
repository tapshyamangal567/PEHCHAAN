import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { SectionHeader } from '../../../components/navigation/SectionHeader';
import { CaseRowItem } from '../components/CaseRowItem';
import { CaseDetailModal } from '../components/CaseDetailModal';
import { MOCK_RECENT_CASES, OfficerCase } from '../data/mockOfficerData';
import { colors, typography, spacing, radius } from '../../../theme';
import { Search, Filter } from 'lucide-react-native';

export const CasesListScreen = () => {
  const [selectedCase, setSelectedCase] = useState<OfficerCase | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCases = MOCK_RECENT_CASES.filter(
    (c) =>
      c.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.holderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.passportNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScreenContainer scrollable>
      <SectionHeader
        title="Screening Cases"
        subtitle="Complete log of passport evaluations"
      />

      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.mutedText} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by Case ID, name, or passport..."
            placeholderTextColor={colors.mutedText}
            style={[typography.body, styles.searchInput]}
          />
        </View>
      </View>

      <View style={styles.listContainer}>
        {filteredCases.map((caseData) => (
          <CaseRowItem
            key={caseData.id}
            caseData={caseData}
            onPress={() => setSelectedCase(caseData)}
          />
        ))}
      </View>

      <CaseDetailModal
        caseData={selectedCase}
        visible={!!selectedCase}
        onClose={() => setSelectedCase(null)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  searchRow: {
    marginBottom: spacing.lg,
  },
  searchBar: {
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: colors.primaryText,
  },
  listContainer: {
    paddingBottom: spacing.xxxl * 2,
  },
});

export default CasesListScreen;
