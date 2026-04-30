import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ email: data.email, role: data.role, id: data._id }));
      navigate(data.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-center" style={{ background: 'radial-gradient(ellipse at 60% 40%, rgba(108,99,255,0.12) 0%, transparent 70%), var(--bg-base)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/vizi-logo-dark.svg" alt="Vizi Proctor Ai logo" style={{ width: '56px', height: '56px', margin: '0 auto 1rem', display: 'block' }} />
          <h1 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '0.25rem' }}>Vizi Proctor Ai</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sign in to continue</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="student@university.edu"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ marginTop: '0.5rem', padding: '0.9rem' }}
          >
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', fontWeight: '600' }}>Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;