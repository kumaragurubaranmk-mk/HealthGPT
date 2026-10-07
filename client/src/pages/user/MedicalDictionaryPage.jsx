import React, { useState, useEffect } from 'react';
import { BookA, Search, Volume2, Sparkles, HelpCircle } from 'lucide-react';
import { MedicalDisclaimer } from '../../components/MedicalDisclaimer';

export function MedicalDictionaryPage() {
  const [terms, setTerms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const alphabet = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

  useEffect(() => {
    const url = new URL('/api/education/dictionary', window.location.origin);
    if (selectedLetter !== 'ALL') url.searchParams.append('letter', selectedLetter);
    if (searchQuery.trim()) url.searchParams.append('search', searchQuery.trim());

    fetch(url.toString())
      .then(res => res.json())
      .then(data => {
        setTerms(data.terms || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load dictionary:', err);
        setLoading(false);
      });
  }, [selectedLetter, searchQuery]);

  return (
    <div className="dashboard-body">
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--primary-100)',
          color: 'var(--primary-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem'
        }}>
          <BookA size={28} />
        </div>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Layperson Medical Dictionary</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '650px', margin: '0 auto' }}>
          Complex clinical jargon translated into clear, simple, everyday human language.
        </p>
      </div>

      <MedicalDisclaimer />

      {/* Search Input */}
      <div style={{ maxWidth: '540px', margin: '2rem auto 1.5rem', position: 'relative' }}>
        <input
          type="text"
          placeholder="Search clinical terms (e.g. Arrhythmia, Dyspnea, Hypertension)..."
          className="form-control"
          style={{ paddingLeft: '2.75rem', height: '48px', fontSize: '0.95rem' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
      </div>

      {/* A-Z Alphabet Filter */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0.35rem',
        marginBottom: '2.5rem'
      }}>
        {alphabet.map(letter => (
          <button
            key={letter}
            onClick={() => { setSelectedLetter(letter); setSearchQuery(''); }}
            className={`btn btn-sm ${selectedLetter === letter ? 'btn-primary' : 'btn-secondary'}`}
            style={{ minWidth: '34px', padding: '0.35rem 0.6rem' }}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Terms Grid */}
      {terms.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No medical terms found for "{searchQuery || selectedLetter}".
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {terms.map(item => (
            <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.35rem', color: 'var(--primary-700)' }}>
                    {item.term}
                  </h3>
                  {item.pronunciation && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', backgroundColor: 'var(--bg-muted)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                      🗣️ /{item.pronunciation}/
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.6', marginBottom: '1rem' }}>
                  {item.simple_definition}
                </div>

                {item.clinical_context && (
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-muted)',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '1rem'
                  }}>
                    <strong>Clinical Context:</strong> {item.clinical_context}
                  </div>
                )}
              </div>

              {item.related_terms && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <strong>Related Terms:</strong> {item.related_terms}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
