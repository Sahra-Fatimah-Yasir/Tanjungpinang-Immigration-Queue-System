import './bootstrap.js';
import '../css/app.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Public Pages
import PublicDisplay from './Pages/PublicDisplay.tsx';
import QueueTracker from './Pages/QueueTracker.tsx';

// Officer Pages
import OfficerLogin from './Pages/Officer/OfficerLogin.tsx';
import OfficerDashboard from './Pages/OfficerDashboard.tsx';
import CsQueueInput from './Pages/CsQueueInput.tsx';

// Admin Pages
import AdminLogin from './Pages/Admin/AdminLogin.tsx';
import AdminDashboard from './Pages/AdminDashboard.tsx';
import AdminSettings from './Pages/Admin/AdminSettings.tsx';
import CounterManagement from './Pages/Admin/CounterManagement.tsx';
import OfficerManagement from './Pages/Admin/OfficerManagement.tsx';
import ActiveQueue from './Pages/Admin/ActiveQueue.tsx';
import ServiceReports from './Pages/Admin/ServiceReports.tsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicDisplay />} />
        <Route path="/display" element={<PublicDisplay />} />
        <Route path="/track/:trackingKey" element={<QueueTracker />} />

        {/* Officer Routes */}
        <Route path="/officer/login" element={<OfficerLogin />} />
        <Route path="/officer/dashboard" element={<OfficerDashboard />} />
        <Route path="/cs" element={<CsQueueInput />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/counters" element={<CounterManagement />} />
        <Route path="/admin/officers" element={<OfficerManagement />} />
        <Route path="/admin/queue" element={<ActiveQueue />} />
        <Route path="/admin/reports" element={<ServiceReports />} />
        <Route path="/admin/settings" element={<AdminSettings />} />

        {/* 404 Fallback */}
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
