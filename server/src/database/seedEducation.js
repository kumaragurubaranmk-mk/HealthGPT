import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export function seedInitialContent(db) {
  // 1. Ensure default administrator account exists
  const existingAdmin = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin');
  if (!existingAdmin) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('Admin@HealthGPT2026!', salt);
    db.prepare(`
      INSERT INTO admin_users (id, username, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      'admin',
      'admin@healthgpt.local',
      passwordHash,
      'superadmin'
    );
    console.log('[Seed] Created default administrator: admin@healthgpt.local / Admin@HealthGPT2026!');
  }

  // 2. Seed initial Education Library (Educational Content ONLY - Zero Patient Records)
  const articleCount = db.prepare('SELECT COUNT(*) as count FROM education_content').get();
  if (articleCount.count === 0) {
    const articles = [
      {
        title: 'Understanding Blood Pressure: The Silent Numbers Explained',
        slug: 'understanding-blood-pressure',
        category: 'preventive',
        summary: 'Learn what systolic and diastolic measurements indicate, normal ranges, and lifestyle habits that promote cardiovascular health.',
        content: `### What Is Blood Pressure?
Blood pressure is the measurement of the force that your blood exerts against the walls of your blood vessels as your heart pumps it around your body.

### Understanding the Two Numbers
- **Systolic (Top number):** Measures pressure in your arteries when your heart beats.
- **Diastolic (Bottom number):** Measures pressure in your arteries between heartbeats when your muscle rests.

### Clinical Categories
1. **Normal:** Less than 120/80 mmHg.
2. **Elevated:** Systolic 120–129 and diastolic < 80.
3. **Stage 1 Hypertension:** Systolic 130–139 or diastolic 80–89.
4. **Stage 2 Hypertension:** Systolic 140 or higher, or diastolic 90 or higher.
5. **Hypertensive Crisis:** Higher than 180 and/or higher than 120. Requires immediate emergency care!

### Preventive Daily Habits
- Lower dietary sodium intake (< 2,300 mg daily).
- Engage in at least 150 minutes of moderate cardiovascular activity weekly.
- Prioritize restorative sleep (7–9 hours).
- Limit stress through mindful breathing and routine breaks.

*Disclaimer: This guide is educational and does not constitute individual medical diagnosis or therapy.*`,
        read_time: 6,
        tags: 'cardiology,vitals,prevention,hypertension'
      },
      {
        title: 'Hydration and Cellular Vitality: How Much Water Do You Truly Need?',
        slug: 'hydration-and-cellular-vitality',
        category: 'nutrition',
        summary: 'Demystifying the 8-glasses-a-day rule, dehydration indicators, electrolyte balance, and optimal daily hydration strategies.',
        content: `### Why Water Matters
Every organ, cell, and tissue in the human body requires adequate hydration to function. Water regulates body temperature, lubricates joints, prevents infections, delivers nutrients to cells, and keeps organs functioning properly.

### How Much Water Is Right?
While the common recommendation is 8 cups (about 2 liters) per day, actual fluid requirements depend on:
- **Physical Activity:** Intense sweating requires extra replenishment.
- **Environment:** Hot or humid climates increase perspiration.
- **Overall Health:** Fever, vomiting, or diarrhea increase fluid loss.

### Signs of Dehydration
- Dry mouth and chapped lips
- Dark amber or honey-colored urine
- Fatigue, lightheadedness, or afternoon brain fog
- Muscle cramps

*Tip: Eat hydrating foods like cucumbers, watermelon, oranges, and celery alongside your regular water intake.*`,
        read_time: 4,
        tags: 'nutrition,hydration,wellness,lifestyle'
      },
      {
        title: 'The Science of Deep Sleep: Sleep Cycles, REM, and Circadian Rhythms',
        slug: 'science-of-deep-sleep',
        category: 'sleep',
        summary: 'Explore how slow-wave deep sleep repairs tissues, balances hormones, strengthens immunity, and consolidates memory.',
        content: `### Sleep Architecture
A restful night consists of four to six 90-minute sleep cycles alternating between Non-Rapid Eye Movement (NREM) and Rapid Eye Movement (REM).

### Deep Sleep (Stage 3 NREM)
- Blood pressure drops, breathing slows, muscles relax.
- Growth hormone is released, rebuilding muscular and cellular tissue.
- The glymphatic system clears metabolic waste from the brain.

### Sleep Hygiene Checklist
1. Maintain consistent sleep and wake times, even on weekends.
2. Keep the bedroom cool (around 18-20°C / 65-68°F), dark, and quiet.
3. Avoid caffeine at least 6 hours before bedtime.
4. Limit bright blue light screens 60 minutes before sleeping.`,
        read_time: 5,
        tags: 'sleep,recovery,circadian,brain-health'
      },
      {
        title: 'First-Aid Fundamentals: Emergency Response & CPR Protocol',
        slug: 'first-aid-fundamentals-cpr',
        category: 'first_aid',
        summary: 'Essential, life-saving knowledge on recognizing cardiac arrest, performing hands-only CPR, and treating burns, choking, and cuts.',
        content: `### Life-Saving Emergency Protocol
When encountering an unconscious or unresponsive individual:
1. **Check the Scene:** Ensure it is safe for you to approach.
2. **Check Responsiveness:** Tap their shoulder firmly and shout, "Are you okay?"
3. **Call Emergency Services Immediately:** In India dial **112 / 108**, in the US dial **911**, in the UK dial **999**.
4. **Hands-Only CPR (For Adults):**
   - Place hands in center of chest.
   - Push hard and fast at 100-120 beats per minute (to the rhythm of "Stayin' Alive").
   - Allow chest to fully recoil between compressions.

### Choking: The Heimlich Maneuver
For conscious adults who cannot speak, breathe, or cough:
- Deliver 5 back blows between shoulder blades.
- Stand behind them, place a fist above the navel, and deliver 5 upward abdominal thrusts.

*Important: Always seek formal certified training through the Red Cross or St. John Ambulance.*`,
        read_time: 7,
        tags: 'first-aid,emergency,cpr,safety'
      },
      {
        title: 'Recognizing Early Warning Signs: When to Visit Urgent Care vs Emergency Room',
        slug: 'urgent-care-vs-emergency-room',
        category: 'symptoms',
        summary: 'Clear clinical guidelines on identifying emergency red flags that require immediate 911/112 response versus walk-in clinic care.',
        content: `### Emergency Room (ER) / Call 108/112/911 Immediately:
- **Chest Pain or Pressure:** Especially radiating to jaw, neck, left arm, or back with shortness of breath.
- **Sudden Weakness / Numbness (FAST rule):** Face drooping, Arm weakness, Speech difficulty -> Stroke warning!
- **Severe Shortness of Breath:** Inability to speak in full sentences.
- **Severe Head Trauma or Uncontrolled Bleeding:** Loss of consciousness.
- **Sudden Severe Allergic Reaction (Anaphylaxis):** Throat tightness, lip swelling.

### Urgent Care / Clinic (Same-day Care):
- Minor cuts needing stitches.
- Sprains, minor fractures in fingers/toes.
- Moderate fever with cough, earache, or sore throat.
- Mild asthma flare-ups responding partially to inhaler.
- Minor burns or localized rashes without systemic symptoms.`,
        read_time: 5,
        tags: 'triage,emergency,symptoms,urgent-care'
      },
      {
        title: 'Medication Safety & Adherence: Avoiding Adverse Drug Interactions',
        slug: 'medication-safety-adherence',
        category: 'medications',
        summary: 'A patient guide to reading prescription labels, storing pills safely, managing missed doses, and discussing potential drug interactions.',
        content: `### Golden Rules of Prescription Safety
1. **Never Adjust Dosages Independently:** Always consult your prescribing doctor or pharmacist before changing or stopping medications.
2. **Beware of Food & Herb Interactions:** For example, grapefruit juice can drastically affect statins and blood pressure medications; St. John's Wort can interact with antidepressants.
3. **Store at Proper Temperature:** Most pills should be stored in a cool, dry place away from bathroom humidity. Refrigerate only when explicitly labeled.
4. **What to Do If You Miss a Dose:** Take it as soon as you remember, unless it is almost time for your next scheduled dose. Never double up doses!`,
        read_time: 6,
        tags: 'medications,prescriptions,safety,pharmacology'
      }
    ];

    const insertArticle = db.prepare(`
      INSERT INTO education_content (id, title, slug, category, summary, content, read_time, author, tags, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    for (const art of articles) {
      insertArticle.run(uuidv4(), art.title, art.slug, art.category, art.summary, art.content, art.read_time, 'HealthGPT Clinical Editorial', art.tags);
    }
    console.log(`[Seed] Seeded ${articles.length} educational articles.`);
  }

  // 3. Seed Medical Dictionary (Layperson terms)
  const dictCount = db.prepare('SELECT COUNT(*) as count FROM medical_dictionary').get();
  if (dictCount.count === 0) {
    const terms = [
      {
        term: 'Arrhythmia',
        pronunciation: 'uh-RITH-mee-uh',
        simple_definition: 'An irregular or abnormal heartbeat, where the heart beats too fast (tachycardia), too slow (bradycardia), or with an erratic rhythm.',
        clinical_context: 'Often evaluated with an Electrocardiogram (ECG/EKG) and Holter monitoring.',
        related_terms: 'Tachycardia, Bradycardia, Atrial Fibrillation, Palpitations'
      },
      {
        term: 'Hypertension',
        pronunciation: 'hye-per-TEN-shun',
        simple_definition: 'High blood pressure, occurring when the long-term force of blood against artery walls is consistently elevated.',
        clinical_context: 'Commonly called the silent killer because it often exhibits no symptoms until complications arise.',
        related_terms: 'Systolic, Diastolic, Hypotension, Atherosclerosis'
      },
      {
        term: 'Tachycardia',
        pronunciation: 'tak-ih-KAHR-dee-uh',
        simple_definition: 'A resting heart rate that exceeds 100 beats per minute in adults.',
        clinical_context: 'Can be triggered by stress, fever, dehydration, caffeine, or underlying cardiac conditions.',
        related_terms: 'Bradycardia, Arrhythmia, Palpitation'
      },
      {
        term: 'Glycemia',
        pronunciation: 'glye-SEE-mee-uh',
        simple_definition: 'The concentration of glucose (sugar) present in the bloodstream.',
        clinical_context: 'Measured as Fasting Blood Sugar (FBS), Postprandial (PPBS), or HbA1c representing a 3-month average.',
        related_terms: 'Hypoglycemia, Hyperglycemia, Diabetes, Insulin'
      },
      {
        term: 'Anaphylaxis',
        pronunciation: 'an-uh-fuh-LAK-sis',
        simple_definition: 'A severe, rapid-onset, life-threatening allergic reaction causing airway constriction, facial swelling, and a sudden drop in blood pressure.',
        clinical_context: 'Treated immediately with intramuscular Epinephrine (EpiPen) and emergency department admission.',
        related_terms: 'Allergy, Epinephrine, Angioedema, Hives'
      },
      {
        term: 'Gastroenteritis',
        pronunciation: 'gas-troh-en-ter-EYE-tis',
        simple_definition: 'Inflammation of the stomach and intestines, commonly called stomach flu, causing vomiting, diarrhea, and cramps.',
        clinical_context: 'Main concern in mild cases is maintaining oral hydration with electrolytes.',
        related_terms: 'Gastritis, Dehydration, Electrolyte, Enteric'
      },
      {
        term: 'Dyspnea',
        pronunciation: 'disp-NEE-uh',
        simple_definition: 'Difficult, laboured, or uncomfortable breathing; shortness of breath.',
        clinical_context: 'Can arise from pulmonary, cardiac, or anxiety-related causes; sudden onset requires urgent evaluation.',
        related_terms: 'Hypoxia, Tachypnea, Bronchospasm, Asthma'
      },
      {
        term: 'Syncope',
        pronunciation: 'SING-kuh-pee',
        simple_definition: 'A temporary loss of consciousness usually caused by a transient decrease in blood flow to the brain; fainting.',
        clinical_context: 'Can be vasovagal, orthostatic, or cardiac in origin.',
        related_terms: 'Presyncope, Hypotension, Vertigo, Dizziness'
      }
    ];

    const insertDict = db.prepare(`
      INSERT INTO medical_dictionary (id, term, pronunciation, simple_definition, clinical_context, related_terms)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const item of terms) {
      insertDict.run(uuidv4(), item.term, item.pronunciation, item.simple_definition, item.clinical_context, item.related_terms);
    }
    console.log(`[Seed] Seeded ${terms.length} medical dictionary definitions.`);
  }

  // 4. Default System Settings
  const settingCheck = db.prepare('SELECT COUNT(*) as count FROM system_settings').get();
  if (settingCheck.count === 0) {
    const insertSetting = db.prepare('INSERT INTO system_settings (id, key, value) VALUES (?, ?, ?)');
    insertSetting.run(uuidv4(), 'ai_provider', 'builtin');
    insertSetting.run(uuidv4(), 'ai_temperature', '0.3');
    insertSetting.run(uuidv4(), 'emergency_hotline_in', '108 / 112');
    insertSetting.run(uuidv4(), 'emergency_hotline_us', '911');
    insertSetting.run(uuidv4(), 'demo_mode_allowed', 'true');
    insertSetting.run(uuidv4(), 'maintenance_mode', 'false');
  }
}
