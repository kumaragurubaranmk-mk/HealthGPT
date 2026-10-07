import { config } from '../config/env.js';

// Comprehensive emergency keywords in English, Hindi, Tamil, Telugu
const EMERGENCY_KEYWORDS = [
  // English
  'chest pain', 'heart attack', 'shortness of breath', 'cannot breathe', 'difficulty breathing',
  'stroke', 'face drooping', 'slurred speech', 'arm numbness', 'sudden weakness',
  'severe bleeding', 'coughing blood', 'unconscious', 'fainted', 'seizure', 'convulsion',
  'anaphylaxis', 'throat swelling', 'swallowed poison', 'overdose', 'suicide', 'kill myself',
  'worst headache of my life', 'thunderclap headache', 'stiff neck with high fever',
  // Hindi transliteration & keywords
  'seene me dard', 'chhati me dard', 'saans lene me takleef', 'behosh', 'khoon nikal raha hai',
  // Tamil transliteration & keywords
  'nenju vali', 'swasa kolaru', 'moochu vida mudiyavillai', 'mayakkam', 'maradaipu',
  // Telugu transliteration & keywords
  'gunde noppi', 'oopiri aadadam ledu', 'gundepotu', 'spruha tappadam'
];

export class AIService {
  constructor() {
    this.provider = config.activeAiProvider || 'builtin';
    this.geminiKey = config.geminiApiKey;
    this.openaiKey = config.openaiApiKey;
  }

  setProvider(provider, apiKey = '') {
    this.provider = provider;
    if (provider === 'gemini') this.geminiKey = apiKey;
    else if (provider === 'openai') this.openaiKey = apiKey;
    else if (provider === 'builtin') {
      if (!apiKey) {
        this.geminiKey = '';
        this.openaiKey = '';
      }
    }
  }

  /**
   * Fast emergency safety filter to intercept life-threatening queries
   */
  detectEmergency(text = '') {
    const lower = text.toLowerCase();
    for (const keyword of EMERGENCY_KEYWORDS) {
      if (lower.includes(keyword)) {
        return {
          isEmergency: true,
          keyword: keyword
        };
      }
    }
    return { isEmergency: false, keyword: null };
  }

  /**
   * Main entrypoint for Health Assistant conversation & queries
   */
  async processHealthQuery({ message, language = 'en', moduleType = 'assistant', healthContext = {}, apiKey = null, provider = null }) {
    const emergencyCheck = this.detectEmergency(message);

    if (emergencyCheck.isEmergency) {
      const emRes = this.generateEmergencyResponse(language, emergencyCheck.keyword);
      emRes.isEmergency = true;
      emRes.providerUsed = 'safety-filter';
      return emRes;
    }

    // Determine effective provider and key
    let effectiveKey = (apiKey && typeof apiKey === 'string') ? apiKey.trim() : '';
    let effectiveProvider = provider || this.provider;

    if (!effectiveKey) {
      if (effectiveProvider === 'gemini' && this.geminiKey) effectiveKey = this.geminiKey;
      else if (effectiveProvider === 'openai' && this.openaiKey) effectiveKey = this.openaiKey;
      else if (this.geminiKey) { effectiveKey = this.geminiKey; effectiveProvider = 'gemini'; }
      else if (this.openaiKey) { effectiveKey = this.openaiKey; effectiveProvider = 'openai'; }
    }

    // Auto-detect provider if key supplied but provider unspecified or auto
    if (effectiveKey && (!provider || provider === 'auto' || provider === 'builtin')) {
      if (effectiveKey.startsWith('AIza')) effectiveProvider = 'gemini';
      else if (effectiveKey.startsWith('sk-')) effectiveProvider = 'openai';
      else effectiveProvider = 'gemini'; // default for Google Cloud/Gemini keys
    }

    // 1. Try Gemini if configured or provided
    if (effectiveProvider === 'gemini' && effectiveKey) {
      try {
        const geminiRes = await this.callGemini(message, language, moduleType, healthContext, effectiveKey);
        if (geminiRes) {
          geminiRes.providerUsed = 'gemini';
          return geminiRes;
        }
      } catch (err) {
        console.warn('[AIService] Gemini API error, seamlessly falling back to Intelligent Medical Engine:', err.message);
      }
    }

    // 2. Try OpenAI if configured or provided
    if (effectiveProvider === 'openai' && effectiveKey) {
      try {
        const openaiRes = await this.callOpenAI(message, language, moduleType, healthContext, effectiveKey);
        if (openaiRes) {
          openaiRes.providerUsed = 'openai';
          return openaiRes;
        }
      } catch (err) {
        console.warn('[AIService] OpenAI API error, seamlessly falling back to Intelligent Medical Engine:', err.message);
      }
    }

    // 3. Built-in intelligent clinical knowledge triage engine (100% offline, certified prompts)
    const builtinRes = await this.generateBuiltinResponse(message, language, moduleType, healthContext);
    builtinRes.providerUsed = 'builtin';
    return builtinRes;
  }

  generateEmergencyResponse(language, keyword) {
    const responses = {
      en: {
        summary: "⚠️ POTENTIAL MEDICAL EMERGENCY DETECTED: Immediate professional evaluation is urgently required.",
        formattedResponse: `⚠️ POTENTIAL MEDICAL EMERGENCY DETECTED

Possible Causes:
• Symptoms involving "${keyword}" may indicate an acute, time-sensitive emergency (such as a cardiac event, severe respiratory crisis, or stroke).

Safe Next Steps:
• CALL EMERGENCY SERVICES IMMEDIATELY: Dial 108 / 112 (India) or 911 (US) right now.
• Alert someone nearby, a family member, or neighbor to assist you.
• Sit or lie down in a safe, resting position while waiting for trained responders.
• Do not attempt to drive yourself to the hospital.

⚠️ When to Seek Medical Care:
• Seek emergency care immediately without delay. Do not wait for symptoms to worsen.`,
        possibleExplanations: [
          `Symptoms involving "${keyword}" can indicate acute, time-sensitive medical emergencies.`,
          "These conditions cannot be safely evaluated through an online assistant and require hands-on emergency care."
        ],
        whatUserCanDo: [
          "CALL EMERGENCY SERVICES IMMEDIATELY: Dial 108 / 112 (India) or 911 (US) right now.",
          "Alert someone nearby, a family member, or neighbor to assist you.",
          "Sit or lie down in a safe, comfortable position while waiting for emergency responders.",
          "Do not drive yourself to the hospital; await an ambulance with trained paramedics."
        ],
        whenToSeekHelp: [
          "Right now. Do not wait for symptoms to worsen or attempt home remedies."
        ],
        disclaimer: "EMERGENCY SAFETY ALERT: This platform is solely an educational prototype and is NEVER a substitute for emergency medical care. Please contact emergency services immediately.",
        emergencyWarning: "URGENT: Call 108 / 112 or your regional emergency helpline immediately."
      },
      ta: {
        summary: "⚠️ சாத்தியமான அவசர மருத்துவ நிலை கண்டறியப்பட்டது: உடனடி அவசர மருத்துவ உதவி தேவைப்படுகிறது.",
        formattedResponse: `⚠️ சாத்தியமான அவசர மருத்துவ நிலை கண்டறியப்பட்டது

சாத்தியமான காரணங்கள்:
• "${keyword}" தொடர்பான அறிகுறிகள் இதயம், சுவாசம் அல்லது நரம்பியல் சார்ந்த அவசர நிலையைக் குறிக்கலாம்.

பாதுகாப்பான உடனடி நடவடிக்கைகள்:
• உடனடியாக அவசர சிகிச்சை எண்ணை அழைக்கவும்: 108 அல்லது 112 (இந்தியா).
• அருகிலுள்ள குடும்பத்தினர் அல்லது நண்பர்களுக்கு உடனடியாகத் தெரிவிக்கவும்.
• ஆம்புலன்ஸ் வரும் வரை பாதுகாப்பான இடத்தில் அமரவும் அல்லது படுக்கவும்.

⚠️ மருத்துவரை எப்போது அணுக வேண்டும்:
• உடனடியாக அவசர சிகிச்சைப் பிரிவை அணுகவும். நேரத்தை வீணடிக்காதீர்கள்.`,
        possibleExplanations: [
          `"${keyword}" தொடர்பான அறிகுறிகள் அவசர நிலையைக் குறிக்கலாம்.`,
          "உடனடி மருத்துவமனை சிகிச்சை அவசியம்."
        ],
        whatUserCanDo: [
          "உடனடியாக அவசர சிகிச்சை எண்ணை அழைக்கவும்: 108 அல்லது 112 (இந்தியா).",
          "அருகிலுள்ள குடும்பத்தினர் அல்லது நண்பர்களுக்கு உடனடியாகத் தெரிவிக்கவும்.",
          "ஆம்புலன்ஸ் வரும் வரை பாதுகாப்பான இடத்தில் அமரவும்."
        ],
        whenToSeekHelp: [
          "உடனடியாக அவசர பிரிவை அணுகவும். நேரத்தை வீணடிக்காதீர்கள்."
        ],
        disclaimer: "அவசர எச்சரிக்கை: இந்த தளம் கல்வி நோக்கத்திற்கானது மட்டுமே. உடனடியாக அவசர மருத்துவ சேவையை தொடர்பு கொள்ளவும்.",
        emergencyWarning: "உடனடி எச்சரிக்கை: 108 / 112 எண்ணை உடனடியாக அழைக்கவும்."
      },
      te: {
        summary: "⚠️ తీవ్రమైన అత్యవసర వైద్య పరిస్థితి గుర్తించబడింది: తక్షణ నిపుణుల సహాయం అవసరం.",
        formattedResponse: `⚠️ తీవ్రమైన అత్యవసర వైద్య పరిస్థితి గుర్తించబడింది

సాధారణ కారణాలు:
• "${keyword}" సంబంధిత లక్షణాలు గుండె లేదా శ్వాసకోశ అత్యవసర పరిస్థితిని సూచించవచ్చు.

తక్షణ జాగ్రత్తలు:
• వెంటనే ఎమర్జెన్సీ నంబర్‌కు కాల్ చేయండి: 108 లేదా 112 (భారతదేశం).
• సమీపంలో ఉన్న కుటుంబ సభ్యులకు లేదా ఇతరులకు వెంటనే తెలియజేయండి.
• సహాయం వచ్చే వరకు సురక్షితమైన ప్రదేశంలో విశ్రాంతి తీసుకోండి.

⚠️ వైద్య సహాయం ఎప్పుడు పొందాలి:
• ఇప్పుడే తక్షణమే ఎమర్జెన్సీ సహాయం పొందండి. ఆలస్యం చేయవద్దు.`,
        possibleExplanations: [
          `"${keyword}" సంబంధిత లక్షణాలు గుండె లేదా శ్వాసకోశ అత్యవసర పరిస్థితిని సూచించవచ్చు.`
        ],
        whatUserCanDo: [
          "వెంటనే ఎమర్జెన్సీ నంబర్‌కు కాల్ చేయండి: 108 లేదా 112.",
          "సమీపంలో ఉన్న వారికి వెంటనే తెలియజేయండి."
        ],
        whenToSeekHelp: [
          "ఇప్పుడే తక్షణమే ఎమర్జెన్సీ సహాయం పొందండి."
        ],
        disclaimer: "అత్యవసర హెచ్చరిక: అత్యవసర వైద్య సేవలను సంప్రదించండి.",
        emergencyWarning: "అత్యవసరం: వెంటనే 108 లేదా 112 కి కాల్ చేయండి."
      },
      hi: {
        summary: "⚠️ संभावित आपातकालीन चिकित्सा स्थिति का पता चला: तत्काल पेशेवर मदद की आवश्यकता है।",
        formattedResponse: `⚠️ संभावित आपातकालीन चिकित्सा स्थिति का पता चला

संभावित कारण:
• "${keyword}" से संबंधित लक्षण गंभीर हृदय, श्वसन या तंत्रिका संबंधी आपात स्थिति का संकेत हो सकते हैं।

सुरक्षित त्वरित कदम:
• तुरंत 108 या 112 (भारत) पर कॉल करें।
• पास में किसी पारिवारिक सदस्य या पड़ोसी को तुरंत सूचित करें।
• एम्बुलेंस आने तक सुरक्षित स्थिति में बैठें या लेटें।

⚠️ डॉक्टर से कब मिलें:
• तुरंत आपातकालीन चिकित्सा सहायता लें। बिल्कुल भी इंतज़ार न करें।`,
        possibleExplanations: [
          `"${keyword}" से संबंधित लक्षण तीव्र आपात स्थिति का संकेत हो सकते हैं.`
        ],
        whatUserCanDo: [
          "तुरंत आपातकालीन नंबर 108 या 112 पर कॉल करें।",
          "पास के किसी व्यक्ति को सूचित करें।"
        ],
        whenToSeekHelp: [
          "अभी इसी वक्त आपातकालीन सेवा से संपर्क करें।"
        ],
        disclaimer: "आपातकालीन चेतावनी: पेशेवर आपातकालीन देखभाल का विकल्प नहीं है।",
        emergencyWarning: "चेतावनी: तुरंत 108 या 112 पर आपातकालीन सेवा से संपर्क करें।"
      }
    };

    const langData = responses[language] || responses.en;
    return {
      isEmergency: true,
      reply: langData.formattedResponse,
      data: langData
    };
  }

  /**
   * Intelligent Medical Knowledge Base providing short, simple, patient-friendly answers
   */
  generateBuiltinResponse(query, language = 'en', moduleType = 'assistant', healthContext = {}) {
    const q = query.toLowerCase();

    // 1. Patient Record Inquiries (Medications, Reports, Lab Tests)
    const activeMeds = healthContext.activeMedications || [];
    const recentReports = healthContext.recentReports || [];
    const recentBiomarkers = healthContext.recentBiomarkers || [];

    if (q.includes('medicines today') || q.includes('medicine do i have') || q.includes('what medicines') || q.includes('medication today')) {
      return this.handleActiveMedsInquiry(activeMeds, language);
    }
    if (q.includes('next medicine') || q.includes('upcoming medicine')) {
      return this.handleNextMedInquiry(activeMeds, language);
    }
    if (q.includes('what reports') || q.includes('reports did i upload') || q.includes('my reports')) {
      return this.handleReportsInquiry(recentReports, language);
    }
    if (q.includes('blood sugar') || q.includes('glucose results') || (q.includes('glucose') && (q.includes('recent') || q.includes('my') || q.includes('show')))) {
      return this.handleGlucoseInquiry(recentBiomarkers, language);
    }

    // 2. Clinical Specialty & Condition Detection
    let topic = 'general';

    if (q.includes('headache') || q.includes('head ache') || q.includes('migraine') || q.includes('heavy head') || q.includes('thalaivali') || q.includes('sar dard') || q.includes('tala noppi')) {
      topic = 'headache';
    } else if (q.includes('fever') || q.includes('temperature') || q.includes('chills') || q.includes('kaichal') || q.includes('bukhar') || q.includes('jwaram')) {
      topic = 'fever';
    } else if (q.includes('stomach') || q.includes('acidity') || q.includes('acid') || q.includes('heartburn') || q.includes('gerd') || q.includes('indigestion') || q.includes('gas') || q.includes('bloating') || q.includes('pet dard') || q.includes('vayitru') || q.includes('kadupu')) {
      topic = 'stomach';
    } else if (q.includes('cough') || q.includes('cold') || q.includes('sore throat') || q.includes('throat') || q.includes('sneezing') || q.includes('irumal') || q.includes('khansi') || q.includes('daggu')) {
      topic = 'respiratory';
    } else if (q.includes('chest pain') || q.includes('palpitations') || q.includes('heart racing') || q.includes('racing heart') || q.includes('heart beat')) {
      topic = 'cardiac';
    } else if (q.includes('blood pressure') || q.includes('hypertension') || q.includes('hypotension') || q.includes('high bp') || q.includes('low bp') || q.includes('bp check')) {
      topic = 'blood_pressure';
    } else if (q.includes('diabetes') || q.includes('sugar') || q.includes('insulin') || q.includes('glucose')) {
      topic = 'diabetes';
    } else if (q.includes('back pain') || q.includes('neck pain') || q.includes('joint pain') || q.includes('muscle') || q.includes('sprain') || q.includes('body ache') || q.includes('cramp')) {
      topic = 'musculoskeletal';
    } else if (q.includes('vomit') || q.includes('nausea') || q.includes('loose motion') || q.includes('diarrhea') || q.includes('food poisoning')) {
      topic = 'nausea_diarrhea';
    } else if (q.includes('dizzy') || q.includes('dizziness') || q.includes('vertigo') || q.includes('lightheaded') || q.includes('room spinning')) {
      topic = 'dizziness';
    } else if (q.includes('rash') || q.includes('itching') || q.includes('itchy') || q.includes('hives') || q.includes('skin allergy') || q.includes('insect bite')) {
      topic = 'dermatology';
    } else if (q.includes('sleep') || q.includes('insomnia') || q.includes('tired') || q.includes('fatigue') || q.includes('exhaustion')) {
      topic = 'sleep_fatigue';
    } else if (q.includes('first aid') || q.includes('cut') || q.includes('burn') || q.includes('bleeding') || q.includes('wound')) {
      topic = 'first_aid';
    } else if (q.includes('hemoglobin') || q.includes('cholesterol') || q.includes('creatinine') || q.includes('platelet') || q.includes('wbc') || q.includes('medical term') || q.includes('explain term')) {
      topic = 'medical_term';
    } else if (q.includes('medicine') || q.includes('medication') || q.includes('paracetamol') || q.includes('ibuprofen') || q.includes('antibiotic') || q.includes('dawa')) {
      topic = 'medication_guidance';
    }

    const payload = this.getConciseClinicalPayload(topic, query, language);
    return {
      isEmergency: false,
      reply: payload.formattedResponse,
      data: payload
    };
  }

  handleActiveMedsInquiry(activeMeds, language) {
    if (activeMeds.length === 0) {
      const resp = {
        summary: "You currently have no scheduled medications in your VitaCare profile.",
        formattedResponse: `Possible Causes / Status:
• You currently do not have any active medication reminders scheduled in your profile.

Safe Next Steps:
• You can add prescriptions or medicines anytime using "+ Add Prescription" or "+ Add Medicine".
• Always take medications with water according to your prescribing doctor's instructions.

⚠️ When to Seek Medical Care:
• Consult your doctor or pharmacist if you were prescribed medications that need to be scheduled.`,
        possibleExplanations: ["Your active medication schedule is currently empty."],
        whatUserCanDo: ["Add prescriptions in the Medicine Management tab to enable reminders."],
        whenToSeekHelp: ["Verify your regimen with your doctor or pharmacist."],
        disclaimer: "VitaCare AI provides educational medication tracking assistance."
      };
      return { isEmergency: false, reply: resp.formattedResponse, data: resp, usedStoredRecords: true };
    }

    const medLines = activeMeds.map(m => `• ${m.medicine_name} (${m.dosage}) — ${m.frequency || 'Scheduled'} at ${m.reminder_time || 'scheduled time'}`).join('\n');
    const resp = {
      summary: `You have ${activeMeds.length} active medicine(s) scheduled for today.`,
      formattedResponse: `Your Active Medications for Today:
${medLines}

Safe Next Steps:
• Take each dose on time with a full glass of water.
• Do not double up your dose if you miss a scheduled time.
• You can use CareConnect for video verification of scheduled pill intake.

⚠️ When to Seek Medical Care:
• Contact your prescribing physician immediately if you experience adverse side effects or unexpected symptoms.`,
      possibleExplanations: activeMeds.map(m => `${m.medicine_name} (${m.dosage}) at ${m.reminder_time || 'scheduled time'}`),
      whatUserCanDo: ["Take on time with water.", "Do not double dose."],
      whenToSeekHelp: ["Contact your doctor if you experience adverse effects."],
      disclaimer: "Follow your prescribing doctor's exact instructions."
    };
    return { isEmergency: false, reply: resp.formattedResponse, data: resp, usedStoredRecords: true };
  }

  handleNextMedInquiry(activeMeds, language) {
    if (activeMeds.length === 0) {
      const resp = {
        summary: "No upcoming medication scheduled today.",
        formattedResponse: `Next Scheduled Medication:
• No active medication reminders are currently registered in your profile.

Safe Next Steps:
• Add your prescription in Medicine Management to receive intake alerts.

⚠️ When to Seek Medical Care:
• Contact your doctor if you have questions about which medications to take.`,
        possibleExplanations: ["No scheduled medications registered."],
        whatUserCanDo: ["Add your prescription to start reminders."],
        whenToSeekHelp: ["Consult your healthcare provider if you require guidance."],
        disclaimer: "VitaCare AI reminder guidance."
      };
      return { isEmergency: false, reply: resp.formattedResponse, data: resp, usedStoredRecords: true };
    }

    const nextMed = activeMeds[0];
    const resp = {
      summary: `Your next medicine is ${nextMed.medicine_name} (${nextMed.dosage}) at ${nextMed.reminder_time || 'scheduled time'}.`,
      formattedResponse: `Next Scheduled Medication:
• ${nextMed.medicine_name} (${nextMed.dosage})
• Scheduled Time: ${nextMed.reminder_time || 'scheduled time'} (${nextMed.frequency || 'Daily'})

Safe Next Steps:
• Keep a glass of water ready and take at the scheduled time.
• ${nextMed.notes ? `Prescription note: ${nextMed.notes}` : 'Take with meals if indicated on your prescription label.'}

⚠️ When to Seek Medical Care:
• If you experience allergic symptoms or severe nausea after taking your dose, contact a doctor immediately.`,
      possibleExplanations: [`Next dose: ${nextMed.medicine_name} (${nextMed.dosage})`],
      whatUserCanDo: ["Take at scheduled time with water."],
      whenToSeekHelp: ["Contact doctor if experiencing side effects."],
      disclaimer: "Follow doctor's instructions."
    };
    return { isEmergency: false, reply: resp.formattedResponse, data: resp, usedStoredRecords: true };
  }

  handleReportsInquiry(recentReports, language) {
    if (recentReports.length === 0) {
      const resp = {
        summary: "No medical lab reports currently uploaded.",
        formattedResponse: `Your Medical Reports:
• You have not uploaded any lab reports or clinical scans yet.

Safe Next Steps:
• Click "+ Add Health Report" on your Reports tab to upload a PDF or image of your diagnostic lab results.
• Our automated parser will extract your biomarkers into your Health Tracker.

⚠️ When to Seek Medical Care:
• Always review official laboratory reports with your ordering physician.`,
        possibleExplanations: ["Your document vault has no uploaded reports yet."],
        whatUserCanDo: ["Upload reports using '+ Add Health Report'."],
        whenToSeekHelp: ["Discuss all lab test findings with your doctor."],
        disclaimer: "VitaCare AI stores authorized documents securely."
      };
      return { isEmergency: false, reply: resp.formattedResponse, data: resp, usedStoredRecords: true };
    }

    const reportLines = recentReports.map((r, i) => `${i + 1}. ${r.title} (${r.report_date})`).join('\n');
    const resp = {
      summary: `You have ${recentReports.length} report(s) on file in your vault.`,
      formattedResponse: `Uploaded Health Reports in Your Vault:
${reportLines}

Safe Next Steps:
• Open the Health Reports menu to view original PDFs, extracted clinical biomarkers, and AI summaries.
• Check the Health Tracker tab to view automatic trend charts for these reports.

⚠️ When to Seek Medical Care:
• Consult your primary care doctor if any biomarker results fall outside normal reference ranges.`,
      possibleExplanations: recentReports.map(r => `${r.title} (${r.report_date})`),
      whatUserCanDo: ["View reports in Reports tab.", "Track trends in Health Tracker."],
      whenToSeekHelp: ["Consult doctor regarding abnormal findings."],
      disclaimer: "Extracted data is based on your uploaded reports."
    };
    return { isEmergency: false, reply: resp.formattedResponse, data: resp, usedStoredRecords: true };
  }

  handleGlucoseInquiry(recentBiomarkers, language) {
    const glucoseBio = recentBiomarkers.find(b => b.biomarker_name?.toLowerCase().includes('glucose') || b.biomarker_name?.toLowerCase().includes('sugar'));
    if (glucoseBio) {
      const statusNote = glucoseBio.value > 125 ? 'Slightly elevated (fasting threshold: 100 mg/dL)' : 'Within normal fasting reference range';
      const resp = {
        summary: `Your latest Blood Glucose reading is ${glucoseBio.value} ${glucoseBio.unit}.`,
        formattedResponse: `Recent Blood Glucose Results:
• Recorded Reading: ${glucoseBio.value} ${glucoseBio.unit} (${glucoseBio.recorded_date || 'Recent'})
• Reference Range: ${glucoseBio.reference_range || '70 - 99 mg/dL'} (${statusNote})

Safe Next Steps:
• Maintain regular hydration with plain water throughout the day.
• Pair carbohydrates with protein and fiber to avoid sharp blood sugar spikes.
• View your historical glucose chart in the Health Tracker tab.

⚠️ When to Seek Medical Care:
• Seek medical care if blood sugar drops below 70 mg/dL (dizziness, shakiness) or persistently exceeds 180 mg/dL with extreme thirst or frequent urination.`,
        possibleExplanations: [`Fasting Glucose: ${glucoseBio.value} ${glucoseBio.unit}`],
        whatUserCanDo: ["Maintain balanced meals.", "Hydrate regularly."],
        whenToSeekHelp: ["Seek medical advice if values are persistently elevated."],
        disclaimer: "Extracted from verified laboratory records."
      };
      return { isEmergency: false, reply: resp.formattedResponse, data: resp, usedStoredRecords: true };
    }

    const resp = {
      summary: "Standard fasting blood glucose reference range is 70 - 99 mg/dL.",
      formattedResponse: `Blood Glucose Information:
• Normal fasting blood sugar is typically between 70 and 99 mg/dL.
• A fasting level of 100–125 mg/dL indicates prediabetes, while 126 mg/dL or higher on more than one test suggests diabetes.

Safe Next Steps:
• Upload your latest blood test report to automatically track your glucose readings.
• Eat balanced, low-glycemic meals and stay physically active.

⚠️ When to Seek Medical Care:
• Consult a healthcare professional if you experience symptoms like constant thirst, excessive urination, unexplained weight loss, or persistent fatigue.`,
      possibleExplanations: ["Normal fasting level: 70 - 99 mg/dL."],
      whatUserCanDo: ["Eat balanced meals.", "Track in Health Tracker."],
      whenToSeekHelp: ["Consult doctor if experiencing symptoms of diabetes."],
      disclaimer: "Educational health reference."
    };
    return { isEmergency: false, reply: resp.formattedResponse, data: resp, usedStoredRecords: false };
  }

  /**
   * Comprehensive medical domain knowledge with short, simple, patient-friendly answers
   */
  getConciseClinicalPayload(topic, rawQuery, language = 'en') {
    const knowledgeBase = {
      headache: {
        en: {
          summary: "Common causes include tension, dehydration, screen fatigue, or lack of rest.",
          formattedResponse: `Possible Causes:
• Likely due to tension or stress, dehydration, prolonged screen use, eye strain, or lack of sleep.

Safe Next Steps & Medicine Guidance:
• Rest in a quiet, dimly lit room and close your eyes.
• Drink 1–2 glasses of water to rehydrate.
• Place a cool or warm damp cloth across your forehead or neck.
• If suitable for you, mild over-the-counter pain relief (such as paracetamol 500 mg or ibuprofen) can help ease discomfort.

⚠️ When to Seek Medical Care:
• Seek immediate emergency care if the headache is sudden and exceptionally severe ("worst headache of your life").
• See a doctor immediately if accompanied by high fever, stiff neck, vomiting, confusion, vision changes, or weakness/numbness.`,
          possibleExplanations: ["Tension or stress", "Dehydration or screen fatigue", "Lack of rest or sleep"],
          whatUserCanDo: ["Rest in a quiet, dark room.", "Drink 1-2 glasses of water.", "Apply a cool compress.", "Consider mild OTC paracetamol 500 mg if suitable."],
          whenToSeekHelp: ["Sudden, explosive severe headache.", "Accompanied by stiff neck, fever, or confusion.", "Symptoms worsen or persist."]
        },
        ta: {
          summary: "மன அழுத்தம், நீரிழப்பு, அதிக திரை நேரம் அல்லது தூக்கமின்மை பொதுவான காரணங்கள்.",
          formattedResponse: `சாத்தியமான காரணங்கள்:
• மன அழுத்தம், அதிக நேரம் கணினி/மொபைல் திரை பார்த்தல், உடலில் நீர்ச்சத்து குறைவு அல்லது போதிய தூக்கமின்மை காரணமாக இருக்கலாம்.

பாதுகாப்பான உடனடி நடவடிக்கைகள்:
• அமைதியான, குறைந்த வெளிச்சமுள்ள அறையில் ஓய்வெடுக்கவும்.
• உடனடியாக 1-2 டம்ளர் தண்ணீர் குடிக்கவும்.
• நெற்றியில் குளிர்ந்த அல்லது வெதுவெதுப்பான துணியை வைக்கவும்.
• தேவைப்பட்டால் பாதுகாப்பான பாராசிட்டமால் (500 மிகி) போன்ற வலி நிவாரணி எடுத்துக்கொள்ளலாம்.

⚠️ மருத்துவரை எப்போது அணுக வேண்டும்:
• திடீரென தாங்க முடியாத அளவுக்கு கடுமையான தலைவலி ஏற்பட்டால்.
• அதிக காய்ச்சல், கழுத்து விரைப்பு, பார்வை மங்குதல் அல்லது வாந்தியுடன் தலைவலி இருந்தால் உடனே மருத்துவரை அணுகவும்.`,
          possibleExplanations: ["மன அழுத்தம்", "நீரிழப்பு", "திரை சோர்வு"],
          whatUserCanDo: ["ஓய்வெடுக்கவும்.", "தண்ணீர் குடிக்கவும்.", "குளிர்ந்த ஒத்தடம் கொடுக்கவும்."],
          whenToSeekHelp: ["கடுமையான திடீர் தலைவலி", "கழுத்து விரைப்பு மற்றும் காய்ச்சல்"]
        },
        te: {
          summary: "ఒత్తిడి, డీహైడ్రేషన్ లేదా నిద్రలేమి తలనొప్పికి సాధారణ కారణాలు.",
          formattedResponse: `సాధారణ కారణాలు:
• మానసిక ఒత్తిడి, ఎక్కువ సమయం స్క్రీన్ చూడటం, నీరు తక్కువగా తాగడం లేదా నిద్రలేమి వలన ఇది సంభవించవచ్చు.

సురక్షితమైన తక్షణ జాగ్రత్తలు:
• ప్రశాంతమైన, తక్కువ వెలుతురు ఉన్న గదిలో విశ్రాంతి తీసుకోండి.
• 1-2 గ్లాసుల మంచి నీరు త్రాగండి.
• నుదుటిపై చల్లని గుడ్డతో కాపడం పెట్టండి.
• నొప్పి తీవ్రంగా ఉంటే సాధారణ పారాసిటమాల్ (500 mg) తీసుకోవచ్చు.

⚠️ వైద్యుడిని ఎప్పుడు సంప్రదించాలి:
• హఠాత్తుగా తీవ్రమైన పిడుగులాంటి తలనొప్పి వచ్చినప్పుడు.
• తీవ్ర జ్వరం, మెడ బిగుతు, వాంతులు లేదా కంటి చూపు మందగించడం వంటి లక్షణాలు ఉంటే వెంటనే ఆసుపత్రికి వెళ్లండి.`,
          possibleExplanations: ["ఒత్తిడి", "డీహైడ్రేషన్", "స్క్రీన్ అలసట"],
          whatUserCanDo: ["విశ్రాంతి తీసుకోండి.", "నీరు త్రాగండి."],
          whenToSeekHelp: ["తీవ్రమైన ఆకస్మిక తలనొప్పి", "జ్వరం మరియు మెడ బిగుతు"]
        },
        hi: {
          summary: "तनाव, डिहाइड्रेशन, स्क्रीन थकान या नींद की कमी सिरदर्द के सामान्य कारण हैं।",
          formattedResponse: `संभावित कारण:
• आमतौर पर मानसिक तनाव, लंबे समय तक स्क्रीन देखने से आंखों पर दबाव, पानी की कमी (डिहाइड्रेशन) या नींद पूरी न होना।

सुरक्षित त्वरित कदम व घरेलू मार्गदर्शन:
• शांत और मंद रोशनी वाले कमरे में आँखें बंद करके आराम करें।
• तुरंत 1-2 गिलास पानी पिएं।
• माथे या गर्दन पर हल्के ठंडे पानी की पट्टी रखें।
• आवश्यकता पड़ने पर सुरक्षित ओवर-द-काउंटर पैरासिटामोल (500 mg) ले सकते हैं।

⚠️ डॉक्टर से कब संपर्क करें:
• यदि सिरदर्द अचानक और अत्यधिक तीव्र हो ("जीवन का सबसे तेज सिरदर्द")।
• तेज बुखार, गर्दन में अकड़न, उल्टी, धुंधला दिखना या कमजोरी होने पर तुरंत डॉक्टर को दिखाएं।`,
          possibleExplanations: ["तनाव और थकान", "डिहाइड्रेशन", "नींद की कमी"],
          whatUserCanDo: ["आराम करें.", "पानी पिएं.", "माथे पर ठंडी पट्टी रखें."],
          whenToSeekHelp: ["अत्यधिक तेज अचानक सिरदर्द.", "गर्दन में अकड़न या बुखार के साथ."]
        }
      },

      fever: {
        en: {
          summary: "Fever is typically the body's natural response to a viral or bacterial infection.",
          formattedResponse: `Possible Causes:
• Most commonly caused by a viral infection (common cold/flu), bacterial infection, or dehydration.

Safe Next Steps & Medicine Guidance:
• Rest comfortably in a cool, well-ventilated room with lightweight clothing.
• Drink plenty of fluids (water, ORS, clear soups, coconut water) to prevent dehydration.
• If temperature causes discomfort, an over-the-counter fever reducer like paracetamol (500 mg) can help lower body temperature.
• Use a lukewarm damp cloth on your forehead; avoid ice-cold water baths.

⚠️ When to Seek Medical Care:
• Seek immediate medical attention if temperature exceeds 103°F (39.4°C) or lasts longer than 3 days.
• Consult a doctor urgently if accompanied by difficulty breathing, stiff neck, persistent vomiting, or extreme lethargy.`,
          possibleExplanations: ["Viral infection", "Bacterial infection", "Dehydration"],
          whatUserCanDo: ["Drink fluids regularly.", "Rest in a cool room.", "Take paracetamol 500 mg if fever is uncomfortable."],
          whenToSeekHelp: ["Temperature over 103°F (39.4°C).", "Fever lasting over 3 days.", "Difficulty breathing or stiff neck."]
        }
      },

      stomach: {
        en: {
          summary: "Stomach pain and acidity are commonly caused by indigestion, gas, or dietary irritation.",
          formattedResponse: `Possible Causes:
• Indigestion, gastric acidity/GERD, trapped gas, eating spicy or oily food, or mild stomach irritation.

Safe Next Steps & Medicine Guidance:
• Sip warm water or mild herbal tea (such as chamomile or ginger tea).
• Avoid lying down immediately after eating; stay upright for at least 1–2 hours.
• Avoid spicy, fried, acidic foods, citrus fruits, and caffeine.
• An over-the-counter antacid (chewable tablet or liquid gel) can provide quick relief from acidity.

⚠️ When to Seek Medical Care:
• Seek emergency care if abdominal pain is sudden, severe, or sharp.
• Consult a doctor immediately if you vomit blood, pass dark/black stools, or if pain radiates to your chest or back.`,
          possibleExplanations: ["Indigestion or gas", "Gastric acidity / GERD", "Spicy food irritation"],
          whatUserCanDo: ["Sip warm water.", "Stay upright after meals.", "Take mild antacid if acidic."],
          whenToSeekHelp: ["Severe sharp abdominal pain.", "Vomiting blood or dark stool.", "Pain radiating to chest or back."]
        }
      },

      respiratory: {
        en: {
          summary: "Cough and sore throat are typically caused by viral respiratory infections or dry air.",
          formattedResponse: `Possible Causes:
• Viral upper respiratory infection (common cold, flu), seasonal allergies, dry indoor air, or post-nasal drip.

Safe Next Steps & Medicine Guidance:
• Gargle with warm salt water (1/2 tsp salt in warm water) 2–3 times a day to soothe throat inflammation.
• Drink warm fluids like herbal tea with honey and lemon or warm broth.
• Inhale gentle steam to loosen airway congestion and use throat lozenges for irritation.
• Over-the-counter saline nasal spray or mild cough syrup can provide relief.

⚠️ When to Seek Medical Care:
• See a doctor if you experience shortness of breath, wheezing, or difficulty swallowing.
• Seek prompt care if you cough up blood, have a high fever, or if symptoms persist beyond 10–14 days.`,
          possibleExplanations: ["Viral upper respiratory infection", "Seasonal allergies", "Dry air or throat irritation"],
          whatUserCanDo: ["Gargle with warm salt water.", "Drink warm honey lemon tea.", "Use steam inhalation."],
          whenToSeekHelp: ["Difficulty breathing or wheezing.", "Coughing up blood.", "Symptoms lasting over 10 days."]
        }
      },

      cardiac: {
        en: {
          summary: "Palpitations and chest sensations can be caused by stress, caffeine, or cardiac conditions.",
          formattedResponse: `Possible Causes:
• Anxiety, panic, high caffeine intake, dehydration, lack of sleep, or underlying cardiovascular issues.

Safe Next Steps & Medicine Guidance:
• Sit down immediately in a comfortable, upright position and loosen tight clothing.
• Take slow, steady, deep breaths in through your nose and out through your mouth for 5 minutes.
• Sip cool water and avoid all caffeine, nicotine, and physical exertion.

⚠️ When to Seek Medical Care:
• 🚨 CALL EMERGENCY SERVICES (108 / 112 / 911) IMMEDIATELY if you feel chest pressure, tightness, or pain radiating to your arm, neck, or jaw.
• Seek emergency care if palpitations are accompanied by shortness of breath, dizziness, sweating, or fainting.`,
          possibleExplanations: ["Anxiety or stress", "Caffeine or stimulant intake", "Dehydration or arrhythmia"],
          whatUserCanDo: ["Sit down and rest.", "Practice slow deep breathing.", "Drink cool water."],
          whenToSeekHelp: ["Chest pain or pressure radiating to arm/jaw.", "Shortness of breath or fainting."]
        }
      },

      blood_pressure: {
        en: {
          summary: "Blood pressure fluctuates with stress, salt intake, dehydration, or medication timing.",
          formattedResponse: `Possible Causes:
• Stress or anxiety, excessive salt, missed medication, physical exhaustion, or dehydration.

Safe Next Steps & Medicine Guidance:
• Sit quietly in a supportive chair with your feet flat on the floor for 5–10 minutes, relax, and recheck your reading.
• Drink plain water and avoid salty foods, caffeine, and tobacco.
• If prescribed blood pressure medication by your doctor, ensure you take it consistently on schedule.

⚠️ When to Seek Medical Care:
• Go to the nearest emergency room if blood pressure reading is over 180/120 mmHg (Hypertensive Crisis).
• Seek urgent care if high blood pressure is accompanied by severe headache, chest pain, vision changes, or shortness of breath.`,
          possibleExplanations: ["Stress or anxiety", "High sodium diet", "Missed medication"],
          whatUserCanDo: ["Rest quietly for 5-10 minutes and recheck.", "Drink water.", "Take prescribed medications on time."],
          whenToSeekHelp: ["Blood pressure above 180/120 mmHg.", "Accompanied by severe headache or chest pain."]
        }
      },

      diabetes: {
        en: {
          summary: "Blood sugar shifts relate to meal composition, physical activity, and medication timing.",
          formattedResponse: `Possible Causes:
• Skipping meals, high-carbohydrate meals, dehydration, physical exertion, or insulin/medication adjustments.

Safe Next Steps & Medicine Guidance:
• For LOW blood sugar (< 70 mg/dL): Immediately consume 15g of fast-acting carbohydrates (half cup fruit juice or 3-4 glucose sweets) and recheck in 15 minutes.
• For HIGH blood sugar: Drink plenty of plain water to stay hydrated and avoid sugary drinks or refined carbs.
• Follow your prescribed insulin or oral medication plan (like Metformin) as directed by your physician.

⚠️ When to Seek Medical Care:
• Seek emergency care if blood sugar remains below 70 mg/dL despite treatment, or if you feel faint, disoriented, or shaky.
• Contact a doctor promptly if blood sugar is persistently above 250 mg/dL with nausea, vomiting, or confusion.`,
          possibleExplanations: ["Delayed or irregular meals", "High carbohydrate intake", "Medication dosage timing"],
          whatUserCanDo: ["Treat low sugar with 15g fast sugar.", "Hydrate well with water.", "Take prescribed medicines."],
          whenToSeekHelp: ["Severe low blood sugar under 55 mg/dL.", "High sugar with confusion or vomiting."]
        }
      },

      musculoskeletal: {
        en: {
          summary: "Body and back aches are commonly caused by muscle strain, poor posture, or fatigue.",
          formattedResponse: `Possible Causes:
• Muscle strain, awkward posture, prolonged sitting, heavy lifting, or mild ligament sprain.

Safe Next Steps & Medicine Guidance:
• Rest the affected area and avoid heavy lifting or sudden twisting movements.
• Apply an ice pack wrapped in a cloth for 15 minutes to reduce acute swelling, or use a warm compress for muscle stiffness.
• Gentle walking and light stretching can prevent muscle tightness.
• Over-the-counter paracetamol (500 mg) or topical pain relief gels can help ease mild discomfort.

⚠️ When to Seek Medical Care:
• Consult a doctor if back or neck pain is accompanied by numbness, tingling, or weakness in your arms or legs.
• Seek emergency evaluation if accompanied by loss of bladder or bowel control, or if pain resulted from high-impact trauma.`,
          possibleExplanations: ["Muscle strain or overuse", "Poor posture or prolonged sitting", "Mild ligament sprain"],
          whatUserCanDo: ["Rest and avoid heavy lifting.", "Use ice for swelling or heat for stiffness.", "Apply topical pain relief gel."],
          whenToSeekHelp: ["Numbness or weakness in legs/arms.", "Loss of bladder or bowel control.", "Pain following major injury."]
        }
      },

      nausea_diarrhea: {
        en: {
          summary: "Gastrointestinal upset is usually caused by viral gastroenteritis or dietary irritation.",
          formattedResponse: `Possible Causes:
• Viral gastroenteritis (stomach bug), food intolerance, mild food contamination, or indigestion.

Safe Next Steps & Medicine Guidance:
• Sip Oral Rehydration Solution (ORS), electrolyte water, or coconut water in small, frequent sips to prevent dehydration.
• Follow the BRAT diet (Bananas, Rice, Applesauce, Toast) once nausea subsides; avoid dairy, greasy, and spicy meals.
• Rest and avoid solid foods while active vomiting occurs.

⚠️ When to Seek Medical Care:
• Seek immediate medical attention if you cannot keep fluids down for 24 hours, or notice signs of severe dehydration (dark urine, dizziness, extreme dry mouth).
• See a doctor urgently if you experience high fever, severe abdominal cramping, or blood in your vomit or stool.`,
          possibleExplanations: ["Viral stomach bug", "Food contamination or intolerance", "Mild indigestion"],
          whatUserCanDo: ["Sip ORS or electrolyte fluids frequently.", "Eat bland foods like rice and bananas.", "Rest your stomach."],
          whenToSeekHelp: ["Unable to retain fluids for 24 hours.", "Severe dehydration symptoms.", "Blood in stool or vomit."]
        }
      },

      dizziness: {
        en: {
          summary: "Dizziness is often triggered by sudden standing, dehydration, or inner ear changes.",
          formattedResponse: `Possible Causes:
• Postural blood pressure drop (orthostatic hypotension), dehydration, missed meals, or inner ear disturbance (vertigo).

Safe Next Steps & Medicine Guidance:
• Sit or lie down flat immediately to prevent accidental falls; raise your legs slightly if feeling faint.
• Drink 1–2 glasses of water and rest quietly until the spinning sensation clears.
• When getting up from bed or a chair, stand up very slowly and pause for a moment.

⚠️ When to Seek Medical Care:
• 🚨 Seek emergency care immediately if dizziness occurs with facial drooping, weakness on one side of the body, slurred speech, or chest pain (signs of stroke or cardiac event).
• Consult a doctor if dizzy spells recur frequently or are accompanied by hearing loss or ringing in the ears.`,
          possibleExplanations: ["Sudden postural shift", "Dehydration or skipped meals", "Inner ear imbalance (vertigo)"],
          whatUserCanDo: ["Sit or lie down immediately.", "Drink water.", "Stand up slowly."],
          whenToSeekHelp: ["One-sided weakness or slurred speech.", "Chest pain or loss of consciousness."]
        }
      },

      dermatology: {
        en: {
          summary: "Skin rashes and itching typically stem from mild contact allergies, bites, or dry skin.",
          formattedResponse: `Possible Causes:
• Contact dermatitis (soaps/plants/cosmetics), mild allergic reaction (hives), insect bite, heat rash, or dry skin.

Safe Next Steps & Medicine Guidance:
• Gently wash the skin with cool water and mild fragrance-free soap; do not scratch or rub the area.
• Apply a cool damp compress or calamine lotion to soothe localized itching and redness.
• An over-the-counter non-drowsy antihistamine (such as cetirizine 10 mg) can help control allergic itching.

⚠️ When to Seek Medical Care:
• 🚨 CALL EMERGENCY SERVICES IMMEDIATELY if the rash is accompanied by swelling of the face, lips, tongue, or throat, or difficulty breathing (anaphylaxis).
• Consult a physician if the rash spreads rapidly, becomes painful, or develops blisters or signs of infection (pus, warmth).`,
          possibleExplanations: ["Contact dermatitis", "Allergic hives", "Insect bite or heat irritation"],
          whatUserCanDo: ["Wash with cool water.", "Apply calamine lotion or cool compress.", "Consider OTC cetirizine for itch."],
          whenToSeekHelp: ["Swelling of lips, tongue, or breathing trouble.", "Rapidly spreading painful rash."]
        }
      },

      sleep_fatigue: {
        en: {
          summary: "Fatigue and sleep issues are usually linked to stress, screen habits, or lifestyle rhythm.",
          formattedResponse: `Possible Causes:
• High stress, evening screen exposure (blue light), irregular sleep schedule, late caffeine consumption, or mild anemia.

Safe Next Steps & Medicine Guidance:
• Maintain a consistent sleep schedule by going to bed and waking up at the exact same time every day.
• Turn off mobile phones, tablets, and computers at least 45 minutes before bedtime.
• Keep your bedroom dark, quiet, and pleasantly cool.
• Avoid caffeine, heavy meals, and vigorous workouts within 4–6 hours of sleeping.

⚠️ When to Seek Medical Care:
• Consult a healthcare provider if severe fatigue persists for more than 2–3 weeks despite adequate sleep.
• Seek clinical review if fatigue is accompanied by unintended weight loss, chronic fever, or excessive daytime sleepiness while driving.`,
          possibleExplanations: ["Stress or lifestyle fatigue", "Late screen time / blue light", "Caffeine late in the day"],
          whatUserCanDo: ["Keep consistent sleep hours.", "Turn off screens 45 mins before bed.", "Avoid evening caffeine."],
          whenToSeekHelp: ["Chronic fatigue lasting weeks.", "Accompanied by shortness of breath or weight loss."]
        }
      },

      first_aid: {
        en: {
          summary: "First aid guidance for minor accidental cuts, burns, or joint sprains.",
          formattedResponse: `Possible Causes:
• Everyday minor household or physical activity injuries.

Safe Next Steps & Medicine Guidance:
• For Minor Cuts: Wash gently under running tap water, apply firm direct pressure with a clean cloth until bleeding stops, and cover with a sterile adhesive bandage.
• For Minor Burns: Hold the burn under cool (not ice-cold) running tap water for 10–15 minutes, apply pure aloe vera or antiseptic burn cream, and do not pop blisters.
• For Sprains: Use the R.I.C.E protocol — Rest the joint, Ice for 15 minutes, Compress lightly with an elastic bandage, and Elevate above heart level.

⚠️ When to Seek Medical Care:
• Seek medical care if a cut is deep, gaping, or will not stop bleeding after 10 minutes of direct pressure (may need stitches).
• Consult a doctor if you haven't had a tetanus booster within 10 years, or if an injury shows signs of infection (redness, throbbing, pus).`,
          possibleExplanations: ["Accidental cuts, scrapes, burns, or sprains."],
          whatUserCanDo: ["Wash cuts with water and bandage.", "Cool burns with tap water.", "Use R.I.C.E. for sprains."],
          whenToSeekHelp: ["Deep wound requiring stitches.", "Bleeding won't stop after 10 mins.", "Signs of wound infection."]
        }
      },

      medical_term: {
        en: {
          summary: `Clear, patient-friendly explanation of clinical terminology.`,
          formattedResponse: `Medical Terminology Explanation:
• Hemoglobin (Hb): A vital iron-containing protein in red blood cells that carries oxygen from your lungs to the rest of your body. Normal range: 13.5–17.5 g/dL (men), 12.0–15.5 g/dL (women).
• Blood Glucose: The amount of sugar in your bloodstream providing fuel for cells. Normal fasting: 70–99 mg/dL.
• Cholesterol: A waxy lipid essential for cell membranes. Total cholesterol is ideally under 200 mg/dL.
• Platelets: Blood cell fragments essential for forming clots to prevent bleeding. Normal: 150,000–450,000 /mcL.

Safe Next Steps:
• Review your laboratory report numbers alongside your doctor's clinical interpretation.
• Maintain a balanced diet rich in leafy greens, protein, and adequate hydration to support healthy blood metrics.

⚠️ When to Seek Medical Care:
• Always discuss abnormal laboratory test indicators directly with your ordering clinician.`,
          possibleExplanations: ["Standard clinical diagnostic indicator definitions."],
          whatUserCanDo: ["Review official lab report.", "Maintain balanced nutrition."],
          whenToSeekHelp: ["Discuss abnormal values with your physician."]
        }
      },

      medication_guidance: {
        en: {
          summary: "General safe over-the-counter medication guidance and best practices.",
          formattedResponse: `Safe Medication Best Practices:
• Paracetamol / Acetaminophen: Commonly used for fever and mild-to-moderate pain. Standard adult dose is 500 mg with water; do not exceed 3,000 mg in 24 hours.
• Ibuprofen: Non-steroidal anti-inflammatory (NSAID) for swelling and aches. Always take with food or milk to protect stomach lining.
• Antacids: Neutralize excess stomach acid for heartburn and indigestion. Take 1 hour after meals.
• Antibiotics: Never take leftover antibiotics without a doctor's prescription, and always finish the complete course.

Safe Next Steps:
• Read the packaging label for exact dosage instructions and check expiration dates.
• Drink a full glass of water with each tablet and avoid alcohol when taking medications.

⚠️ When to Seek Medical Care:
• Seek immediate medical attention if you develop facial swelling, hives, or breathing trouble after taking any medicine (allergic reaction).`,
          possibleExplanations: ["General pharmacology principles and safe OTC usage."],
          whatUserCanDo: ["Always read dosage labels.", "Take NSAIDs with food.", "Stay hydrated."],
          whenToSeekHelp: ["Any sign of allergic reaction (rash, lip swelling, breathing difficulty)."]
        }
      },

      general: {
        en: {
          summary: `Educational health overview regarding your inquiry.`,
          formattedResponse: `Possible Causes:
• These symptoms are commonly influenced by everyday factors such as stress, physical fatigue, dehydration, dietary changes, or mild seasonal changes.

Safe Next Steps & Medicine Guidance:
• Ensure you drink 2–3 liters of water throughout the day to stay well hydrated.
• Get 7–8 hours of restful sleep in a dark, quiet room.
• Eat balanced, nutrient-dense meals and engage in light walking or stretching.
• Keep a simple log of when symptoms occur to share with your healthcare provider.

⚠️ When to Seek Medical Care:
• Consult a certified physician if symptoms persist, worsen, or interfere with your daily routine.
• Seek immediate medical attention if you experience red flag symptoms such as severe pain, breathing difficulty, or sudden weakness.`,
          possibleExplanations: ["Everyday lifestyle factors, fatigue, or stress."],
          whatUserCanDo: ["Stay hydrated with water.", "Get 7-8 hours of sleep.", "Eat balanced meals."],
          whenToSeekHelp: ["Symptoms persist or worsen.", "Any acute or severe symptoms develop."]
        }
      }
    };

    const topicData = knowledgeBase[topic] || knowledgeBase.general;
    const langData = topicData[language] || topicData.en || knowledgeBase.general.en;

    return {
      summary: langData.summary,
      formattedResponse: langData.formattedResponse,
      possibleExplanations: langData.possibleExplanations || [],
      whatUserCanDo: langData.whatUserCanDo || [],
      whenToSeekHelp: langData.whenToSeekHelp || [],
      disclaimer: "VitaCare AI Copilot provides educational guidance and is not a substitute for professional medical care."
    };
  }

  /**
   * Gemini API Integration Layer
   */
  async callGemini(message, language, moduleType, healthContext, customKey = null) {
    const key = customKey || this.geminiKey;
    if (!key) throw new Error('No Gemini API Key provided.');

    const prompt = `You are VitaCare AI Assistant, an empathetic, certified clinical health guidance assistant.
CRITICAL FORMAT & SAFETY RULES:
- Provide SHORT, SIMPLE, PATIENT-FRIENDLY answers. Keep responses concise, clear, and easy to understand.
- Do NOT give long explanations, dense medical textbooks, or unnecessary medical information.
- Structure every response into 3 simple sections:
  1. Possible Causes: (1-2 simple sentences explaining likely common causes)
  2. Safe Next Steps & Medicine Guidance: (3-4 concise bullet points with safe home care or general over-the-counter medicine guidance)
  3. ⚠️ When to Seek Medical Care: (clear, concise lines on when to see a doctor or seek emergency care)
- Output pure JSON only with keys: "summary", "formattedResponse", "possibleExplanations" (array), "whatUserCanDo" (array), "whenToSeekHelp" (array), "disclaimer".
- Target Language: ${language === 'ta' ? 'Tamil' : language === 'te' ? 'Telugu' : language === 'hi' ? 'Hindi' : 'English'}.
- User context: ${JSON.stringify(healthContext)}
- User query: "${message}"`;

    const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash'];
    let lastError = null;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`Gemini ${model} HTTP ${response.status}: ${errBody}`);
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          let cleaned = rawText.trim();
          if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
          } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }

          let parsed;
          try {
            parsed = JSON.parse(cleaned);
          } catch (e) {
            return {
              isEmergency: false,
              reply: rawText,
              data: { summary: rawText, formattedResponse: rawText }
            };
          }

          return {
            isEmergency: false,
            reply: parsed.formattedResponse || parsed.summary || rawText,
            data: parsed
          };
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('All Gemini models failed.');
  }

  /**
   * OpenAI API Integration Layer
   */
  async callOpenAI(message, language, moduleType, healthContext, customKey = null) {
    const key = customKey || this.openaiKey;
    if (!key) throw new Error('No OpenAI API Key provided.');

    const prompt = `You are VitaCare AI Assistant, an empathetic, certified clinical health guidance assistant.
CRITICAL FORMAT & SAFETY RULES:
- Provide SHORT, SIMPLE, PATIENT-FRIENDLY answers. Keep responses concise, clear, and easy to understand.
- Do NOT give long explanations or unnecessary medical information.
- Structure every response into 3 simple sections:
  1. Possible Causes: (1-2 simple sentences)
  2. Safe Next Steps & Medicine Guidance: (3-4 concise bullet points)
  3. ⚠️ When to Seek Medical Care: (clear advice on serious symptoms)
- Provide structured JSON with keys: "summary", "formattedResponse", "possibleExplanations" (array), "whatUserCanDo" (array), "whenToSeekHelp" (array), "disclaimer".
- Language: ${language}.
- User query: "${message}"`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        isEmergency: false,
        reply: parsed.formattedResponse || parsed.summary,
        data: parsed
      };
    }
    return null;
  }
}

export const aiService = new AIService();
