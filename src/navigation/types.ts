export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  Register: undefined;
};

import { SelectedPassportDocument, CapturedDocument } from '../features/screening/types/passportTypes';
import { PassportScreeningResponse } from '../services/screeningService';

export type OfficerTabParamList = {
  Home: undefined;
  Scan: undefined;
  Cases: undefined;
  Alerts: undefined;
  Profile: undefined;
};

export type OfficerStackParamList = {
  OfficerMainTabs: undefined;
  CaseDetail: { caseId: string };
  PassportUpload: undefined;
  PassportCamera: undefined;
  PassportPreparation: { passportDoc?: SelectedPassportDocument };
  PassportPreview: { document?: CapturedDocument; passportDoc?: SelectedPassportDocument };
  DocumentAnalysis: { document?: CapturedDocument };
  VerificationResults: { document?: CapturedDocument; screeningResponse?: PassportScreeningResponse; faceMatchResult?: any; isOfflineMode?: boolean; localCaseId?: string };
  IdentityVerification: { passportUri?: string; verificationId?: string; document?: CapturedDocument; currentScreeningResponse?: PassportScreeningResponse };
  OfflineSync: undefined;
};

export type SupervisorTabParamList = {
  Overview: undefined;
  'Review Queue': undefined;
  Analytics: undefined;
  Alerts: undefined;
  Profile: undefined;
};

export type SupervisorStackParamList = {
  SupervisorMainTabs: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  OfficerApp: undefined;
  SupervisorApp: undefined;
};
