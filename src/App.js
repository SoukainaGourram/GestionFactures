import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/auth/Login';
import UserDashboard from './pages/dashboard/UserDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import ClientList from './pages/clients/ClientList';
import FactureList from './pages/factures/FactureList';
import FactureForm from './pages/factures/FactureForm';
import Articles from './pages/parametres/Articles';
import Categories from './pages/parametres/Categories';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute role="user">
              <UserDashboard />
            </ProtectedRoute>
          } />
          <Route path="/clients" element={
            <ProtectedRoute role="user">
              <ClientList />
            </ProtectedRoute>
          } />
          <Route path="/factures" element={
            <ProtectedRoute role="user">
              <FactureList />
            </ProtectedRoute>
          } />
          <Route path="/factures