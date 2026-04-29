import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examAPI, monitoringAPI } from '../services/api';

const ExamPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [riskScore, setRiskScore] = useState(0);
  const [events, setEvents] = useState([]);
  const [camError, setCamError] = useState('');
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  // --- Load exam and attempt ---
  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    examAPI.getExam(id).then(res => {
      setExam(res.data);
      const secs = res.data.duration_minutes * 60;
      setTimeLeft(secs);
    }).catch(() => navigate('/dashboard'));
  }, [id, navigate]);

  // --- Start webcam ---
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setCamError('⚠ Camera access denied. Proctoring requires webcam access.'));

    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); };
  }, []);

  // --- Countdown timer ---
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft]);

  // --- Browser monitoring (tab switch / blur) ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) logEvent('TAB_SWITCH');
    };
    const handleBlur = () => logEvent('BLURRED_WINDOW');
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [attempt]);

  const logEvent = async (event_type, confidence = 1.0) => {
    if (!attempt?._id) return;
    try {
      const res = await monitoringAPI.logEvent({ attempt_id: attempt._id, event_type, confidence });
      setRiskScore(res.data.risk_score);
      setEvents(prev => [{ event_type, timestamp: new Date().toISOString() }, ...prev.slice(0, 9)]);
    } catch (_) {}
  };

  const handleSubmit = () => {
    clearTimeout(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    navigate('/dashboard');
  };

  const formatTime = (secs) => {
    if (secs === null) return '--:--';
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const riskColor = riskScore >= 60 ? 'var(--danger)' : riskScore >= 30 ? 'var(--warning)' : 'var(--success)';

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', overflow: 'hidden' }}>
      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1.5rem', background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontWeight: '700', fontSize: '1rem' }}>🎓 ProctorAI</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{exam?.title || 'Loading…'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Timer */}
          <div style={{
            background: timeLeft !== null && timeLeft < 300 ? 'rgba(255,77,109,0.15)' : 'rgba(108,99,255,0.12)',
            border: `1px solid ${timeLeft !== null && timeLeft < 300 ? 'var(--danger)' : 'var(--accent)'}`,
            borderRadius: '8px', padding: '0.35rem 0.85rem',
            fontFamily: 'monospace', fontSize: '1.15rem', fontWeight: '700',
            color: timeLeft !== null && timeLeft < 300 ? 'var(--danger)' : 'var(--text-primary)',
          }}>⏱ {formatTime(timeLeft)}</div>
          {/* Risk score */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk</div>
            <div style={{ fontWeight: '700', color: riskColor }}>{riskScore}</div>
          </div>
          <button id="submit-exam-btn" className="btn btn-danger" style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem' }} onClick={handleSubmit}>
            Submit Exam
          </button>
        </div>
      </div>

      {/* Main split area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT: Google Form iframe */}
        <div style={{ flex: 1, position: 'relative' }}>
          {exam?.form_url
            ? <iframe src={exam.form_url} title="Exam Form" style={{ width: '100%', height: '100%', border: 'none' }} />
            : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                Loading exam form…
              </div>
          }
        </div>

        {/* RIGHT: Camera panel */}
        <div style={{
          width: '280px', flexShrink: 0, background: 'var(--bg-card)',
          borderLeft: '1px solid var(--border)', display: 'flex',
          flexDirection: 'column', gap: '1rem', padding: '1rem', overflowY: 'auto'
        }}>
          {/* Camera feed */}
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📷 Camera</p>
            {camError
              ? <div style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid var(--danger)', borderRadius: '8px', padding: '1rem', fontSize: '0.8rem', color: 'var(--danger)' }}>{camError}</div>
              : <video ref={videoRef} autoPlay muted playsInline
                  style={{ width: '100%', borderRadius: '10px', background: '#000', aspectRatio: '4/3', objectFit: 'cover' }} />
            }
          </div>

          {/* Status */}
          <div style={{ background: 'rgba(6,214,160,0.08)', border: '1px solid rgba(6,214,160,0.2)', borderRadius: '8px', padding: '0.75rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--success)' }}>Monitoring Active</span>
            </div>
          </div>

          {/* Recent Events */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚠ Events</p>
            {events.length === 0
              ? <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No events recorded.</p>
              : events.map((ev, i) => (
                  <div key={i} style={{
                    padding: '0.4rem 0.6rem', marginBottom: '0.4rem',
                    background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.15)',
                    borderRadius: '6px', fontSize: '0.75rem'
                  }}>
                    <span style={{ color: 'var(--danger)', fontWeight: '600' }}>{ev.event_type.replace(/_/g, ' ')}</span>
                    <span style={{ color: 'var(--text-secondary)', float: 'right' }}>
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
            }
          </div>

          {/* Exam Code */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exam Code</p>
            <p style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--accent)' }}>{exam?.code || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPage;
