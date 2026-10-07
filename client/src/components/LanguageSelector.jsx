import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export function LanguageSelector({ compact = false }) {
  const { language, changeLanguage } = useLanguage();

  const languages = [
    { code: 'en', label: 'English', native: '🇬🇧 English' },
    { code: 'ta', label: 'Tamil', native: '🇮🇳 தமிழ்' },
    { code: 'te', label: 'Telugu', native: '🇮🇳 తెలుగు' },
    { code: 'hi', label: 'Hindi', native: '🇮🇳 हिन्दी' }
  ];

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
      <Globe size={compact ? 16 : 18} style={{ color: 'var(--primary-600)' }} />
      <select
        value={language}
        onChange={(e) => changeLanguage(e.target.value)}
        style={{
          padding: compact ? '0.3rem 0.5rem' : '0.45rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-medium)',
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          fontSize: compact ? '0.825rem' : '0.875rem',
          fontWeight: '600',
          cursor: 'pointer',
          outline: 'none'
        }}
        title="Select AI and Interface Language"
      >
        {languages.map(l => (
          <option key={l.code} value={l.code}>
            {l.native} ({l.label})
          </option>
        ))}
      </select>
    </div>
  );
}
