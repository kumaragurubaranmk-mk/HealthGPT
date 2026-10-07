/**
 * Advanced Pill Intake Computer Vision Detection Engine
 * 
 * Implements multi-frame temporal landmark analysis:
 * 1. Head/Face localization & target mouth zone estimation
 * 2. Left & Right hand tracking with dynamic hand selection
 * 3. Distance normalization relative to facial dimensions
 * 4. Temporal movement sequence analysis:
 *    HAND_FAR -> APPROACHING_MOUTH -> MOUTH_HOLD -> RETREATING_AWAY -> CONSUMPTION_CANDIDATE
 * 5. Robust false-positive rejection:
 *    - Face only / Hand only
 *    - Static hand near mouth
 *    - Touching cheek / nose / forehead
 *    - Hair adjustment
 *    - Hand waving
 * 6. Environmental quality checks (Lighting & Positioning)
 */

export class PillIntakeDetector {
  constructor() {
    this.reset();
  }

  reset() {
    // Stage tracking
    // 'SEARCHING' | 'HAND_FAR' | 'APPROACHING' | 'MOUTH_HOLD' | 'RETREATING' | 'VERIFIED'
    this.stage = 'SEARCHING';
    this.prevFrameData = null;
    this.activeHand = null; // 'left' | 'right' | null
    this.initialApproachingHand = null;
    this.handHistory = []; // [ { x, y, distNorm, timestamp, handSide } ]
    this.mouthHoldStartTime = null;
    this.approachFramesCount = 0;
    this.retreatFramesCount = 0;
    this.falsePositiveDetected = null;
    this.confidenceScore = 0;
    this.sequenceStagesCompleted = new Set();
    this.lockedFaceBox = null;
  }

  /**
   * Analyze a single video frame from canvas context
   */
  processFrame(video, canvas) {
    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      return {
        quality: { ok: false, reason: 'camera_initializing' },
        stage: this.stage,
        confidence: 0
      };
    }

    const width = canvas.width;
    const height = canvas.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, width, height);

    const frameData = ctx.getImageData(0, 0, width, height);
    const data = frameData.data;

    // 1. Lighting / Luminance Quality Check
    let totalLuminance = 0;
    let pixelCount = 0;
    const skinPixels = [];

    // Grid sampling
    for (let y = 0; y < height; y += 8) {
      for (let x = 0; x < width; x += 8) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLuminance += lum;
        pixelCount++;

        // Skin Tone thresholding
        const isSkinTone = (r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) > 15 && Math.abs(r - g) < 90);
        if (isSkinTone) {
          skinPixels.push({ x, y });
        }
      }
    }

    const avgLuminance = totalLuminance / (pixelCount || 1);
    if (avgLuminance < 35) {
      return {
        quality: { ok: false, reason: 'poor_lighting', avgLuminance },
        stage: 'SEARCHING',
        confidence: 0,
        message: 'poorLighting',
        warning: true
      };
    }

    // 2. Face / Head Region Localization
    if (skinPixels.length < 30) {
      this.reset();
      return {
        quality: { ok: false, reason: 'no_patient_detected' },
        stage: 'SEARCHING',
        confidence: 0,
        message: 'detectingPatient'
      };
    }

    let minX, maxX, minY, maxY, faceW, faceH, faceCenterX, faceCenterY, mouthX, mouthY, mouthRadius, foreheadY, noseY;

    if (this.lockedFaceBox) {
      ({ minX, maxX, minY, maxY, faceW, faceH, faceCenterX, faceCenterY, mouthX, mouthY, mouthRadius, foreheadY, noseY } = this.lockedFaceBox);
    } else {
      // Find bounding box for upper body / face pixels
      const upperSkin = skinPixels.filter(p => p.y < height * 0.68 && p.x > width * 0.15 && p.x < width * 0.85);
      if (upperSkin.length < 20) {
        return {
          quality: { ok: false, reason: 'positioning_off' },
          stage: 'SEARCHING',
          confidence: 0,
          message: 'positionFaceAndHands',
          warning: true
        };
      }

      minX = width; maxX = 0; minY = height; maxY = 0;
      for (const p of upperSkin) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }

      faceW = maxX - minX;
      faceH = maxY - minY;
      faceCenterX = minX + faceW / 2;
      faceCenterY = minY + faceH / 2;

      // Check camera positioning (must be reasonably centered and sized)
      if (faceCenterX < width * 0.20 || faceCenterX > width * 0.80 || faceW < width * 0.16) {
        return {
          quality: { ok: false, reason: 'positioning_off' },
          stage: 'SEARCHING',
          confidence: 0,
          message: 'positionFaceAndHands',
          warning: true
        };
      }

      mouthX = faceCenterX;
      mouthY = minY + faceH * 0.74;
      mouthRadius = Math.max(22, faceH * 0.20);
      foreheadY = minY + faceH * 0.22;
      noseY = minY + faceH * 0.52;

      // Lock when cleanly detected without large peripheral occlusions
      const peripheralSkin = skinPixels.filter(p => p.x < minX - 10 || p.x > maxX + 10 || p.y > maxY + 15);
      if (peripheralSkin.length < 15) {
        this.lockedFaceBox = { minX, maxX, minY, maxY, faceW, faceH, faceCenterX, faceCenterY, mouthX, mouthY, mouthRadius, foreheadY, noseY };
      }
    }

    // 3. Hand Detection
    // Strict separation: hand pixels are outside face box or contiguous with wrist reaching mouth
    const hasWristBelowChin = skinPixels.some(k => k.y > maxY && Math.abs(k.x - mouthX) < 45);

    const handCandidates = skinPixels.filter(p => {
      if (p.x < minX || p.x > maxX || p.y > maxY || p.y < minY) return true;
      if (hasWristBelowChin && p.y >= mouthY - 15 && Math.abs(p.x - mouthX) < 35) return true;
      return false;
    });

    if (handCandidates.length < 8) {
      this.sequenceStagesCompleted.add('face_detected');
      return {
        quality: { ok: true },
        face: { x: minX, y: minY, w: faceW, h: faceH },
        mouth: { x: mouthX, y: mouthY, radius: mouthRadius },
        stage: 'WAITING_FOR_HAND',
        confidence: 0.15,
        message: 'patientAligned',
        activeHand: null,
        isCandidate: false
      };
    }

    // Determine hand side (Left Hand vs Right Hand)
    const leftPixels = handCandidates.filter(p => p.x < mouthX - 15);
    const rightPixels = handCandidates.filter(p => p.x > mouthX + 15);

    let activeHandSide = 'right';
    let activeCluster = rightPixels;

    if (leftPixels.length > rightPixels.length + 5) {
      activeHandSide = 'left';
      activeCluster = leftPixels;
    } else if (rightPixels.length >= leftPixels.length) {
      activeHandSide = 'right';
      activeCluster = rightPixels.length > 0 ? rightPixels : handCandidates;
    } else {
      activeHandSide = this.activeHand || 'right';
      activeCluster = handCandidates;
    }

    this.activeHand = activeHandSide;

    let hSumX = 0, hSumY = 0;
    let minHandDist = Infinity;
    let bestHandPoint = activeCluster[0] || { x: mouthX, y: mouthY };

    for (const p of activeCluster) {
      hSumX += p.x;
      hSumY += p.y;
      const d = Math.sqrt((p.x - mouthX) ** 2 + (p.y - mouthY) ** 2);
      if (d < minHandDist) {
        minHandDist = d;
        bestHandPoint = p;
      }
    }

    // Weighted leading edge: 70% leading edge closest to mouth, 30% cluster centroid
    const handX = bestHandPoint.x * 0.70 + (hSumX / activeCluster.length) * 0.30;
    const handY = bestHandPoint.y * 0.70 + (hSumY / activeCluster.length) * 0.30;

    // 4. Normalized Distance to Mouth:
    const distPixels = Math.sqrt((handX - mouthX) ** 2 + (handY - mouthY) ** 2);
    const distNorm = distPixels / faceH;

    const now = Date.now();
    this.handHistory.push({
      x: handX,
      y: handY,
      distNorm,
      timestamp: now,
      handSide: activeHandSide
    });

    if (this.handHistory.length > 40) {
      this.handHistory.shift();
    }

    // 5. False Positive Guard Checks
    // Check 5a: Touching Forehead or Hair Adjustment (TEST 7)
    if (handY < foreheadY) {
      this.falsePositiveDetected = 'hair_adjustment';
      return {
        quality: { ok: true },
        face: { x: minX, y: minY, w: faceW, h: faceH },
        mouth: { x: mouthX, y: mouthY, radius: mouthRadius },
        hand: { x: handX, y: handY, side: activeHandSide, distNorm },
        stage: 'REJECTED_HAIR_TOUCH',
        confidence: 0,
        message: 'hairAdjustmentDetected',
        warning: true,
        isCandidate: false
      };
    }

    // Check 5b: Touching Nose or Cheeks without Mouth Intake (TEST 6)
    if (handY >= foreheadY && handY <= noseY && Math.abs(handX - mouthX) < faceW * 0.75) {
      this.falsePositiveDetected = 'touching_face';
      return {
        quality: { ok: true },
        face: { x: minX, y: minY, w: faceW, h: faceH },
        mouth: { x: mouthX, y: mouthY, radius: mouthRadius },
        hand: { x: handX, y: handY, side: activeHandSide, distNorm },
        stage: 'REJECTED_FACE_TOUCH',
        confidence: 0,
        message: 'faceTouchDetected',
        warning: true,
        isCandidate: false
      };
    }

    // Check 5c: Hand Waving (horizontal motion at a distance without approaching mouth) (TEST 8)
    // Only check if mouth hold has NOT been achieved yet
    if (!this.sequenceStagesCompleted.has('mouth_hold') && this.handHistory.length >= 6) {
      const recent = this.handHistory.slice(-6);
      const minHx = Math.min(...recent.map(p => p.x));
      const maxHx = Math.max(...recent.map(p => p.x));
      const deltaX = maxHx - minHx;
      const avgDist = recent.reduce((sum, p) => sum + p.distNorm, 0) / recent.length;
      const minDist = Math.min(...recent.map(p => p.distNorm));

      if (deltaX > faceW * 0.35 && avgDist > 0.70 && minDist > 0.50) {
        return {
          quality: { ok: true },
          face: { x: minX, y: minY, w: faceW, h: faceH },
          mouth: { x: mouthX, y: mouthY, radius: mouthRadius },
          hand: { x: handX, y: handY, side: activeHandSide, distNorm },
          stage: 'REJECTED_WAVING',
          confidence: 0,
          message: 'wavingDetected',
          warning: true,
          isCandidate: false
        };
      }
    }

    // Check 5d: Hand Static Near Mouth Without Prior Approach Sequence (TEST 3)
    if (distNorm <= 0.35 && !this.sequenceStagesCompleted.has('approaching_mouth')) {
      return {
        quality: { ok: true },
        face: { x: minX, y: minY, w: faceW, h: faceH },
        mouth: { x: mouthX, y: mouthY, radius: mouthRadius },
        hand: { x: handX, y: handY, side: activeHandSide, distNorm },
        stage: 'REJECTED_STATIC_PROXIMITY',
        confidence: 0,
        message: 'staticHandNearMouth',
        warning: true,
        isCandidate: false
      };
    }

    // 6. Multi-Frame Temporal Sequence Analysis
    // Sequence Stage 1: Hand Far from Mouth (only before ingestion hold)
    if (distNorm >= 0.70 && !this.sequenceStagesCompleted.has('mouth_hold')) {
      this.sequenceStagesCompleted.add('hand_far');
      this.stage = 'HAND_FAR';
      this.approachFramesCount = 0;
      this.mouthHoldStartTime = null;
    }

    // Sequence Stage 2: Hand Moving Toward Mouth
    if (this.sequenceStagesCompleted.has('hand_far') && !this.sequenceStagesCompleted.has('mouth_hold') && distNorm < 0.70 && distNorm > 0.28) {
      if (this.handHistory.length >= 2) {
        const prevP = this.handHistory[this.handHistory.length - 2];
        const deltaDist = distNorm - prevP.distNorm;

        if (deltaDist <= 0.05) {
          this.approachFramesCount++;
          if (this.approachFramesCount >= 2) {
            this.sequenceStagesCompleted.add('approaching_mouth');
            this.stage = 'APPROACHING';
            if (!this.initialApproachingHand) {
              this.initialApproachingHand = activeHandSide;
            }
          }
        }
      }
    }

    // Sequence Stage 3: Hand Reaches/Overlaps Mouth Region (Short Hold Action)
    if (distNorm <= 0.35 && this.sequenceStagesCompleted.has('approaching_mouth')) {
      if (!this.mouthHoldStartTime) {
        this.mouthHoldStartTime = now;
      }

      const holdDurationMs = now - this.mouthHoldStartTime;
      if (holdDurationMs >= 350 && holdDurationMs <= 2500) {
        this.sequenceStagesCompleted.add('mouth_hold');
        this.stage = 'MOUTH_HOLD';
      }
    }

    // Sequence Stage 4: Hand Retreats Away from Mouth (after mouth hold has occurred!)
    if (this.sequenceStagesCompleted.has('mouth_hold') && distNorm > 0.38) {
      this.retreatFramesCount++;
      if (this.retreatFramesCount >= 1) {
        this.sequenceStagesCompleted.add('retreating_away');
        this.stage = 'RETREATING';
      }
    }

    // Sequence Stage 5: Consumption Candidate Verified
    const isFullSequenceComplete =
      this.sequenceStagesCompleted.has('hand_far') &&
      this.sequenceStagesCompleted.has('approaching_mouth') &&
      this.sequenceStagesCompleted.has('mouth_hold') &&
      this.sequenceStagesCompleted.has('retreating_away');

    if (isFullSequenceComplete) {
      this.stage = 'VERIFIED';
      this.confidenceScore = 0.94;

      return {
        quality: { ok: true },
        face: { x: minX, y: minY, w: faceW, h: faceH },
        mouth: { x: mouthX, y: mouthY, radius: mouthRadius },
        hand: { x: handX, y: handY, side: activeHandSide, distNorm },
        stage: 'VERIFIED',
        confidence: this.confidenceScore,
        message: 'consumptionDetected',
        isCandidate: true,
        sequenceData: {
          handSide: this.initialApproachingHand || activeHandSide,
          approachFrames: this.approachFramesCount,
          retreatFrames: this.retreatFramesCount,
          stages: Array.from(this.sequenceStagesCompleted)
        }
      };
    }

    // Progressive confidence
    let progressiveConfidence = 0.20;
    if (this.sequenceStagesCompleted.has('hand_far')) progressiveConfidence += 0.20;
    if (this.sequenceStagesCompleted.has('approaching_mouth')) progressiveConfidence += 0.25;
    if (this.sequenceStagesCompleted.has('mouth_hold')) progressiveConfidence += 0.20;

    let displayMessage = 'patientAligned';
    if (this.stage === 'APPROACHING') displayMessage = 'handToMouthDetected';
    else if (this.stage === 'MOUTH_HOLD') displayMessage = 'detectingIngestion';
    else if (this.stage === 'RETREATING') displayMessage = 'consumptionDetected';

    return {
      quality: { ok: true },
      face: { x: minX, y: minY, w: faceW, h: faceH },
      mouth: { x: mouthX, y: mouthY, radius: mouthRadius },
      hand: { x: handX, y: handY, side: activeHandSide, distNorm },
      stage: this.stage,
      confidence: progressiveConfidence,
      message: displayMessage,
      isCandidate: false
    };
  }
}
