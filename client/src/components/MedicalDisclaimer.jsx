import React from 'react';
import { Info } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function MedicalDisclaimer({ compact = false }) {
  const { t } = useLanguage();

  return (
    <div
      className="disclaimer-banner"
      style={{
        padding: compact ? '0.65rem 0.85rem' : '0.85rem 1.25rem',
        fontSize: compact ? '0.8rem' : '0.875rem'
      }}
    >
      <Info size={compact ? 16 : 20} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
      <span>{t.disclaimer}</span>
    </div>
  );
}
