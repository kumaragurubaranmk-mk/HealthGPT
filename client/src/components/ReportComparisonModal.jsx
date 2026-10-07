import React from 'react';
import { ArrowRight, TrendingDown, TrendingUp, Minus, CheckCircle, AlertCircle, X, Sparkles, BarChart2 } from 'lucide-react';

export function ReportComparisonModal({ isOpen, onClose, comparisonData, reportTitle }) {
  if (!isOpen || !comparisonData) return null;

  const comparison = comparisonData.comparison || comparisonData;
  const currentReport = comparisonData.currentReport;
  const previousReport = comparisonData.previousReport;
  const comparisons = comparison?.comparisons || [];
  const stats = comparison?.summaryStats || { improvedCount: 0, worsenedCount: 0, unchangedCount: 0 };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        maxWidth: '720px',
        width: '100%',
        maxHeight: '90vh',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-medium)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: 'var(--bg-muted)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart2 size={20} style={{ color: 'var(--primary-600)' }} />
              Historical Medical Report Comparison
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {previousReport ? `${previousReport.report_date} (v${previousReport.version || 1}) → ${currentReport?.report_date || 'Current'} (v${currentReport?.version || 2})` : 'Comparing against baseline'}
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ borderRadius: '50%', padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem' }}>
          {/* Summary Badges Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'var(--accent-emerald-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--accent-emerald)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                {stats.improvedCount}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>
                Improved Toward Target
              </div>
            </div>

            <div style={{
              padding: '0.75rem',
              backgroundColor: 'var(--bg-muted)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {stats.unchangedCount}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Stable / Maintained
              </div>
            </div>

            <div style={{
              padding: '0.75rem',
              backgroundColor: 'var(--danger-50)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--danger-100)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--danger-600)' }}>
                {stats.worsenedCount}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--danger-600)', textTransform: 'uppercase' }}>
                Needs Clinical Attention
              </div>
            </div>
          </div>

          {/* AI Layperson Comparison Narrative */}
          {comparison?.aiExplanation && (
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--primary-50)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--primary-200)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-700)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>
                <Sparkles size={16} /> AI Health Trajectory Interpretation (Layperson Summary)
              </div>
              <pre style={{
                fontSize: '0.825rem',
                fontFamily: 'inherit',
                whiteSpace: 'pre-wrap',
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
                margin: 0
              }}>
                {comparison.aiExplanation}
              </pre>
            </div>
          )}

          {/* Detailed Biomarker Comparison Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Biomarker Comparison Grid ({comparisons.length} Matched Indicators):
            </h4>

            {comparisons.length === 0 ? (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-muted)',
                borderRadius: 'var(--radius-md)'
              }}>
                No overlapping biomarkers found between these two report records.
              </div>
            ) : (
              comparisons.map((item, idx) => {
                const isImproved = item.trajectory === 'improved';
                const isWorsened = item.trajectory === 'worsened';
                const sign = item.delta > 0 ? '+' : '';

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      boxShadow: 'var(--shadow-xs)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {item.name}
                        </strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Reference Interval: {item.referenceRange || 'Standard Lab Norm'}
                        </div>
                      </div>

                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: isImproved ? 'var(--accent-emerald-subtle)' : isWorsened ? 'var(--danger-50)' : 'var(--bg-muted)',
                        color: isImproved ? 'var(--accent-emerald)' : isWorsened ? 'var(--danger-600)' : 'var(--text-muted)',
                        border: `1px solid ${isImproved ? 'var(--accent-emerald)' : isWorsened ? 'var(--danger-500)' : 'var(--border-subtle)'}`
                      }}>
                        {isImproved ? <TrendingDown size={13} /> : isWorsened ? <TrendingUp size={13} /> : <Minus size={13} />}
                        {isImproved ? 'Improved' : isWorsened ? 'Shifted Out of Range' : 'Stable'}
                      </span>
                    </div>

                    {/* Value Comparison Stream */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      backgroundColor: 'var(--bg-muted)',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem'
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Previous: </span>
                        <strong>{item.previousValue} {item.unit}</strong>
                      </div>

                      <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />

                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Current: </span>
                        <strong style={{ color: isImproved ? 'var(--accent-emerald)' : isWorsened ? 'var(--danger-600)' : 'var(--text-primary)' }}>
                          {item.currentValue} {item.unit}
                        </strong>
                      </div>

                      <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                        <span style={{
                          fontWeight: 700,
                          color: isImproved ? 'var(--accent-emerald)' : isWorsened ? 'var(--danger-600)' : 'var(--text-secondary)'
                        }}>
                          {sign}{item.delta} {item.unit} ({sign}{item.percentageChange}%)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: 'var(--bg-muted)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
