import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Stack
} from '@mui/material';

function Login() {
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Veuillez remplir tous les champs.');
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Erreur lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for testing
  const handleQuickLogin = async (role) => {
    let testEmail = '';
    let testPass = 'client123';

    if (role === 'admin') {
      testEmail = 'admin@test.com';
      testPass = 'admin123';
    } else if (role === 'client1') {
      testEmail = 'client1@test.com';
    } else if (role === 'client2') {
      testEmail = 'client2@test.com';
    }

    setEmail(testEmail);
    setPassword(testPass);

    try {
      setError('');
      setLoading(true);
      await login(testEmail, testPass);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Erreur lors de la connexion rapide.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
        p: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 420,
          width: '100%',
          borderRadius: 4,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(16px)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          overflow: 'visible'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header/Logo */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 60,
                height: 60,
                borderRadius: 3,
                bgcolor: 'primary.main',
                color: 'white',
                fontSize: '1.75rem',
                fontWeight: 'bold',
                mb: 1.5,
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.4)'
              }}
            >
              FF
            </Box>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
              FactureFlow
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Système de Facturation Professionnel
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Adresse Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                sx: { borderRadius: 2 }
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mot de passe"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
              InputProps={{
                sx: { borderRadius: 2 }
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontSize: '1rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Se Connecter'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary" fontWeight="bold">
              COMPTES DE TEST (SIMULATION)
            </Typography>
          </Divider>

          {/* Quick-fill actions for testing */}
          <Stack spacing={1.5}>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={() => handleQuickLogin('admin')}
              sx={{ borderRadius: 2, py: 1 }}
            >
              Connexion en tant qu'<strong>Admin</strong>
            </Button>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                color="info"
                fullWidth
                onClick={() => handleQuickLogin('client1')}
                sx={{ borderRadius: 2, py: 0.8, fontSize: '0.8rem' }}
              >
                Client Acme Corp
              </Button>
              <Button
                variant="outlined"
                color="info"
                fullWidth
                onClick={() => handleQuickLogin('client2')}
                sx={{ borderRadius: 2, py: 0.8, fontSize: '0.8rem' }}
              >
                Client Globex Corp
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Login;
