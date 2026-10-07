/**
 * Report Parser & Clinical Comparison Engine
 * Extracts, normalizes, and compares biomarkers across medical reports
 */

// Common standard reference ranges for layperson interpretation
const REFERENCE_DATABASE = {
  'hba1c': { name: 'HbA1c', unit: '%', min: 4.0, max: 5.6, higherIsWorse: true, category: 'glycemic' },
  'fasting glucose': { name: 'Fasting Blood Glucose', unit: 'mg/dL', min: 70, max: 99, higherIsWorse: true, category: 'glycemic' },
  'glucose': { name: 'Blood Glucose', unit: 'mg/dL', min: 70, max: 140, higherIsWorse: true, category: 'glycemic' },
  'total cholesterol': { name: 'Total Cholesterol', unit: 'mg/dL', min: 125, max: 200, higherIsWorse: true, category: 'lipid' },
  'ldl': { name: 'LDL Cholesterol', unit: 'mg/dL', min: 50, max: 100, higherIsWorse: true, category: 'lipid' },
  'hdl': { name: 'HDL Cholesterol', unit: 'mg/dL', min: 40, max: 90, higherIsWorse: false, category: 'lipid' }, // higher is better
  'triglycerides': { name: 'Triglycerides', unit: 'mg/dL', min: 50, max: 150, higherIsWorse: true, category: 'lipid' },
  'hemoglobin': { name: 'Hemoglobin', unit: 'g/dL', min: 12.0, max: 16.5, higherIsWorse: false, category: 'cbc' },
  'wbc': { name: 'White Blood Cell Count', unit: 'x10^3/uL', min: 4.0, max: 11.0, higherIsWorse: true, category: 'cbc' },
  'platelets': { name: 'Platelet Count', unit: 'x10^3/uL', min: 150, max: 450, higherIsWorse: false, category: 'cbc' },
  'creatinine': { name: 'Serum Creatinine', unit: 'mg/dL', min: 0.6, max: 1.2, higherIsWorse: true, category: 'renal' },
  'bun': { name: 'Blood Urea Nitrogen (BUN)', unit: 'mg/dL', min: 7, max: 20, higherIsWorse: true, category: 'renal' },
  'tsh': { name: 'Thyroid Stimulating Hormone (TSH)', unit: 'uIU/mL', min: 0.4, max: 4.0, higherIsWorse: true, category: 'thyroid' },
  'heart rate': { name: 'Heart Rate (Pulse)', unit: 'bpm', min: 60, max: 100, higherIsWorse: true, category: 'vitals' },
  'spo2': { name: 'SpO2 Oxygen Saturation', unit: '%', min: 95, max: 100, higherIsWorse: false, category: 'vitals' },
  'weight': { name: 'Body Weight', unit: 'kg', min: 50, max: 85, higherIsWorse: true, category: 'vitals' },
  'temperature': { name: 'Body Temperature', unit: '°F', min: 97.0, max: 99.0, higherIsWorse: true, category: 'vitals' },
  'systolic': { name: 'Systolic Blood Pressure', unit: 'mmHg', min: 90, max: 120, higherIsWorse: true, category: 'cardio' },
  'diastolic': { name: 'Diastolic Blood Pressure', unit: 'mmHg', min: 60, max: 80, higherIsWorse: true, category: 'cardio' }
};

export class ReportParserService {
  /**
   * Parse extracted raw text or form fields into structured clinical biomarkers and vitals
   */
  static extractBiomarkersFromText(text = '') {
    const biomarkers = [];
    if (!text || typeof text !== 'string') return biomarkers;

    const lower = text.toLowerCase();

    // Regex checks for vitals & laboratory biomarkers
    const patterns = [
      { key: 'hba1c', regex: /hba1c(?:[:\s=-]+)([0-9]+(?:\.[0-9]+)?)\s*(%?)/i },
      { key: 'fasting glucose', regex: /(?:fasting\s+(?:blood\s+)?(?:sugar|glucose)|fbs)(?:[:\s=-]+)([0-9]+(?:\.[0-9]+)?)\s*(mg\/dl)?/i },
      { key: 'glucose', regex: /(?:random\s+(?:blood\s+)?(?:sugar|glucose)|blood\s+glucose)(?:[:\s=-]+)([0-9]+(?:\.[0-9]+)?)\s*(mg\/dl)?/i },
      { key: 'total cholesterol', regex: /(?:total\s+cholesterol|cholesterol\s+total)(?:[:\s=-]+)([0-9]+(?:\.[0-9]+)?)\s*(mg\/dl)?/i },
      { key: 'ldl', regex: /(?:ldl(?:\s+cholesterol)?)(?:[:\s=-]+)([0-9]+(?:\.[0-9]+)?)\s*(mg\/dl)?/i },
      { key: 'hdl', regex: /(?:hdl(?:\s+cholesterol)?)(?:[:\s=-]+)([0-9]+(?:\.[0-9]+)?)\s*(mg\/dl)?/i },
      { key: 'triglycerides', regex: /(?:triglycerides|tg)(?:[:\s=-]+)([0-9]+(?:\.[0-9]+)?)\s*(mg\/dl)?/i },
      { key: 'hemoglobin', regex: /(?:hemoglobin|hb)(?:[:\s=-]+)([0-9]+(?:\.[0-9]+)?)\s*(g\/dl)?/i },
      { key: 'wbc', regex: /(?:wbc|white\s+blood\s+cells?)(?:[:\s=-]+)([0-9]+(?:\.[0-9]+)?)/i },
      { key: 'platelets', regex: /(?:platelets?)(?:[:\s=-]+)([0-9]+(?:\.[0-9]+)?)/i },
      { key: 'creatinine', regex: /(?:serum\s+creatinine|creatinine)(?:[:\s=-]+)([0-9]+(?:\.[0-9]+)?)\s*(mg\/dl)?/i },
      { key: 'tsh', regex: /(?:tsh|thyroid\s+stimulating)(?:[:\s=-]+)([0-9]+(?:\.[0-9]+)?)\s*(uIU\/ml|uiu\/ml)?/i },
      { key: 'heart rate', regex: /(?:heart\s+rate|pulse|hr)(?:[:\s=-]+)([0-9]{2,3})\s*(?:bpm)?/i },
      { key: 'spo2', regex: /(?:spo2|oxygen\s+saturation|pulse\s+ox)(?:[:\s=-]+)([0-9]{2,3})\s*(%?)/i },
      { key: 'weight', regex: /(?:weight|wt)(?:[:\s=-]+)([0-9]+(?:\.[0-9]+)?)\s*(?:kg)?/i },
      { key: 'temperature', regex: /(?:temperature|temp)(?:[:\s=-]+)([0-9]{2,3}(?:\.[0-9]+)?)\s*(?:°?f)?/i },
      { key: 'systolic', regex: /(?:blood\s+pressure|bp)(?:[:\s=-]+)([0-9]{2,3})\s*\/\s*([0-9]{2,3})/i }
    ];

    for (const pat of patterns) {
      const match = text.match(pat.regex);
      if (match) {
        if (pat.key === 'systolic') {
          const sysVal = parseFloat(match[1]);
          const diaVal = parseFloat(match[2]);
          if (!isNaN(sysVal)) {
            biomarkers.push(this.createBiomarkerObj('systolic', sysVal));
          }
          if (!isNaN(diaVal)) {
            biomarkers.push(this.createBiomarkerObj('diastolic', diaVal));
          }
        } else {
          const val = parseFloat(match[1]);
          if (!isNaN(val)) {
            biomarkers.push(this.createBiomarkerObj(pat.key, val));
          }
        }
      }
    }

    return biomarkers;
  }

  static createBiomarkerObj(key, val) {
    const ref = REFERENCE_DATABASE[key] || {
      name: key.toUpperCase(),
      unit: '',
      min: 0,
      max: 100,
      higherIsWorse: true,
      category: 'general'
    };

    let status = 'normal';
    if (val < ref.min) status = 'low';
    else if (val > ref.max) status = 'elevated';

    return {
      name: ref.name,
      key: key,
      value: val,
      unit: ref.unit,
      referenceRange: `${ref.min} - ${ref.max} ${ref.unit}`,
      category: ref.category,
      status
    };
  }

  /**
   * Generates a plain-language layperson summary of a medical report
   */
  static generatePlainLanguageSummary(reportType, biomarkers = [], notes = '') {
    if (biomarkers.length === 0) {
      if (reportType === 'prescription') {
        return "Prescription document recorded. Follow physician dosage directions carefully.";
      }
      if (reportType === 'discharge_summary') {
        return "Hospital discharge summary recorded. Review post-discharge instructions and follow up as scheduled.";
      }
      return "Medical report saved to your private record.";
    }

    const elevated = biomarkers.filter(b => b.status === 'elevated');
    const low = biomarkers.filter(b => b.status === 'low');
    const normal = biomarkers.filter(b => b.status === 'normal');

    let summary = `This report contains ${biomarkers.length} measured health indicators. `;

    if (elevated.length === 0 && low.length === 0) {
      summary += `All extracted biomarkers (${biomarkers.map(b => b.name).join(', ')}) fall within standard reference intervals.`;
    } else {
      const issues = [];
      if (elevated.length > 0) {
        issues.push(`${elevated.map(b => `${b.name} (${b.value} ${b.unit})`).join(', ')} measured higher than standard reference`);
      }
      if (low.length > 0) {
        issues.push(`${low.map(b => `${b.name} (${b.value} ${b.unit})`).join(', ')} measured lower than standard reference`);
      }
      summary += issues.join('; ') + '. ';
      summary += 'Please consult your ordering physician for personalized medical review.';
    }

    return summary;
  }

  /**
   * Compare previous report with current report
   */
  static compareReports(currentReport, previousReport) {
    if (!previousReport) {
      return {
        hasComparison: false,
        message: 'First report on record for this category. Baseline established for future comparison.'
      };
    }

    const currentBiomarkers = typeof currentReport.extracted_data === 'string'
      ? JSON.parse(currentReport.extracted_data || '[]')
      : (currentReport.extracted_data || []);

    const prevBiomarkers = typeof previousReport.extracted_data === 'string'
      ? JSON.parse(previousReport.extracted_data || '[]')
      : (previousReport.extracted_data || []);

    const comparisons = [];
    let improvedCount = 0;
    let worsenedCount = 0;
    let unchangedCount = 0;

    for (const curr of currentBiomarkers) {
      const matchedPrev = prevBiomarkers.find(p => p.name.toLowerCase() === curr.name.toLowerCase() || p.key === curr.key);
      if (matchedPrev && typeof matchedPrev.value === 'number') {
        const delta = curr.value - matchedPrev.value;
        const pctChange = matchedPrev.value !== 0 ? ((delta / matchedPrev.value) * 100).toFixed(1) : '0';

        const refKey = curr.key || curr.name.toLowerCase();
        const ref = REFERENCE_DATABASE[refKey];

        let trajectory = 'unchanged';
        if (Math.abs(delta) < 0.05) {
          trajectory = 'unchanged';
          unchangedCount++;
        } else if (ref) {
          if (ref.higherIsWorse) {
            // Lower is improved towards normal
            trajectory = delta < 0 ? 'improved' : 'worsened';
          } else {
            // Higher is improved towards normal
            trajectory = delta > 0 ? 'improved' : 'worsened';
          }
          if (trajectory === 'improved') improvedCount++;
          else worsenedCount++;
        } else {
          trajectory = delta === 0 ? 'unchanged' : 'changed';
        }

        comparisons.push({
          name: curr.name,
          currentValue: curr.value,
          previousValue: matchedPrev.value,
          unit: curr.unit,
          delta: parseFloat(delta.toFixed(2)),
          percentageChange: parseFloat(pctChange),
          currentStatus: curr.status,
          previousStatus: matchedPrev.status,
          trajectory, // 'improved' | 'worsened' | 'unchanged'
          referenceRange: curr.referenceRange
        });
      }
    }

    // Synthesize simple AI comparison explanation
    let aiExplanation = '';
    if (comparisons.length === 0) {
      aiExplanation = `Comparison between ${previousReport.report_date} and ${currentReport.report_date}: No overlapping numerical biomarkers were found to calculate trajectory changes.`;
    } else {
      const highlights = comparisons.map(c => {
        const sign = c.delta > 0 ? '+' : '';
        const trendWord = c.trajectory === 'improved' ? '✅ Improved' : c.trajectory === 'worsened' ? '⚠️ Elevated/Needs attention' : '➡️ Stable';
        return `${c.name}: ${c.previousValue} ${c.unit} → ${c.currentValue} ${c.unit} (${sign}${c.percentageChange}% change, ${trendWord})`;
      });

      aiExplanation = `Comparing ${currentReport.report_date} against ${previousReport.report_date} (${comparisons.length} biomarkers matched):\n` +
        highlights.join('\n') +
        `\nOverall: ${improvedCount} improved, ${worsenedCount} shifted away from target, ${unchangedCount} stable. Always discuss trends with your treating physician.`;
    }

    return {
      hasComparison: true,
      previousReportId: previousReport.id,
      previousReportDate: previousReport.report_date,
      currentReportDate: currentReport.report_date,
      comparisons,
      summaryStats: {
        improvedCount,
        worsenedCount,
        unchangedCount,
        totalCompared: comparisons.length
      },
      aiExplanation
    };
  }

  /**
   * Sample health reports for 1-click hackathon evaluation
   */
  static getSampleReports() {
    return [
      {
        id: 'sample-report-cbc',
        title: 'Complete Blood Count & Vital Vitals Panel',
        reportType: 'lab_test',
        doctorName: 'Dr. Michael Sanders, MD',
        facilityName: 'Apex Diagnostic PathLab',
        reportDate: new Date().toISOString().split('T')[0],
        rawText: `APEX DIAGNOSTIC PATHLAB - CLINICAL HEMATOLOGY & METABOLIC REPORT
Patient Name: Authorized Patient
Ordering Physician: Dr. Michael Sanders, MD
Collection Date: ${new Date().toISOString().split('T')[0]}

CLINICAL VITALS:
Blood Pressure: 124/80 mmHg (Normal: 90/60 - 120/80)
Heart Rate: 72 bpm (Normal: 60 - 100)
SpO2: 98% (Normal: 95 - 100%)
Body Weight: 74 kg
Temperature: 98.4 °F

LABORATORY RESULTS:
Hemoglobin: 14.2 g/dL (Reference: 12.0 - 16.5 g/dL)
Fasting Blood Glucose: 95 mg/dL (Reference: 70 - 99 mg/dL)
HbA1c: 5.4% (Reference: 4.0 - 5.6%)
Total Cholesterol: 182 mg/dL (Reference: 125 - 200 mg/dL)
LDL Cholesterol: 92 mg/dL (Reference: 50 - 100 mg/dL)
Serum Creatinine: 0.9 mg/dL (Reference: 0.6 - 1.2 mg/dL)`
      },
      {
        id: 'sample-report-glycemic',
        title: 'Comprehensive Glycemic & Lipid Profile',
        reportType: 'lab_test',
        doctorName: 'Dr. Sarah Mitchell, MD',
        facilityName: 'Metropolitan General Hospital Labs',
        reportDate: new Date().toISOString().split('T')[0],
        rawText: `METROPOLITAN GENERAL HOSPITAL - BIOCHEMISTRY DIVISION
Physician: Dr. Sarah Mitchell, MD
Date: ${new Date().toISOString().split('T')[0]}

Blood Pressure: 132/84 mmHg
Heart Rate: 78 bpm
SpO2: 97%
Fasting Blood Glucose: 118 mg/dL (Reference: 70 - 99 mg/dL)
HbA1c: 6.4% (Reference: 4.0 - 5.6%)
Total Cholesterol: 212 mg/dL (Reference: 125 - 200 mg/dL)
Triglycerides: 165 mg/dL (Reference: 50 - 150 mg/dL)
Serum Creatinine: 1.0 mg/dL (Reference: 0.6 - 1.2 mg/dL)`
      }
    ];
  }
}

