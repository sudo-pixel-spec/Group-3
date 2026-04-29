import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { monitoringAPI, examAPI } from '../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [liveAttempts, setLiveAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [examForm, setExamForm] = useState({ title: '', form_url: '', start_time: '', end_time: '', duration_minutes: 60 });
  const [createMsg, setCreateMsg] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token') || user.role !== 'admin') { navigate('/login'); return; }
    fetchLive();
    const interval = setInterval(fetchLive, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchLive = () => {
    monitoringAPI.getLive()
      .then(res => setLiveAttempts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setCreateMsg('');
    try {
      const res = await examAPI.createExam(examForm);
      setCreateMsg(`✅ Exam created! Code: ${res.data.code}`);
      setExamForm({ title: '', form_url: '', start_time: '', end_time: '', duration_minutes: 60 });
    } catch (err) {
      setCreateMsg(`❌ ${err.response?.data?.message || 'Failed to create exam'}`);
    }
  };

  const getRiskBadge = (score) => {
    if (score >= 60) return <span className="badge badge-danger">🔴 Critical</span>;
    if (score >= 30) return <span className="badge badge-warning">🟡 Suspicious</span>;
    return <span className="badge badge-success">🟢 Normal</span>;
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">🎓 <span>Proctor</span>AI <span style={{ fontSize: '0.7rem', color: 'var(--accent)', marginLeft: '0.4rem', background: 'rgba(108,99,255,0.15)', padding: '0.2rem 0.5rem', borderRadius: '100px' }}>ADMIN</span></div>
        <div className="navbar-actions">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{user.email}</span>
          <button className="btn btn-ghost" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="page-with-nav">
        <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Admin Panel</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Monitor live sessions and manage exams.</p>
          </div>
          <button id="create-exam-btn" className="btn btn-primary" onClick={() => setShowCreate(s => !s)}>
            {showCreate ? '✕ Cancel' : '+ Create Exam'}
          </button>
        </div>

        {/* Create Exam Form */}
        {showCreate && (
          <div className="card" style={{ marginBottom: '2rem', borderColor: 'rgba(108,99,255,0.3)' }}>
            <h2 className="section-title">📁 New Exam</h2>
            {createMsg && (
              <div className={`alert ${createMsg.startsWith('✅') ? '' : 'alert-error'}`}
                style={createMsg.startsWith('✅') ? { background: 'rgba(6,214,160,0.1)', borderLeft: '3px solid var(--success)', color: 'var(--success)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' } : {}}>
                {createMsg}
              </div>
            )}
            <form onSubmit={handleCreateExam} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Exam Title</label>
                <input type="text" required placeholder="e.g. CS101 Final Exam"
                  value={examForm.title} onChange={e => setExamForm({ ...examForm, title: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Google Form URL</label>
                <input type="url" required placeholder="https://forms.gle/..."
                  value={examForm.form_url} onChange={e => setExamForm({ ...examForm, form_url: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Start Time</label>
                <input type="datetime-local" required value={examForm.start_time}
                  onChange={e => setExamForm({ ...examForm, start_time: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>End Time</label>
                <input type="datetime-local" required value={examForm.end_time}
                  onChange={e => setExamForm({ ...examForm, end_time: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Duration (minutes)</label>
                <input type="number" required min="1" value={examForm.duration_minutes}
                  onChange={e => setExamForm({ ...examForm, duration_minutes: parseInt(e.target.value) })} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" className="btn btn-primary btn-full">Create Exam</button>
              </div>
            </form>
          </div>
        )}

        {/* Live Monitor */}
        <div>
          <h2 className="section-title">
            📡 Live Sessions
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
              Auto-refreshes every 5s
            </span>
          </h2>
          {loading ? <div className="spinner" /> : liveAttempts.length === 0
            ? <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                No active exam sessions right now.
              </div>
            : <div className="grid-2">
                {liveAttempts.map(attempt => (
                  <div key={attempt._id} className="card" style={{ cursor: 'pointer', transition: 'var(--transition)' }}
                    onClick={() => navigate(`/admin/student/${attempt._id}`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      {getRiskBadge(attempt.risk_score)}
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                        {new Date(attempt.start_time).toLocaleTimeString()}
                      </span>
                    </div>
                    {/* Live frame thumbnail */}
                    {attempt.last_frame && (
                      <img src={attempt.last_frame} alt="Live snapshot"
                        style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', marginBottom: '0.75rem', background: '#000' }} />
                    )}
                    <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{attempt.user_id?.email || 'Unknown'}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                      {attempt.exam_id?.title || 'Exam'} · <span style={{ fontFamily: 'monospace' }}>{attempt.exam_id?.code}</span>
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Risk Score</p>
                        <p style={{ fontWeight: '700', fontSize: '1.3rem', color: attempt.risk_score >= 60 ? 'var(--danger)' : attempt.risk_score >= 30 ? 'var(--warning)' : 'var(--success)' }}>
                          {attempt.risk_score}
                        </p>
                      </div>
                      <button className="btn btn-ghost" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/student/${attempt._id}`); }}>
                        View Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
