export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  Register: undefined;
};


import {
  SelectedPassportDocument,
  CapturedDocument,
} from '../features/screening/types/passportTypes';

import { PassportScreeningResponse } from '../services/screeningService';
import { FaceVerificationResponse } from '../services/faceVerificationService';


export type OfficerTabParamList = {
  Home: undefined;
  Scan: undefined;
  Cases: undefined;
  Alerts: undefined;
  Profile: undefined;
};


export type OfficerStackParamList = {
  OfficerMainTabs: undefined;

  CaseDetail: {
    caseId: string;
  };

  PassportUpload: undefined;

  PassportCamera: undefined;

  PassportPreparation: {
    passportDoc?: SelectedPassportDocument;
  };

  PassportPreview: {
    document?: CapturedDocument;
    passportDoc?: SelectedPassportDocument;
  };

  DocumentAnalysis: {
    document?: CapturedDocument;
  };

  // Screening result + Face Verification + Offline Mode
  VerificationResults: {
    document?: CapturedDocument;
    screeningResponse?: PassportScreeningResponse;
    faceMatchResult?: any;
    isOfflineMode?: boolean;
    localCaseId?: string;
  };

  // Existing Face Verification flow
  FaceVerification: {
    document?: CapturedDocument;
    screeningResponse?: PassportScreeningResponse;
  };

  FaceVerificationResult: {
    document?: CapturedDocument;
    verificationResponse?: FaceVerificationResponse;
    liveFaceUri?: string;
  };

  RiskAssessment: {
    document?: CapturedDocument;
    screeningResponse?: PassportScreeningResponse;
    verificationResponse?: FaceVerificationResponse;
  };

  // Team member Identity Verification flow
  IdentityVerification: {
    passportUri?: string;
    verificationId?: string;
    document?: CapturedDocument;
    currentScreeningResponse?: PassportScreeningResponse;
  };

  // Team member Offline Sync flow
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