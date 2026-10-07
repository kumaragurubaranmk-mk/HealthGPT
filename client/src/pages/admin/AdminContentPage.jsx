import React, { useState, useEffect } from 'react';
import {
  FileEdit,
  Plus,
  Trash2,
  Edit,
  BookOpen,
  Search,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Modal } from '../../components/Modal';

export function AdminContentPage() {
  const { adminToken } = useAdminAuth();
  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'preventive',
    summary: '',
    content: '',
    read_time: 5,
    author: 'HealthGPT Clinical Editorial',
    tags: ''
  });

  useEffect(() => {
    if (!adminToken) return;
    fetchArticles();
  }, [adminToken]);

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/admin/articles', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setArticles(data.articles || []);
      }
    } catch (err) {
      console.error('Failed to load articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingArticle(null);
    setFormData({
      title: '',
      slug: '',
      category: 'preventive',
      summary: '',
      content: '',
      read_time: 5,
      author: 'HealthGPT Clinical Editorial',
      tags: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (art) => {
    setEditingArticle(art);
    setFormData({
      title: art.title,
      slug: art.slug,
      category: art.category,
      summary: art.summary,
      content: art.content,
      read_time: art.read_time,
      author: art.author,
      tags: art.tags || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this educational article?')) return;

    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) fetchArticles();
    } catch (err) {
      console.error('Failed to delete article:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.summary || !formData.content) return;

    try {
      const method = editingArticle ? 'PUT' : 'POST';
      const endpoint = editingArticle ? `/api/admin/articles/${editingArticle.id}` : '/api/admin/articles';

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
        fetchArticles();
      }
    } catch (err) {
      console.error('Failed to save article:', err);
    }
  };

  const filtered = articles.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-body">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <FileEdit size={28} style={{ color: 'var(--primary-600)' }} />
            Healthcare Education CMS
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Publish, edit, and curate evidence-based medical articles for platform users.
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={18} /> New Article
        </button>
      </div>

      {/* Search Input */}
      <div style={{ maxWidth: '360px', marginBottom: '1.5rem', position: 'relative' }}>
        <input
          type="text"
          placeholder="Search articles by title or category..."
          className="form-control"
          style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
      </div>

      {/* Articles Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="data-table-wrapper" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Title & Slug</th>
                <th>Category</th>
                <th>Read Time</th>
                <th>Author</th>
                <th>Published Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(art => (
                <tr key={art.id}>
                  <td>
                    <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{art.title}</div>
                    <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>slug: /{art.slug}</div>
                  </td>
                  <td>
                    <span className="badge badge-primary">{art.category}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                      <Clock size={13} /> {art.read_time} min
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{art.author}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {new Date(art.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button onClick={() => handleOpenEdit(art)} className="btn btn-ghost btn-sm">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(art.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-600)' }}>
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

      {/* Article Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingArticle ? 'Edit Educational Article' : 'Create Educational Article'}
        maxWidth="740px"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Article Title <span className="required">*</span></label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. Managing Mild Hypertension with Lifestyle Interventions"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-control"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="preventive">Preventive Care</option>
                <option value="nutrition">Nutrition & Diet</option>
                <option value="sleep">Sleep Health</option>
                <option value="first_aid">First-Aid & Emergency</option>
                <option value="symptoms">Symptoms & Triage</option>
                <option value="medications">Medications</option>
                <option value="wellness">General Wellness</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Read Time (minutes)</label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={formData.read_time}
                onChange={(e) => setFormData({ ...formData, read_time: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Summary / Abstract <span className="required">*</span></label>
            <textarea
              rows="2"
              required
              className="form-control"
              placeholder="Brief summary of key clinical takeaways..."
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Full Article Content (Markdown format supported) <span className="required">*</span></label>
            <textarea
              rows="8"
              required
              className="form-control"
              placeholder="### Heading&#10;Write educational content with clinical disclaimers..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Author Byline</label>
              <input
                type="text"
                className="form-control"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tags (comma-separated)</label>
              <input
                type="text"
                className="form-control"
                placeholder="vitals, cardio, lifestyle"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingArticle ? 'Update Article' : 'Publish Article'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
