// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import InterviewRoom from './pages/InterviewRoom';
import Dashboard from './pages/Dashboard';
import InterviewSetup from './pages/InterviewSetup';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/interview" 
          element={
            <ProtectedRoute>
              <InterviewRoom />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/setup" 
          element={
            <ProtectedRoute>
              <InterviewSetup />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;