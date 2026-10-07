import React, { useState, useEffect } from 'react';
import { BookOpenText, Plus, Trash2, Edit, Search } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Modal } from '../../components/Modal';

export function AdminDictionaryPage() {
  const { adminToken } = useAdminAuth();
  const [terms, setTerms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [formData, setFormData] = useState({
    term: '',
    pronunciation: '',
    simple_definition: '',
    clinical_context: '',
    related_terms: ''
  });

  useEffect(() => {
    if (!adminToken) return;
    fetchTerms();
  }, [adminToken]);

  const fetchTerms = async () => {
    try {
      const res = await fetch('/api/education/dictionary');
      const data = await res.json();
      if (res.ok) {
        setTerms(data.terms || []);
      }
    } catch (err) {
      console.error('Failed to load terms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTerm(null);
    setFormData({
      term: '',
      pronunciation: '',
      simple_definition: '',
      clinical_context: '',
      related_terms: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingTerm(item);
    setFormData({
      term: item.term,
      pronunciation: item.pronunciation || '',
      simple_definition: item.simple_definition,
      clinical_context: item.clinical_context || '',
      related_terms: item.related_terms || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this dictionary entry?')) return;

    try {
      const res = await fetch(`/api/admin/dictionary/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) fetchTerms();
    } catch (err) {
      console.error('Failed to delete term:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.term || !formData.simple_definition) return;

    try {
      const method = editingTerm ? 'PUT' : 'POST';
      const endpoint = editingTerm ? `/api/admin/dictionary/${editingTerm.id}` : '/api/admin/dictionary';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchTerms();
      }
    } catch (err) {
      console.error('Failed to save term:', err);
    }
  };

  const filtered = terms.filter(t =>
    t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.simple_definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-body">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <BookOpenText size={28} style={{ color: 'var(--accent-indigo)' }} />
            Medical Dictionary CMS
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Curate definitions of medical terms explained in layperson terminology.
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={18} /> New Medical Term
        </button>
      </div>

      <div style={{ maxWidth: '360px', marginBottom: '1.5rem', position: 'relative' }}>
        <input
          type="text"
          placeholder="Search glossary..."
          className="form-control"
          style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="data-table-wrapper" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Medical Term</th>
                <th>Pronunciation</th>
                <th>Layperson Definition</th>
                <th>Related Terms</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: '700', color: 'var(--primary-700)' }}>
                    {item.term}
                  </td>
                  <td style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                    {item.pronunciation ? `/${item.pronunciation}/` : '—'}
                  </td>
                  <td style={{ fontSize: '0.875rem', maxWidth: '320px' }}>
                    {item.simple_definition}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {item.related_terms || '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button onClick={() => handleOpenEdit(item)} className="btn btn-ghost btn-sm">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-600)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTerm ? 'Edit Medical Term' : 'Add Medical Term'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Clinical Term <span className="required">*</span></label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. Arrhythmia, Hypoglycemia"
              value={formData.term}
              onChange={(e) => setFormData({ ...formData, term: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phonetic Pronunciation Guide</label>
            <input
              type="text"
              className="form-control"
              placeholder="uh-RITH-mee-uh"
              value={formData.pronunciation}
              onChange={(e) => setFormData({ ...formData, pronunciation: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Layperson Definition <span className="required">*</span></label>
            <textarea
              rows="3"
              required
              className="form-control"
              placeholder="Explain what this means in simple non-technical language..."
              value={formData.simple_definition}
              onChange={(e) => setFormData({ ...formData, simple_definition: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Clinical Context</label>
            <textarea
              rows="2"
              className="form-control"
              placeholder="How is it tested or clinically approached?"
              value={formData.clinical_context}
              onChange={(e) => setFormData({ ...formData, clinical_context: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Related Terms (comma-separated)</label>
            <input
              type="text"
              className="form-control"
              placeholder="Tachycardia, Bradycardia"
              value={formData.related_terms}
              onChange={(e) => setFormData({ ...formData, related_terms: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingTerm ? 'Update Term' : 'Add Term'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
