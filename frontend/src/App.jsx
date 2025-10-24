import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import ApplicationForm from './pages/ApplicationForm';
import ApplicationDetail from './pages/ApplicationDetail';
import CourtshipTopics from './pages/CourtshipTopics';
import Profile from './pages/Profile';
import CommitteeDashboard from './pages/CommitteeDashboard';
import Notifications from './pages/Notifications';
import AdminPanel from './pages/AdminPanel';
import Communications from './pages/Communications';
import Feedback from './pages/Feedback';
import RegionalStatistics from './pages/RegionalStatistics';
import ManageComplaints from './pages/ManageComplaints';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route wrapper
const ProtectedRoute = ({ children, requiredRole = null, requiredRoles = null }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRoles && !requiredRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route wrapper (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="applications" element={<Applications />} />
        <Route path="applications/new" element={<ApplicationForm />} />
        <Route path="applications/:id" element={<ApplicationDetail />} />
        <Route path="applications/:id/courtship" element={<CourtshipTopics />} />
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="feedback" element={<Feedback />} />
        
        {/* Committee Routes */}
        <Route path="committee" element={<CommitteeDashboard />} />
        <Route path="communications" element={<Communications />} />
        <Route path="regional-statistics" element={<RegionalStatistics />} />
        
        {/* Complaints Management - Accessible by committee members, central committee, and overseers */}
        <Route 
          path="manage-complaints" 
          element={
            <ProtectedRoute requiredRoles={['committee_member', 'central_committee', 'overseer']}>
              <ManageComplaints />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Routes - Accessible by committee members, central committee, and overseers */}
        <Route 
          path="admin" 
          element={
            <ProtectedRoute requiredRoles={['committee_member', 'central_committee', 'overseer']}>
              <AdminPanel />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

