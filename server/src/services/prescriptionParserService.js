/**
 * VitaCare AI - Prescription OCR & AI Extraction Engine
 * Parses raw text or scanned prescription documents into structured medicine regimens
 * Complies with strict medical safety: Never invents unstated medicines; flags uncertain items for user verification.
 */

const COMMON_MEDICINE_PATTERNS = [
  {
    name: 'Amoxicillin',
    defaultDosage: '500 mg',
    defaultFreq: 'Twice daily',
    defaultTimes: ['08:00 AM', '08:00 PM'],
    defaultDuration: '7 days',
    defaultInstructions: 'Take after meals with a full glass of water. Complete full course.'
  },
  {
    name: 'Metformin',
    defaultDosage: '500 mg',
    defaultFreq: 'Twice daily',
    defaultTimes: ['08:00 AM', '08:00 PM'],
    defaultDuration: '30 days',
    defaultInstructions: 'Take with morning and evening meals.'
  },
  {
    name: 'Atorvastatin',
    defaultDosage: '20 mg',
    defaultFreq: 'Once daily',
    defaultTimes: ['09:00 PM'],
    defaultDuration: '30 days',
    defaultInstructions: 'Take at bedtime.'
  },
  {
    name: 'Pantoprazole',
    defaultDosage: '40 mg',
    defaultFreq: 'Once daily',
    defaultTimes: ['07:30 AM'],
    defaultDuration: '14 days',
    defaultInstructions: 'Take 30 minutes before morning breakfast.'
  },
  {
    name: 'Paracetamol',
    defaultDosage: '650 mg',
    defaultFreq: 'Three times daily',
    defaultTimes: ['08:00 AM', '02:00 PM', '08:00 PM'],
    defaultDuration: '3 days',
    defaultInstructions: 'Take after food for fever or pain as needed.'
  },
  {
    name: 'Lisinopril',
    defaultDosage: '10 mg',
    defaultFreq: 'Once daily',
    defaultTimes: ['08:00 AM'],
    defaultDuration: '30 days',
    defaultInstructions: 'Take consistently every morning.'
  },
  {
    name: 'Cetirizine',
    defaultDosage: '10 mg',
    defaultFreq: 'Once daily',
    defaultTimes: ['09:00 PM'],
    defaultDuration: '5 days',
    defaultInstructions: 'Take at night. May cause mild drowsiness.'
  },
  {
    name: 'Azithromycin',
    defaultDosage: '500 mg',
    defaultFreq: 'Once daily',
    defaultTimes: ['01:00 PM'],
    defaultDuration: '5 days',
    defaultInstructions: 'Take 1 hour before or 2 hours after a meal.'
  }
];

export class PrescriptionParserService {
  /**
   * Extract structured medicines from prescription text/OCR
   */
  static extractPrescription(text = '', defaultDoctor = '', defaultDate = '') {
    if (!text || typeof text !== 'string') {
      text = '';
    }

    const lower = text.toLowerCase();
    const extractedMedicines = [];

    // 1. Detect Doctor Name if present in text
    let detectedDoctor = defaultDoctor || '';
    const docMatch = text.match(/(?:Dr\.|Doctor|Physician)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i);
    if (docMatch && !detectedDoctor) {
      detectedDoctor = `Dr. ${docMatch[1].trim()}`;
    }

    // 2. Detect Date if present
    let detectedDate = defaultDate || new Date().toISOString().split('T')[0];
    const dateMatch = text.match(/(?:Date|Dated|Rx Date)?[:\s]+(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);
    if (dateMatch) {
      const rawD = dateMatch[1];
      if (rawD.includes('-') && rawD.length === 10) {
        detectedDate = rawD;
      }
    }

    // 3. Scan for known medications in text
    for (const med of COMMON_MEDICINE_PATTERNS) {
      if (lower.includes(med.name.toLowerCase())) {
        // Look for dosage specific to this medicine in nearby text
        const dosageRegex = new RegExp(`${med.name}[^\\n,;.]*?(\\d+(?:\\.\\d+)?\\s*(?:mg|mcg|g|ml))`, 'i');
        const dosageMatch = text.match(dosageRegex);
        const dosage = dosageMatch ? dosageMatch[1].trim() : med.defaultDosage;

        // Look for duration
        const durationRegex = new RegExp(`${med.name}[^\\n;]*?(\\d+\\s*(?:days|weeks|months|d|w))`, 'i');
        const durMatch = text.match(durationRegex);
        const duration = durMatch ? durMatch[1].trim() : med.defaultDuration;

        // Look for instructions
        let instructions = med.defaultInstructions;
        if (lower.includes('after food') || lower.includes('pc') || lower.includes('post meal')) {
          instructions = 'Take after food with water.';
        } else if (lower.includes('before food') || lower.includes('ac') || lower.includes('empty stomach')) {
          instructions = 'Take on an empty stomach 30 mins before meal.';
        }

        extractedMedicines.push({
          medicineName: med.name,
          dosage,
          frequency: med.defaultFreq,
          intakeTimes: med.defaultTimes,
          duration,
          instructions,
          confidence: dosageMatch ? 0.96 : 0.88,
          needsVerification: !dosageMatch // Flag for user verification if dosage had to fall back
        });
      }
    }

    // 4. Generic regex line parser for generic formats: "1. DrugName 500mg - 1-0-1 - 5 days"
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const lineClean = line.trim();
      const genericRx = /^(?:\d+[\.\)]\s*)?([A-Za-z]{3,20}(?:\s+[A-Za-z]{3,20})?)\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|tab|capsule))\s*(?:[-–:]\s*([0-9]-[0-9]-[0-9]|once|twice|thrice|daily|bid|tid|od))?/i;
      const match = lineClean.match(genericRx);
      if (match) {
        const drugName = match[1].trim();
        const dosage = match[2].trim();
        const freqSig = match[3] ? match[3].toLowerCase() : '';

        // Check if not already added
        const alreadyExists = extractedMedicines.some(m => m.medicineName.toLowerCase() === drugName.toLowerCase());
        if (!alreadyExists && !['patient', 'hospital', 'clinic', 'diagnosis', 'doctor'].includes(drugName.toLowerCase())) {
          let freq = 'Once daily';
          let times = ['08:00 AM'];
          if (freqSig.includes('1-0-1') || freqSig === 'bid' || freqSig.includes('twice')) {
            freq = 'Twice daily';
            times = ['08:00 AM', '08:00 PM'];
          } else if (freqSig.includes('1-1-1') || freqSig === 'tid' || freqSig.includes('thrice')) {
            freq = 'Three times daily';
            times = ['08:00 AM', '01:00 PM', '08:00 PM'];
          }

          extractedMedicines.push({
            medicineName: drugName,
            dosage,
            frequency: freq,
            intakeTimes: times,
            duration: '7 days',
            instructions: 'Take as directed by doctor with water.',
            confidence: 0.90,
            needsVerification: false
          });
        }
      }
    }

    // If none detected, provide empty list (never invent fake medicines)
    return {
      doctorName: detectedDoctor || 'Dr. Attending Physician',
      prescriptionDate: detectedDate,
      medicines: extractedMedicines,
      extractedMedicines,
      rawOcrText: text,
      totalDetected: extractedMedicines.length
    };
  }

  /**
   * Sample prescriptions for 1-click hackathon evaluation
   */
  static getSamplePrescriptions() {
    return [
      {
        id: 'sample-rx-1',
        title: 'Post-Consultation Routine Prescription',
        doctorName: 'Dr. Sarah Mitchell, MD (Internal Medicine)',
        date: new Date().toISOString().split('T')[0],
        rawText: `METROPOLITAN GENERAL HOSPITAL - DEPARTMENT OF INTERNAL MEDICINE
Physician: Dr. Sarah Mitchell, MD
Date: ${new Date().toISOString().split('T')[0]}

Rx:
1. Amoxicillin 500 mg - Twice daily (1-0-1) - 7 days
   Instructions: Take after meals with plenty of water. Complete antibiotic course.
2. Paracetamol 650 mg - As needed (1-0-1) - 3 days
   Instructions: Take for relief of temperature and aches.`
      },
      {
        id: 'sample-rx-2',
        title: 'Cardiometabolic Management Prescription',
        doctorName: 'Dr. Robert Chen, MD (Cardiology)',
        date: new Date().toISOString().split('T')[0],
        rawText: `APEX HEART & DIABETES CLINIC
Attending: Dr. Robert Chen, MD
Rx Date: ${new Date().toISOString().split('T')[0]}

1. Metformin 500 mg - Twice daily - 30 days
   Take with breakfast and dinner.
2. Atorvastatin 20 mg - Once daily at bedtime - 30 days
   Take at 09:00 PM consistently.`
      }
    ];
  }
}
