import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DepartmentsProvider } from './context/DepartmentsContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Pharmacy from './pages/Pharmacy';
import DoctorInbox from './pages/DoctorInbox';
import DoctorVerification from './pages/DoctorVerification';
import DepartmentManagement from './pages/DepartmentManagement';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-container"><div className="loading-spinner">Healing Space Loading...</div></div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <DepartmentsProvider>
        <Router>
          <div className="app-wrapper">
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <PrivateRoute>
                  <Chat />
                </PrivateRoute>
              }
            />
            <Route
              path="/pharmacy"
              element={
                <PrivateRoute>
                  <Pharmacy />
                </PrivateRoute>
              }
            />
            <Route
              path="/doctor-inbox"
              element={
                <PrivateRoute>
                  <DoctorInbox />
                </PrivateRoute>
              }
            />
            <Route
              path="/verify-doctors"
              element={
                <PrivateRoute>
                  <DoctorVerification />
                </PrivateRoute>
              }
            />
            <Route
              path="/manage-departments"
              element={
                <PrivateRoute>
                  <DepartmentManagement />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
              </Routes>
          </div>
        </Router>
      </DepartmentsProvider>
    </AuthProvider>
  );
}

export default App;
