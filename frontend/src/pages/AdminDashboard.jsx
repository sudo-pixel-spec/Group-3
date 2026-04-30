import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examAPI } from '../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [examList, setExamList] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedExamData, setSelectedExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [examForm, setExamForm] = useState({ title: '', form_url: '', start_time: '', end_time: '', duration_minutes: 60 });
  const [createMsg, setCreateMsg] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token') || user.role !== 'admin') { navigate('/login'); return; }
    fetchExams();
    const interval = setInterval(() => {
      fetchExams();
      if (selectedExamId) fetchExamAttempts(selectedExamId);
    }, 5000);
    return () => clearInterval(interval);
  }, [navigate, selectedExamId]);

  const fetchExams = () => {
    examAPI.getAdminExamList()
      .then((res) => {
        const exams = res.data || [];
        setExamList(exams);
        if (!selectedExamId && exams.length > 0) {
          const firstExamId = exams[0]._id;
          setSelectedExamId(firstExamId);
          fetchExamAttempts(firstExamId);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchExamAttempts = (examId) => {
    if (!examId) return;
    setAttemptsLoading(true);
    examAPI.getAdminExamAttempts(examId)
      .then((res) => setSelectedExamData(res.data))
      .catch(() => {})
      .finally(() => setAttemptsLoading(false));
  };

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setCreateMsg('');
    try {
      const res = await examAPI.createExam(examForm);
      setCreateMsg(`✅ Exam created! Code: ${res.data.code}`);
      setExamForm({ title: '', form_url: '', start_time: '', end_time: '', duration_minutes: 60 });
      fetchExams();
    } catch (err) {
      setCreateMsg(`❌ ${err.response?.data?.message || 'Failed to create exam'}`);
    }
  };

  const getRiskBadge = (score) => {
    if (score >= 60) return <span className="badge badge-danger">🔴 Critical</span>;
    if (score >= 30) return <span className="badge badge-warning">🟡 Suspicious</span>;
    return <span className="badge badge-success">🟢 Normal</span>;
  };

  const renderStudentCard = (attempt) => (
    <div
      key={attempt._id}
      className="card"
      style={{ cursor: 'pointer', transition: 'var(--transition)' }}
      onClick={() => navigate(`/admin/student/${attempt._id}`)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        {getRiskBadge(attempt.risk_score)}
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
          {new Date(attempt.updatedAt).toLocaleTimeString()}
        </span>
      </div>
      {attempt.last_frame && (
        <img
          src={attempt.last_frame}
          alt="Live snapshot"
          style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', marginBottom: '0.75rem', background: '#000' }}
        />
      )}
      <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{attempt.user_id?.email || 'Unknown'}</p>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
        Status: {attempt.status.replace(/_/g, ' ')}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontWeight: '700', fontSize: '1.1rem' }}>{attempt.risk_score}</p>
        <button
          className="btn btn-ghost"
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
          onClick={(e) => { e.stopPropagation(); navigate(`/admin/student/${attempt._id}`); }}
        >
          View Details →
        </button>
      </div>
    </div>
  );

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <img src="/vizi-logo-dark.svg" alt="Vizi Proctor Ai logo" style={{ width: '24px', height: '24px' }} />
          <span style={{ color: 'var(--text-primary)' }}>Vizi Proctor Ai</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--accent)', marginLeft: '0.4rem', background: 'rgba(108,99,255,0.15)', padding: '0.2rem 0.5rem', borderRadius: '100px' }}>ADMIN</span>
        </div>
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
            <form onSubmit={handleCreateExam} className="create-exam-form">
              <div className="form-group create-exam-field">
                <label>Exam Title</label>
                <input type="text" required placeholder="e.g. CS101 Final Exam"
                  value={examForm.title} onChange={e => setExamForm({ ...examForm, title: e.target.value })} />
              </div>
              <div className="form-group create-exam-field">
                <label>Google Form URL</label>
                <input type="url" required placeholder="https://forms.gle/..."
                  value={examForm.form_url} onChange={e => setExamForm({ ...examForm, form_url: e.target.value })} />
              </div>
              <div className="form-group create-exam-field">
                <label>Start Time</label>
                <input type="datetime-local" required value={examForm.start_time}
                  onChange={e => setExamForm({ ...examForm, start_time: e.target.value })} />
              </div>
              <div className="form-group create-exam-field">
                <label>End Time</label>
                <input type="datetime-local" required value={examForm.end_time}
                  onChange={e => setExamForm({ ...examForm, end_time: e.target.value })} />
              </div>
              <div className="form-group create-exam-field">
                <label>Duration (minutes)</label>
                <input type="number" required min="1" value={examForm.duration_minutes}
                  onChange={e => setExamForm({ ...examForm, duration_minutes: parseInt(e.target.value) })} />
              </div>
              <div className="create-exam-submit">
                <button type="submit" className="btn btn-primary btn-full">Create Exam</button>
              </div>
            </form>
          </div>
        )}

        {/* Exam List */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 className="section-title">📝 Exams</h2>
          {loading ? <div className="spinner" /> : examList.length === 0
            ? <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                No exams found.
              </div>
            : <div className="grid-2">
                {examList.map((exam) => (
                  <div
                    key={exam._id}
                    className="card"
                    style={{
                      cursor: 'pointer',
                      borderColor: selectedExamId === exam._id ? 'rgba(108,99,255,0.4)' : undefined,
                    }}
                    onClick={() => {
                      setSelectedExamId(exam._id);
                      fetchExamAttempts(exam._id);
                    }}
                  >
                    <p style={{ fontWeight: '700', marginBottom: '0.35rem' }}>{exam.title}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '0.6rem' }}>
                      Code: <span style={{ fontFamily: 'monospace' }}>{exam.code}</span>
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-success">Answering: {exam.stats?.answering || 0}</span>
                      <span className="badge badge-warning">Offline: {exam.stats?.offline || 0}</span>
                      <span className="badge">Answered: {exam.stats?.answered || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Selected Exam Students */}
        <div>
          <h2 className="section-title">
            📡 Student Monitoring
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
              Auto-refreshes every 5s
            </span>
          </h2>
          {!selectedExamId
            ? <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                Select an exam to view students.
              </div>
            : attemptsLoading
              ? <div className="spinner" />
              : (
                <>
                  <h3 style={{ marginBottom: '0.75rem' }}>
                    {selectedExamData?.exam?.title || 'Selected Exam'} ({selectedExamData?.exam?.code || '---'})
                  </h3>

                  <p style={{ color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>🟢 Answering Live</p>
                  {selectedExamData?.grouped?.answering?.length
                    ? <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
                        {selectedExamData.grouped.answering.map(renderStudentCard)}
                      </div>
                    : <div className="card" style={{ marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>No students currently answering.</div>
                  }

                  <p style={{ color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>🟡 Offline (in-progress but inactive)</p>
                  {selectedExamData?.grouped?.offline?.length
                    ? <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
                        {selectedExamData.grouped.offline.map(renderStudentCard)}
                      </div>
                    : <div className="card" style={{ marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>No offline students.</div>
                  }

                  <p style={{ color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>✅ Answered / Submitted</p>
                  {selectedExamData?.grouped?.answered?.length
                    ? <div className="grid-2">
                        {selectedExamData.grouped.answered.map(renderStudentCard)}
                      </div>
                    : <div className="card" style={{ color: 'var(--text-secondary)' }}>No submitted attempts yet.</div>
                  }
                </>
              )
          }
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
