import { RiskLevel, SystemStatus } from '../../../types/common';

export interface SupervisorReviewCase {
  id: string;
  caseId: string;
  documentType: 'Passport' | 'Visa' | 'National ID';
  holderName: string;
  passportNumber: string;
  nationality: string;
  officerName: string;
  officerBadge: string;
  riskLevel: RiskLevel;
  riskScore: number;
  matchScore: number;
  timestamp: string;
  reason: string;
  mrzStatus: string;
  watchlistMatch: boolean;
}

export interface ActiveOfficerItem {
  id: string;
  name: string;
  badgeId: string;
  screeningsToday: number;
  status: 'ACTIVE' | 'INACTIVE';
  lastActive: string;
}

export interface EscalatedAlertItem {
  id: string;
  caseId: string;
  title: string;
  riskLevel: RiskLevel;
  timestamp: string;
}

export const MOCK_SUPERVISOR_METRICS = {
  totalScreenedToday: 1248,
  flaggedToday: 37,
  mediumRiskToday: 94,
  activeOfficersCount: 8,
  pendingReviewCount: 6,
  checkpointName: 'Checkpoint Alpha',
  supervisorName: 'Priya Sharma',
  badgeId: 'IND-SUP-1090',
};

export const MOCK_RISK_DISTRIBUTION = {
  lowPercentage: 89,
  mediumPercentage: 8,
  highPercentage: 3,
};

export const MOCK_REVIEW_QUEUE: SupervisorReviewCase[] = [
  {
    id: 'REV-001',
    caseId: 'CASE-2026-00124',
    documentType: 'Passport',
    holderName: 'Vikramaditya Roy',
    passportNumber: 'Z8942109',
    nationality: 'IND',
    officerName: 'Arjun Mehta',
    officerBadge: 'IND-SEC-8842',
    riskLevel: 'HIGH',
    riskScore: 87,
    matchScore: 64,
    timestamp: '8 min ago',
    reason: 'MRZ checksum mismatch detected in passport visual zone.',
    mrzStatus: 'FAILED',
    watchlistMatch: true,
  },
  {
    id: 'REV-002',
    caseId: 'CASE-2026-00121',
    documentType: 'Passport',
    holderName: 'Neha Kapoor',
    passportNumber: 'P4410293',
    nationality: 'IND',
    officerName: 'Neha Kapoor',
    officerBadge: 'IND-SEC-9102',
    riskLevel: 'MEDIUM',
    riskScore: 62,
    matchScore: 78,
    timestamp: '21 min ago',
    reason: 'Secondary facial biometric confidence below 80% threshold.',
    mrzStatus: 'PASSED',
    watchlistMatch: false,
  },
  {
    id: 'REV-003',
    caseId: 'CASE-2026-00118',
    documentType: 'Passport',
    holderName: 'Tariq Al-Mansoor',
    passportNumber: 'K9012384',
    nationality: 'ARE',
    officerName: 'Rohan Verma',
    officerBadge: 'IND-SEC-7741',
    riskLevel: 'HIGH',
    riskScore: 92,
    matchScore: 55,
    timestamp: '35 min ago',
    reason: 'Interpol watchlist fuzzy match (82% similarity index).',
    mrzStatus: 'PASSED',
    watchlistMatch: true,
  },
  {
    id: 'REV-004',
    caseId: 'CASE-2026-00115',
    documentType: 'Passport',
    holderName: 'Elena Rostova',
    passportNumber: 'RU7812049',
    nationality: 'RUS',
    officerName: 'Aisha Khan',
    officerBadge: 'IND-SEC-8109',
    riskLevel: 'MEDIUM',
    riskScore: 58,
    matchScore: 81,
    timestamp: '50 min ago',
    reason: 'Visa expiration anomaly detected during automated cross-check.',
    mrzStatus: 'PASSED',
    watchlistMatch: false,
  },
  {
    id: 'REV-005',
    caseId: 'CASE-2026-00112',
    documentType: 'Passport',
    holderName: 'Marcus Vance',
    passportNumber: 'US9012388',
    nationality: 'USA',
    officerName: 'Arjun Mehta',
    officerBadge: 'IND-SEC-8842',
    riskLevel: 'MEDIUM',
    riskScore: 49,
    matchScore: 84,
    timestamp: '1 hr ago',
    reason: 'Document UV security pattern verification pending manual approval.',
    mrzStatus: 'PASSED',
    watchlistMatch: false,
  },
  {
    id: 'REV-006',
    caseId: 'CASE-2026-00109',
    documentType: 'Passport',
    holderName: 'David Miller',
    passportNumber: 'AU4410291',
    nationality: 'AUS',
    officerName: 'Rohan Verma',
    officerBadge: 'IND-SEC-7741',
    riskLevel: 'HIGH',
    riskScore: 81,
    matchScore: 71,
    timestamp: '1 hr ago',
    reason: 'Chip cryptographic signature validation failed.',
    mrzStatus: 'FAILED',
    watchlistMatch: false,
  },
];

export const MOCK_OFFICER_ACTIVITY: ActiveOfficerItem[] = [
  {
    id: 'OFF-1',
    name: 'Arjun Mehta',
    badgeId: 'IND-SEC-8842',
    screeningsToday: 42,
    status: 'ACTIVE',
    lastActive: 'Just now',
  },
  {
    id: 'OFF-2',
    name: 'Neha Kapoor',
    badgeId: 'IND-SEC-9102',
    screeningsToday: 37,
    status: 'ACTIVE',
    lastActive: '2 min ago',
  },
  {
    id: 'OFF-3',
    name: 'Rohan Verma',
    badgeId: 'IND-SEC-7741',
    screeningsToday: 29,
    status: 'ACTIVE',
    lastActive: '5 min ago',
  },
  {
    id: 'OFF-4',
    name: 'Aisha Khan',
    badgeId: 'IND-SEC-8109',
    screeningsToday: 34,
    status: 'INACTIVE',
    lastActive: '25 min ago',
  },
];

export const MOCK_ESCALATED_ALERTS: EscalatedAlertItem[] = [
  {
    id: 'ESC-1',
    caseId: 'CASE-2026-00124',
    title: 'Multiple verification failures',
    riskLevel: 'HIGH',
    timestamp: '8 min ago',
  },
  {
    id: 'ESC-2',
    caseId: 'CASE-2026-00118',
    title: 'Document requires supervisor review',
    riskLevel: 'MEDIUM',
    timestamp: '35 min ago',
  },
];
