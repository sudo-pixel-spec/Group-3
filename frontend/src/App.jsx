import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ExamPage from './pages/ExamPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminStudentDetail from './pages/AdminStudentDetail';
import './index.css';

// Simple route guards
const PrivateRoute = ({ children }) => {
  return localStorage.getItem('token') ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return localStorage.getItem('token') && user.role === 'admin'
    ? children
    : <Navigate to="/login" replace />;
};

function App() {
  useEffect(() => {
    const stop = (e) => {
      e.preventDefault();
    };

    const onKeyDown = (e) => {
      const key = typeof e.key === 'string' ? e.key.toLowerCase() : '';
      const mod = e.ctrlKey || e.metaKey;

      if (mod && ['c', 'v', 'x', 'a', 's', 'p', 'u'].includes(key)) {
        e.preventDefault();
        return;
      }
      if (mod && e.shiftKey && ['i', 'j', 'c', 'k'].includes(key)) {
        e.preventDefault();
        return;
      }
      if (key === 'f12' || key === 'printscreen') {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', stop, true);
    document.addEventListener('copy', stop, true);
    document.addEventListener('cut', stop, true);
    document.addEventListener('paste', stop, true);
    document.addEventListener('dragstart', stop, true);
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('contextmenu', stop, true);
      document.removeEventListener('copy', stop, true);
      document.removeEventListener('cut', stop, true);
      document.removeEventListener('paste', stop, true);
      document.removeEventListener('dragstart', stop, true);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Student */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/exam/:id"  element={<PrivateRoute><ExamPage /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/student/:attemptId" element={<AdminRoute><AdminStudentDetail /></AdminRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
