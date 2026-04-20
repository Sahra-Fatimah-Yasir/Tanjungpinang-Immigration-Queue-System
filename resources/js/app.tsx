import './bootstrap.js';
import '../css/app.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import PublicDisplay from './Pages/PublicDisplay.js';
import AdminDashboard from './Pages/AdminDashboard.js';
import OfficerDashboard from './Pages/OfficerDashboard.js';
import Login from './Pages/Login.js';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicDisplay />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/officer" element={<OfficerDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

const root = document.getElementById('app');

if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}