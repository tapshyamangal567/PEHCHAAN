export type CanonicalVerificationStatus = 'PASS' | 'REVIEW' | 'FAIL' | 'NOT_AVAILABLE';

/**
 * Normalizes MRZ verification status from backend response.
 * Rules:
 * - detected = false / missing -> NOT_AVAILABLE
 * - checksum_valid = true -> PASS
 * - checksum_valid = false -> FAIL
 * - checksum_valid = null / undefined -> REVIEW (NEVER FAIL)
 */
export function normalizeMRZStatus(mrzData?: any): CanonicalVerificationStatus {
  if (!mrzData || typeof mrzData !== 'object') {
    return 'NOT_AVAILABLE';
  }

  const rawStatus = typeof mrzData.status === 'string' ? mrzData.status.toUpperCase() : null;
  if (rawStatus === 'PASS') return 'PASS';
  if (rawStatus === 'REVIEW') return 'REVIEW';
  if (rawStatus === 'FAIL') return 'FAIL';
  if (rawStatus === 'NOT_AVAILABLE') return 'NOT_AVAILABLE';

  if (!mrzData.detected) {
    return 'NOT_AVAILABLE';
  }

  if (mrzData.checksum_valid === true) {
    return 'PASS';
  } else if (mrzData.checksum_valid === false) {
    return 'FAIL';
  } else if (mrzData.checksum_valid === null || mrzData.checksum_valid === undefined) {
    return 'REVIEW';
  }

  return 'PASS';
}

/**
 * Normalizes Document Validation status from backend response.
 */
export function normalizeValidationStatus(validationData?: any): CanonicalVerificationStatus {
  if (!validationData || typeof validationData !== 'object') {
    return 'NOT_AVAILABLE';
  }

  const rawStatus = (validationData.overall_status || validationData.status || '')?.toString().toUpperCase();
  if (rawStatus === 'PASS' || rawStatus === 'SUCCESS') return 'PASS';
  if (rawStatus === 'REVIEW' || rawStatus === 'WARNING') return 'REVIEW';
  if (rawStatus === 'FAIL' || rawStatus === 'FAILED') return 'FAIL';
  if (rawStatus === 'NOT_AVAILABLE') return 'NOT_AVAILABLE';

  if (typeof validationData.failed === 'number' && validationData.failed > 0) {
    return 'FAIL';
  }
  if (typeof validationData.passed === 'number' && validationData.passed > 0) {
    return 'PASS';
  }

  return 'NOT_AVAILABLE';
}

/**
 * Normalizes OCR / MRZ Consistency status from backend response.
 * Rules:
 * - true -> PASS
 * - false -> FAIL
 * - null -> REVIEW (NEVER FAIL automatically)
 */
export function normalizeConsistencyStatus(consistencyData?: any): CanonicalVerificationStatus {
  if (!consistencyData || typeof consistencyData !== 'object') {
    return 'NOT_AVAILABLE';
  }

  const rawStatus = (consistencyData.overall_status || consistencyData.status || '')?.toString().toUpperCase();
  if (rawStatus === 'PASS' || rawStatus === 'SUCCESS') return 'PASS';
  if (rawStatus === 'REVIEW' || rawStatus === 'WARNING') return 'REVIEW';
  if (rawStatus === 'FAIL' || rawStatus === 'FAILED') return 'FAIL';
  if (rawStatus === 'NOT_AVAILABLE') return 'NOT_AVAILABLE';

  const matches = [
    consistencyData.name_match,
    consistencyData.passport_number_match,
    consistencyData.dob_match,
    consistencyData.expiry_match,
  ];

  const hasFalse = matches.some((val) => val === false);
  if (hasFalse) return 'FAIL';

  const evaluated = matches.filter((val) => typeof val === 'boolean');
  if (evaluated.length > 0 && evaluated.every((val) => val === true)) {
    return 'PASS';
  }

  const hasNull = matches.some((val) => val === null);
  if (hasNull) return 'REVIEW';

  return 'NOT_AVAILABLE';
}

/**
 * Generic canonical status normalizer dispatcher.
 */
export function normalizeVerificationStatus(
  result: any,
  type: 'mrz' | 'validation' | 'consistency' | 'tampering' | 'face' | 'liveness' | 'quality'
): CanonicalVerificationStatus {
  switch (type) {
    case 'mrz':
      return normalizeMRZStatus(result);
    case 'validation':
      return normalizeValidationStatus(result);
    case 'consistency':
      return normalizeConsistencyStatus(result);
    case 'tampering': {
      if (!result) return 'NOT_AVAILABLE';
      const tStat = (result.status || result.overall_status || '')?.toString().toUpperCase();
      if (tStat === 'LOW_SUSPICION' || tStat === 'PASS') return 'PASS';
      if (tStat === 'MEDIUM_SUSPICION' || tStat === 'REVIEW') return 'REVIEW';
      if (tStat === 'HIGH_SUSPICION' || tStat === 'FAIL') return 'FAIL';
      return 'NOT_AVAILABLE';
    }
    case 'face': {
      if (!result) return 'NOT_AVAILABLE';
      const fStat = (result.status || result.overall_status || '')?.toString().toUpperCase();
      if (fStat === 'MATCH' || fStat === 'PASS') return 'PASS';
      if (fStat === 'REVIEW' || fStat === 'IMAGE_QUALITY_INSUFFICIENT') return 'REVIEW';
      if (fStat === 'MISMATCH' || fStat === 'FAIL') return 'FAIL';
      return 'NOT_AVAILABLE';
    }
    case 'liveness': {
      if (!result) return 'NOT_AVAILABLE';
      const lStat = (result.status || result.overall_status || '')?.toString().toUpperCase();
      if (lStat === 'PASS') return 'PASS';
      if (lStat === 'REVIEW') return 'REVIEW';
      if (lStat === 'FAIL') return 'FAIL';
      return 'NOT_AVAILABLE';
    }
    case 'quality': {
      if (!result) return 'NOT_AVAILABLE';
      const qStat = (result.status || result.overall_status || '')?.toString().toUpperCase();
      if (qStat === 'GOOD' || qStat === 'PASS') return 'PASS';
      if (qStat === 'FAIR' || qStat === 'REVIEW') return 'REVIEW';
      if (qStat === 'POOR' || qStat === 'FAIL') return 'FAIL';
      return 'NOT_AVAILABLE';
    }
    default:
      return 'NOT_AVAILABLE';
  }
}
