import React from 'react';
import { PillConsumptionTrackerModal } from './PillConsumptionTrackerModal';

export function VideoVerificationModal({ isOpen, onClose, reminder, onVerificationComplete }) {
  return (
    <PillConsumptionTrackerModal
      isOpen={isOpen}
      onClose={onClose}
      reminder={reminder}
      onVerificationComplete={onVerificationComplete}
    />
  );
}
