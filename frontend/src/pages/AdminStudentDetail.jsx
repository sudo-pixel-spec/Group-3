import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { monitoringAPI } from '../services/api';

const AdminStudentDetail = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!localStorage.getItem('token') || user.role !== 'admin') { navigate('/login'); return; }

    const fetchDetail = () => {
      monitoringAPI.getAttemptDetail(attemptId)
        .then(res => setData(res.data))
        .catch(() => navigate('/admin/dashboard'))
        .finally(() => setLoading(false));
    };

    fetchDetail();
    const interval = setInterval(fetchDetail, 5000);
    return () => clearInterval(interval);
  }, [attemptId, navigate]);

  const getRiskColor = (score) => score >= 60 ? 'var(--danger)' : score >= 30 ? 'var(--warning)' : 'var(--success)';
  const getRiskLabel = (score) => score >= 60 ? '🔴 Critical' : score >= 30 ? '🟡 Suspicious' : '🟢 Normal';

  const eventTypeIcon = {
    LOOKING_AWAY: '👀',
    MULTIPLE_FACES: '👥',
    NO_FACE: '🚫',
    AUDIO_DETECTED: '🎤',
    TAB_SWITCH: '🔀',
    BLURRED_WINDOW: '🌐',
    PHONE_DETECTED: '📱',
    OBJECT_DETECTED: '📦',
  };

  if (loading) return <div className="page-center"><div className="spinner" /></div>;
  if (!data) return <div className="page-center"><p>Not found.</p></div>;

  const { attempt, events } = data;

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <span onClick={() => navigate('/admin/dashboard')} style={{ cursor: 'pointer' }}>🎓 <span>Proctor</span>AI</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--accent)', marginLeft: '0.4rem', background: 'rgba(108,99,255,0.15)', padding: '0.2rem 0.5rem', borderRadius: '100px' }}>ADMIN</span>
        </div>
        <div className="navbar-actions">
          <button className="btn btn-ghost" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            onClick={() => navigate('/admin/dashboard')}>← Back to Dashboard</button>
        </div>
      </nav>

      <div className="page-with-nav">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Student Detail — {attempt.user_id?.email || 'Unknown'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Exam: <strong>{attempt.exam_id?.title}</strong> · Code: <span style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{attempt.exam_id?.code}</span>
          </p>
        </div>

        {/* Top row: Risk + Frame + Status */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {/* Risk Score Gauge */}
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Risk Score</p>
            <div style={{
              width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto 0.75rem',
              background: `conic-gradient(${getRiskColor(attempt.risk_score)} ${attempt.risk_score}%, var(--bg-base) 0%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{
                width: '78px', height: '78px', borderRadius: '50%', background: 'var(--bg-card)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '700', fontSize: '1.5rem', color: getRiskColor(attempt.risk_score)
              }}>
                {attempt.risk_score}
              </div>
            </div>
            <p style={{ fontWeight: '600', color: getRiskColor(attempt.risk_score) }}>{getRiskLabel(attempt.risk_score)}</p>
          </div>

          {/* Last Frame */}
          <div className="card">
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>📷 Last Snapshot</p>
            {attempt.last_frame
              ? <img src={attempt.last_frame} alt="Last frame" style={{ width: '100%', borderRadius: '8px', background: '#000' }} />
              : <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No snapshot available</div>
            }
          </div>

          {/* Session Info */}
          <div className="card">
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Session Info</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
              <div><span style={{ color: 'var(--text-secondary)' }}>Status:</span>{' '}
                <span className={`badge ${attempt.status === 'in_progress' ? 'badge-success' : 'badge-warning'}`}>
                  {attempt.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Started:</span> {new Date(attempt.start_time).toLocaleString()}</div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Total Events:</span> <strong>{events.length}</strong></div>
              {attempt.score !== null && (
                <div><span style={{ color: 'var(--text-secondary)' }}>Score:</span> <strong style={{ color: 'var(--success)' }}>{attempt.score}/100</strong></div>
              )}
            </div>
          </div>
        </div>

        {/* Event Timeline */}
        <div>
          <h2 className="section-title">📊 Event Timeline</h2>
          {events.length === 0
            ? <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No events recorded for this session.</div>
            : <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                {/* Timeline line */}
                <div style={{ position: 'absolute', left: '10px', top: '0', bottom: '0', width: '2px', background: 'var(--border)' }} />
                
                {events.map((event, i) => (
                  <div key={i} style={{ position: 'relative', marginBottom: '0.75rem' }}>
                    {/* Dot */}
                    <div style={{
                      position: 'absolute', left: '-1.55rem', top: '0.45rem',
                      width: '12px', height: '12px', borderRadius: '50%',
                      background: event.event_type === 'MULTIPLE_FACES' || event.event_type === 'NO_FACE' || event.event_type === 'PHONE_DETECTED'
                        ? 'var(--danger)'
                        : 'var(--warning)',
                      border: '2px solid var(--bg-base)'
                    }} />
                    
                    <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>{eventTypeIcon[event.event_type] || '⚡'}</span>
                        <div>
                          <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{event.event_type.replace(/_/g, ' ')}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Confidence: {(event.confidence * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
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

export default AdminStudentDetail;
