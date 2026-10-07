import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Clock,
  User,
  ArrowRight,
  Info,
  Tag,
  Share2
} from 'lucide-react';
import { Modal } from '../../components/Modal';
import { MedicalDisclaimer } from '../../components/MedicalDisclaimer';

export function EducationPage() {
  const [articles, setArticles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeArticle, setActiveArticle] = useState(null);

  const categories = [
    { id: 'all', label: 'All Library' },
    { id: 'preventive', label: 'Preventive Care' },
    { id: 'nutrition', label: 'Nutrition & Diet' },
    { id: 'sleep', label: 'Sleep Health' },
    { id: 'first_aid', label: 'First-Aid & CPR' },
    { id: 'symptoms', label: 'Symptoms & Triage' },
    { id: 'medications', label: 'Medications Safety' }
  ];

  useEffect(() => {
    const url = new URL('/api/education/articles', window.location.origin);
    if (selectedCategory !== 'all') url.searchParams.append('category', selectedCategory);
    if (searchQuery.trim()) url.searchParams.append('search', searchQuery.trim());

    fetch(url.toString())
      .then(res => res.json())
      .then(data => {
        setArticles(data.articles || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load education articles:', err);
        setLoading(false);
      });
  }, [selectedCategory, searchQuery]);

  const handleReadArticle = async (slug) => {
    try {
      const res = await fetch(`/api/education/articles/${slug}`);
      const data = await res.json();
      if (res.ok) {
        setActiveArticle(data.article);
      }
    } catch (err) {
      console.error('Failed to fetch article details:', err);
    }
  };

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
          <BookOpen size={28} />
        </div>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Healthcare Education Library</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '650px', margin: '0 auto' }}>
          Evidence-grounded medical guides, first-aid protocols, and lifestyle longevity principles curated for patients.
        </p>
      </div>

      <MedicalDisclaimer />

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        margin: '2rem 0 1.5rem'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`btn btn-sm ${selectedCategory === c.id ? 'btn-primary' : 'btn-secondary'}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            placeholder="Search articles, topics..."
            className="form-control"
            style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* Articles Grid */}
      {articles.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No articles found matching your search.
        </div>
      ) : (
        <div className="grid-3">
          {articles.map(art => (
            <div key={art.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span className="badge badge-primary">
                    {categories.find(c => c.id === art.category)?.label || art.category}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <Clock size={14} /> {art.read_time} min read
                  </div>
                </div>

                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.65rem', lineHeight: '1.4' }}>
                  {art.title}
                </h3>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                  {art.summary}
                </p>
              </div>

              <div>
                <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={13} /> {art.author}
                </div>

                <button
                  onClick={() => handleReadArticle(art.slug)}
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Read Educational Guide <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Article Modal */}
      <Modal
        isOpen={!!activeArticle}
        onClose={() => setActiveArticle(null)}
        title={activeArticle?.title || 'Educational Guide'}
        maxWidth="760px"
      >
        {activeArticle && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <span>By {activeArticle.author}</span>
              <span>•</span>
              <span>{activeArticle.read_time} min read</span>
              <span>•</span>
              <span className="badge badge-primary">{activeArticle.category}</span>
            </div>

            <div style={{
              fontSize: '1rem',
              lineHeight: '1.8',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-line',
              marginBottom: '2rem'
            }}>
              {activeArticle.content}
            </div>

            <MedicalDisclaimer compact />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setActiveArticle(null)} className="btn btn-secondary">
                Close Article
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
