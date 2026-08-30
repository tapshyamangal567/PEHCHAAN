import { RiskLevel, SystemStatus } from '../../../types/common';

export interface PendingAlert {
  id: string;
  caseId: string;
  title: string;
  description: string;
  riskLevel: RiskLevel;
  timestamp: string;
  passportNumber?: string;
  nationality?: string;
}

export interface OfficerCase {
  id: string;
  caseId: string;
  documentType: 'Passport' | 'Visa' | 'National ID';
  holderName: string;
  passportNumber: string;
  nationality: string;
  riskLevel: RiskLevel;
  status: SystemStatus;
  timestamp: string;
  riskScore: number;
  matchScore: number;
}

export const MOCK_OFFICER_METRICS = {
  screenedToday: 128,
  clearedToday: 104,
  flaggedToday: 24,
  checkpointName: 'Checkpoint Alpha',
  officerName: 'Arjun Mehta',
  badgeId: 'IND-SEC-8842',
  currentShift: 'Morning Shift (06:00 - 14:00)',
};

export const MOCK_PENDING_ALERTS: PendingAlert[] = [
  {
    id: 'ALT-101',
    caseId: 'CASE-2026-00124',
    title: 'Passport requires manual review',
    description: 'MRZ checksum mismatch detected in passport visual zone.',
    riskLevel: 'HIGH',
    timestamp: '8 min ago',
    passportNumber: 'Z8942109',
    nationality: 'IND',
  },
  {
    id: 'ALT-102',
    caseId: 'CASE-2026-00121',
    title: 'Document information needs review',
    description: 'Secondary biometric photo confidence score below threshold (78%).',
    riskLevel: 'MEDIUM',
    timestamp: '21 min ago',
    passportNumber: 'P4410293',
    nationality: 'SGP',
  },
  {
    id: 'ALT-103',
    caseId: 'CASE-2026-00118',
    title: 'Watchlist name similarity alert',
    description: 'Fuzzy match on Interpol red notice database (82% match).',
    riskLevel: 'HIGH',
    timestamp: '1 hr ago',
    passportNumber: 'K9012384',
    nationality: 'ARE',
  },
];

export const MOCK_RECENT_CASES: OfficerCase[] = [
  {
    id: 'CS-001',
    caseId: 'CASE-2026-00124',
    documentType: 'Passport',
    holderName: 'Vikramaditya Roy',
    passportNumber: 'Z8942109',
    nationality: 'IND',
    riskLevel: 'HIGH',
    status: 'FLAGGED',
    timestamp: '8 min ago',
    riskScore: 88,
    matchScore: 64,
  },
  {
    id: 'CS-002',
    caseId: 'CASE-2026-00123',
    documentType: 'Passport',
    holderName: 'Sarah Jenkins',
    passportNumber: 'GB9821034',
    nationality: 'GBR',
    riskLevel: 'LOW',
    status: 'VERIFIED',
    timestamp: '18 min ago',
    riskScore: 4,
    matchScore: 99,
  },
  {
    id: 'CS-003',
    caseId: 'CASE-2026-00122',
    documentType: 'Passport',
    holderName: 'Karan Patel',
    passportNumber: 'Z1092834',
    nationality: 'IND',
    riskLevel: 'MEDIUM',
    status: 'PENDING',
    timestamp: '32 min ago',
    riskScore: 45,
    matchScore: 86,
  },
  {
    id: 'CS-004',
    caseId: 'CASE-2026-00121',
    documentType: 'Passport',
    holderName: 'Li Wei',
    passportNumber: 'P4410293',
    nationality: 'SGP',
    riskLevel: 'LOW',
    status: 'VERIFIED',
    timestamp: '46 min ago',
    riskScore: 8,
    matchScore: 97,
  },
  {
    id: 'CS-005',
    caseId: 'CASE-2026-00120',
    documentType: 'Passport',
    holderName: 'Rohan Sharma',
    passportNumber: 'Z7741029',
    nationality: 'IND',
    riskLevel: 'LOW',
    status: 'VERIFIED',
    timestamp: '1 hr ago',
    riskScore: 2,
    matchScore: 100,
  },
];
