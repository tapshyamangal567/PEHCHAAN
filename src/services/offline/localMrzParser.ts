/**
 * Pure TypeScript deterministic on-device ICAO Doc 9303 TD3 MRZ Parser.
 * Runs 100% locally without external network or server dependencies.
 */

export interface LocalMrzValidationDetails {
  passport_number_valid: boolean;
  dob_valid: boolean;
  expiry_valid: boolean;
  composite_valid: boolean;
  overall_valid: boolean;
}

export interface LocalMrzResult {
  detected: boolean;
  status: 'VERIFIED_LOCALLY' | 'FAILED_LOCALLY' | 'NOT_DETECTED';
  document_type: string;
  issuing_country: string;
  full_name: string;
  passport_number: string;
  nationality: string;
  date_of_birth: string;
  gender: string;
  date_of_expiry: string;
  checksum_valid: boolean;
  validation_details: LocalMrzValidationDetails;
  raw_line1: string;
  raw_line2: string;
}

const WEIGHTS = [7, 3, 1];

function getCharValue(char: string): number {
  if (char >= '0' && char <= '9') {
    return parseInt(char, 10);
  }
  if (char >= 'A' && char <= 'Z') {
    return char.charCodeAt(0) - 55; // 'A' = 10, 'B' = 11, etc.
  }
  return 0; // '<' or filler
}

export function computeCheckDigit(data: string): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const val = getCharValue(data[i]);
    const weight = WEIGHTS[i % 3];
    sum += val * weight;
  }
  return sum % 10;
}

export function verifyCheckDigit(data: string, checkDigitChar: string): boolean {
  if (!checkDigitChar || checkDigitChar === '<') return false;
  const expected = parseInt(checkDigitChar, 10);
  if (isNaN(expected)) return false;
  return computeCheckDigit(data) === expected;
}

function formatDate(yymmdd: string): string {
  if (yymmdd.length !== 6 || yymmdd.includes('<')) return yymmdd;
  const yy = parseInt(yymmdd.substring(0, 2), 10);
  const mm = yymmdd.substring(2, 4);
  const dd = yymmdd.substring(4, 6);
  // Century estimation (e.g. 70-99 -> 1900s, 00-69 -> 2000s)
  const currentYearLast2 = new Date().getFullYear() % 100;
  const century = yy > currentYearLast2 + 10 ? '19' : '20';
  return `${dd}/${mm}/${century}${yy.toString().padStart(2, '0')}`;
}

export function parseLocalMrz(line1: string, line2: string): LocalMrzResult {
  // Normalize lines (clean whitespace, uppercase)
  const clean1 = line1.replace(/[^A-Z0-9<]/g, '').padEnd(44, '<').substring(0, 44);
  const clean2 = line2.replace(/[^A-Z0-9<]/g, '').padEnd(44, '<').substring(0, 44);

  // Line 1 extraction
  const docType = clean1.substring(0, 2).replace(/</g, '');
  const issuingCountry = clean1.substring(2, 5).replace(/</g, '');

  const nameSection = clean1.substring(5);
  const nameParts = nameSection.split('<<');
  const surname = (nameParts[0] || '').replace(/</g, ' ').trim();
  const givenNames = (nameParts[1] || '').replace(/</g, ' ').trim();
  const fullName = [surname, givenNames].filter(Boolean).join(' ');

  // Line 2 extraction
  const docNumRaw = clean2.substring(0, 9);
  const docNumCheck = clean2.substring(9, 10);
  const nationality = clean2.substring(10, 13).replace(/</g, '');
  const dobRaw = clean2.substring(13, 19);
  const dobCheck = clean2.substring(19, 20);
  const genderChar = clean2.substring(20, 21);
  const expiryRaw = clean2.substring(21, 27);
  const expiryCheck = clean2.substring(27, 28);
  const optionalData = clean2.substring(28, 42);
  const optionalCheck = clean2.substring(42, 43);
  const compositeCheck = clean2.substring(43, 44);

  // Checksum validations
  const passportNumberValid = verifyCheckDigit(docNumRaw, docNumCheck);
  const dobValid = verifyCheckDigit(dobRaw, dobCheck);
  const expiryValid = verifyCheckDigit(expiryRaw, expiryCheck);

  // Composite check data: Line 2 positions 0-9 (docnum+check), 13-19 (dob+check), 21-42 (expiry+check+optional)
  const compositeData =
    clean2.substring(0, 10) + clean2.substring(13, 20) + clean2.substring(21, 43);
  const compositeValid = verifyCheckDigit(compositeData, compositeCheck);

  const overallValid = passportNumberValid && dobValid && expiryValid;

  return {
    detected: true,
    status: overallValid ? 'VERIFIED_LOCALLY' : 'FAILED_LOCALLY',
    document_type: docType || 'P',
    issuing_country: issuingCountry || 'IND',
    full_name: fullName,
    passport_number: docNumRaw.replace(/</g, ''),
    nationality: nationality || 'IND',
    date_of_birth: formatDate(dobRaw),
    gender: genderChar === 'M' ? 'M' : genderChar === 'F' ? 'F' : 'Unspecified',
    date_of_expiry: formatDate(expiryRaw),
    checksum_valid: overallValid,
    validation_details: {
      passport_number_valid: passportNumberValid,
      dob_valid: dobValid,
      expiry_valid: expiryValid,
      composite_valid: compositeValid,
      overall_valid: overallValid,
    },
    raw_line1: clean1,
    raw_line2: clean2,
  };
}

export default parseLocalMrz;
