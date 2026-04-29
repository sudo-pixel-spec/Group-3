import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examAPI, monitoringAPI } from '../services/api';

const ExamPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const videoStreamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const audioIntervalRef = useRef(null);

  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [riskScore, setRiskScore] = useState(0);
  const [events, setEvents] = useState([]);
  const [camError, setCamError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aiStatus, setAiStatus] = useState('Initializing…');

  const attemptRef = useRef(null);
  const timerRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const lastEventTimeRef = useRef({});

  // --- Load exam + create/resume attempt ---
  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    examAPI.getExam(id).then(res => {
      const data = res.data;
      setExam(data.exam || data);
      setTimeLeft((data.exam || data).duration_minutes * 60);
      if (data.attempt) {
        setAttempt(data.attempt);
        setRiskScore(data.attempt.risk_score || 0);
      }
    }).catch(() => navigate('/dashboard'));
  }, [id, navigate]);

  // --- Countdown timer ---
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft]);

  // --- Throttled event logger (max 1 per type per 10s) ---
  const logEvent = useCallback(async (event_type, confidence = 1.0) => {
    if (!attemptRef.current?._id) return;
    const now = Date.now();
    if (lastEventTimeRef.current[event_type] && now - lastEventTimeRef.current[event_type] < 10000) return;
    lastEventTimeRef.current[event_type] = now;
    try {
      const res = await monitoringAPI.logEvent({ attempt_id: attemptRef.current._id, event_type, confidence });
      setRiskScore(res.data.risk_score);
      setEvents(prev => [{ event_type, timestamp: new Date().toISOString() }, ...prev.slice(0, 19)]);
    } catch (_) {}
  }, []);

  // --- Fullscreen enforcement ---
  const enterFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    setIsFullscreen(true);
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        logEvent('TAB_SWITCH', 0.8);
        // Re-request fullscreen after short delay
        setTimeout(() => enterFullscreen(), 500);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [logEvent, enterFullscreen]);

  // --- Browser monitoring (tab switch / blur / mouse / keyboard) ---
  useEffect(() => {
    const handleVisibilityChange = () => { if (document.hidden) logEvent('TAB_SWITCH'); };
    const handleBlur = () => logEvent('BLURRED_WINDOW');
    
    // Check if mouse leaves the browser window
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 || e.clientX <= 0 || (e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) {
        logEvent('MOUSE_OFF_SCREEN');
      }
    };
    
    // Check for risky keyboard shortcuts (Copy, Paste, Print)
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'p')) {
        logEvent('KEYBOARD_SHORTCUT');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [logEvent]);

  // --- MediaPipe Face Detection (CDN-loaded, in-browser) ---
  useEffect(() => {
    if (!videoRef.current) return;
    let cancelled = false;

    // Fixed loadScript: Handles StrictMode double-execution where script is in DOM but not yet loaded.
    const loadScript = (src, globalVarName) => new Promise((resolve, reject) => {
      // If already fully loaded and available on window
      if (window[globalVarName]) { resolve(); return; }
      
      let s = document.querySelector(`script[src="${src}"]`);
      if (s) {
        if (s.getAttribute('data-loaded') === 'true') { resolve(); return; }
        s.addEventListener('load', () => resolve());
        s.addEventListener('error', reject);
        return;
      }
      
      s = document.createElement('script');
      s.src = src; 
      s.onload = () => { 
        s.setAttribute('data-loaded', 'true'); 
        resolve(); 
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });

    const initMediaPipe = async () => {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js', 'FaceDetection');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js', 'Camera');
        if (cancelled) return;

        const FaceDetection = window.FaceDetection;
        const Camera = window.Camera;

        if (!FaceDetection || !Camera) {
          setAiStatus('⚠ MediaPipe failed to load');
          return;
        }

        const faceDetection = new FaceDetection({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
        });
        faceDetection.setOptions({ model: 'short', minDetectionConfidence: 0.5 });

        faceDetection.onResults((results) => {
          const faceCount = results.detections?.length || 0;
          if (faceCount === 0) {
            logEvent('NO_FACE', 0.9);
            setAiStatus('⚠ No face detected');
          } else if (faceCount > 1) {
            logEvent('MULTIPLE_FACES', 0.95);
            setAiStatus(`🚫 ${faceCount} faces detected`);
          } else {
            const det = results.detections[0];
            const bbox = det.boundingBox;
            if (bbox) {
              const imgW = results.image?.width || 320;
              const imgH = results.image?.height || 240;
              const faceCx = (bbox.originX + bbox.width / 2) / imgW;
              const faceCy = (bbox.originY + bbox.height / 2) / imgH;
              if (Math.abs(faceCx - 0.5) > 0.3 || Math.abs(faceCy - 0.5) > 0.35) {
                logEvent('LOOKING_AWAY', 0.8);
                setAiStatus('👀 Looking away');
              } else {
                setAiStatus('✅ Face detected — Normal');
              }
            } else {
              setAiStatus('✅ Face detected — Normal');
            }
          }
        });

        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (!cancelled) await faceDetection.send({ image: videoRef.current });
          },
          width: 320, height: 240,
        });
        
        await faceDetection.initialize();
        if (cancelled) return;

        camera.start();
        cameraRef.current = camera;
        setAiStatus('✅ AI monitoring active');
      } catch (err) {
        console.warn('MediaPipe load failed:', err);
        setAiStatus('⚠ AI offline — frame capture only');
      }
    };

    initMediaPipe();
    return () => { cancelled = true; if (cameraRef.current) cameraRef.current.stop(); };
  }, [logEvent]);

  // --- Ensure webcam stream exists even if MediaPipe fails ---
  useEffect(() => {
    let cancelled = false;

    const initCameraStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        videoStreamRef.current = stream;
        if (videoRef.current && !videoRef.current.srcObject) {
          videoRef.current.srcObject = stream;
        }
      } catch (_) {
        setCamError('Camera permission denied. Snapshots cannot be captured.');
      }
    };

    initCameraStream();
    return () => {
      cancelled = true;
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t) => t.stop());
        videoStreamRef.current = null;
      }
    };
  }, []);

  // --- Audio monitoring (Web Audio API) ---
  useEffect(() => {
    let stream;
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then((s) => {
        stream = s;
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(s);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        audioCtxRef.current = audioCtx;
        analyserRef.current = analyser;

        // Check audio levels every 2 seconds
        audioIntervalRef.current = setInterval(() => {
          const data = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          if (avg > 30) { // Threshold for "talking"
            logEvent('AUDIO_DETECTED', Math.min(1, avg / 100));
          }
        }, 2000);
      })
      .catch(() => { /* audio permission denied — ok, non-critical */ });

    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [logEvent]);

  // --- 1 FPS frame upload pipeline ---
  useEffect(() => {
    if (!attemptRef.current?._id) return;

    frameIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = 160;
      canvas.height = 120;
      ctx.drawImage(videoRef.current, 0, 0, 160, 120);
      const frame = canvas.toDataURL('image/jpeg', 0.5);

      monitoringAPI.uploadFrame({ attempt_id: attemptRef.current._id, frame }).catch(() => {});
    }, 1000);

    return () => { if (frameIntervalRef.current) clearInterval(frameIntervalRef.current); };
  }, [attempt]);

  // --- Enter fullscreen on exam load ---
  useEffect(() => {
    if (exam) enterFullscreen();
  }, [exam, enterFullscreen]);

  // --- Keep attemptRef in sync ---
  useEffect(() => { attemptRef.current = attempt; }, [attempt]);

  const handleSubmit = async () => {
    clearTimeout(timerRef.current);
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    if (cameraRef.current) cameraRef.current.stop();
    if (audioCtxRef.current) audioCtxRef.current.close();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    
    try {
      if (exam) await examAPI.submitExam(exam._id || exam.id);
    } catch (_) {}
    
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
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

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
          <div style={{
            background: timeLeft !== null && timeLeft < 300 ? 'rgba(255,77,109,0.15)' : 'rgba(108,99,255,0.12)',
            border: `1px solid ${timeLeft !== null && timeLeft < 300 ? 'var(--danger)' : 'var(--accent)'}`,
            borderRadius: '8px', padding: '0.35rem 0.85rem',
            fontFamily: 'monospace', fontSize: '1.15rem', fontWeight: '700',
            color: timeLeft !== null && timeLeft < 300 ? 'var(--danger)' : 'var(--text-primary)',
          }}>⏱ {formatTime(timeLeft)}</div>
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

        {/* RIGHT: Camera + monitoring panel */}
        <div style={{
          width: '280px', flexShrink: 0, background: 'var(--bg-card)',
          borderLeft: '1px solid var(--border)', display: 'flex',
          flexDirection: 'column', gap: '0.75rem', padding: '0.75rem', overflowY: 'auto'
        }}>
          {/* Camera feed */}
          <div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📷 Camera</p>
            <video ref={videoRef} autoPlay muted playsInline
              style={{ width: '100%', borderRadius: '10px', background: '#000', aspectRatio: '4/3', objectFit: 'cover' }} />
            {camError && <p style={{ marginTop: '0.45rem', fontSize: '0.75rem', color: 'var(--danger)' }}>{camError}</p>}
          </div>

          {/* AI Status */}
          <div style={{
            background: aiStatus.startsWith('✅') ? 'rgba(6,214,160,0.08)' : 'rgba(255,77,109,0.08)',
            border: `1px solid ${aiStatus.startsWith('✅') ? 'rgba(6,214,160,0.2)' : 'rgba(255,77,109,0.2)'}`,
            borderRadius: '8px', padding: '0.6rem'
          }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🧠 AI Detection</p>
            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: aiStatus.startsWith('✅') ? 'var(--success)' : 'var(--danger)' }}>
              {aiStatus}
            </p>
          </div>

          {/* Monitoring Status */}
          <div style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '8px', padding: '0.6rem' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block', animation: 'spin 2s linear infinite' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)' }}>🎥 Video · 🎤 Audio · 🌐 Browser</span>
            </div>
          </div>

          {/* Recent Events */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚠ Events ({events.length})</p>
            {events.length === 0
              ? <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No events recorded.</p>
              : events.map((ev, i) => (
                  <div key={i} style={{
                    padding: '0.35rem 0.5rem', marginBottom: '0.3rem',
                    background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.15)',
                    borderRadius: '6px', fontSize: '0.7rem'
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
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.6rem' }}>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exam Code</p>
            <p style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--accent)', fontSize: '0.9rem' }}>{exam?.code || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPage;
