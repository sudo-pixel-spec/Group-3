import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { examAPI } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [data, setData] = useState({ upcoming: [], active: [], completed: [] });
  const [examCode, setExamCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    examAPI.getDashboard()
      .then(res => setData(res.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoinError('');
    try {
      const res = await examAPI.joinExam(examCode);
      navigate(`/exam/${res.data.exam._id}`);
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Invalid exam code');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString() : '—';

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <img src="/vizi-logo-dark.svg" alt="Vizi Proctor Ai logo" style={{ width: '24px', height: '24px' }} />
          <span style={{ color: 'var(--text-primary)' }}>Vizi Proctor Ai</span>
        </div>
        <div className="navbar-actions">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{user.email}</span>
          <button id="logout-btn" className="btn btn-ghost" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="page-with-nav">
        {/* Greeting */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Welcome back 👋</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Here's what's happening today.</p>
        </div>

        {/* Join Exam */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 className="section-title">🎟️ Join an Exam</h2>
          <form onSubmit={handleJoin} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input id="exam-code-input" type="text" placeholder="Enter exam code  e.g. EXAM-ABC123"
              value={examCode} onChange={e => setExamCode(e.target.value.toUpperCase())}
              required style={{ flex: 1, minWidth: '220px' }} />
            <button id="join-exam-btn" type="submit" className="btn btn-primary">Join Exam →</button>
          </form>
          {joinError && <p style={{ color: 'var(--danger)', marginTop: '0.75rem', fontSize: '0.875rem' }}>⚠ {joinError}</p>}
        </div>

        {loading ? <div className="spinner" /> : (
          <>
            {/* Active Exams */}
            {data.active?.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h2 className="section-title">🟢 Active Now</h2>
                <div className="grid-2">
                  {data.active.map(exam => (
                    <div key={exam._id} className="card" style={{ borderColor: 'rgba(6,214,160,0.3)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span className="badge badge-success">LIVE</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{exam.code}</span>
                      </div>
                      <h3 style={{ marginBottom: '0.5rem' }}>{exam.title}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>Ends: {formatDate(exam.end_time)}</p>
                      <Link to={`/exam/${exam._id}`}>
                        <button className="btn btn-primary btn-full">Enter Exam</button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Exams */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 className="section-title">📅 Upcoming Exams</h2>
              {data.upcoming?.length === 0
                ? <p style={{ color: 'var(--text-secondary)' }}>No upcoming exams scheduled.</p>
                : <div className="grid-2">
                  {data.upcoming.map(exam => (
                    <div key={exam._id} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span className="badge badge-warning">UPCOMING</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{exam.code}</span>
                      </div>
                      <h3 style={{ marginBottom: '0.5rem' }}>{exam.title}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Starts: {formatDate(exam.start_time)}</p>
                    </div>
                  ))}
                </div>
              }
            </div>

            {/* Completed Exams */}
            <div>
              <h2 className="section-title">✅ Completed Exams</h2>
              {data.completed?.length === 0
                ? <p style={{ color: 'var(--text-secondary)' }}>No completed exams yet.</p>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {data.completed.map(attempt => (
                    <div key={attempt._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
                      <div>
                        <p style={{ fontWeight: '600' }}>{attempt.exam_id?.title || 'Exam'}</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{formatDate(attempt.updatedAt)}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {attempt.score !== null
                          ? <p style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--success)' }}>{attempt.score}/100</p>
                          : <span className="badge badge-warning">Pending</span>
                        }
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          Risk: <span style={{ color: attempt.risk_score > 60 ? 'var(--danger)' : 'var(--text-primary)' }}>{attempt.risk_score}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Dashboard;