import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/auth/Login';
import Layout from './pages/Layout';
import UserDashboard from './pages/dashboard/UserDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import ClientList from './pages/clients/ClientList';
import FactureList from './pages/factures/FactureList';
import FactureForm from './pages/factures/FactureForm';
import Articles from './pages/parametres/Articles';
import Categories from './pages/parametres/Categories';

// Modern & Professional Custom Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb', // Blue
      light: '#3b82f6',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0f172a', // Dark Slate
      light: '#1e293b',
      dark: '#020617',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      color: '#0f172a',
    },
    h5: {
      fontWeight: 600,
      color: '#0f172a',
    },
    h6: {
      fontWeight: 600,
      color: '#0f172a',
    },
    subtitle1: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
  },
});

function DashboardSwitch() {
  const { userRole } = useAuth();
  return userRole === 'admin' ? <AdminDashboard /> : <UserDashboard />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes wrapped in Layout */}
            <Route element={
              <ProtectedRoute role="client">
                <Layout />
              </ProtectedRoute>
            }>
              {/* Home route switches dashboard based on role */}
              <Route path="/" element={<DashboardSwitch />} />
              
              {/* Invoices list is visible to both but filtered internally */}
              <Route path="/factures" element={<FactureList />} />
              
              {/* Invoice creation/edit accessible to both Admin and User (Comptable/Agent) */}
              <Route path="/factures/new" element={<FactureForm />} />
              
              <Route path="/factures/edit/:id" element={<FactureForm />} />

              {/* Client, Articles, Categories only for Admin */}
              <Route path="/clients" element={
                <ProtectedRoute role="admin">
                  <ClientList />
                </ProtectedRoute>
              } />
              
              <Route path="/articles" element={
                <ProtectedRoute role="admin">
                  <Articles />
                </ProtectedRoute>
              } />
              
              <Route path="/categories" element={
                <ProtectedRoute role="admin">
                  <Categories />
                </ProtectedRoute>
              } />
            </Route>

            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;