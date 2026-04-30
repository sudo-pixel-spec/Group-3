import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.register(form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ email: data.email, role: data.role, id: data._id }));
      navigate(data.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-center" style={{ background: 'radial-gradient(ellipse at 40% 60%, rgba(108,99,255,0.12) 0%, transparent 70%), var(--bg-base)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/vizi-logo-dark.svg" alt="Vizi Proctor Ai logo" style={{ width: '56px', height: '56px', margin: '0 auto 1rem', display: 'block' }} />
          <h1 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '0.25rem' }}>Create Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Join Vizi Proctor Ai today</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reg-email">Email Address</label>
            <input id="reg-email" type="email" name="email" placeholder="student@university.edu"
              value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <input id="reg-password" type="password" name="password" placeholder="Create a strong password"
              value={form.password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="reg-role">Account Type</label>
            <select id="reg-role" name="role" value={form.role} onChange={handleChange}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 1rem', color: 'var(--text-primary)', fontSize: '0.95rem', fontFamily: 'Inter, sans-serif', width: '100%' }}>
              <option value="student">Student</option>
              <option value="admin">Admin / Instructor</option>
            </select>
          </div>
          <button id="register-submit" type="submit" className="btn btn-primary btn-full"
            disabled={loading} style={{ marginTop: '0.5rem', padding: '0.9rem' }}>
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: '600' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
