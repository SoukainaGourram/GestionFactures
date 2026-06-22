import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
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
        bgcolor: '#f8fafc',
      }}
    >
      {/* Left side: Login Form */}
      <Box
        sx={{
          flex: { xs: '1 1 100%', md: '1 1 50%' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 6, md: 8 },
          bgcolor: 'white',
        }}
      >
        <Box sx={{ maxWidth: 400, width: '100%' }}>
          {/* Logo / Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 60,
                height: 60,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: 'white',
                fontSize: '1.75rem',
                fontWeight: 'bold',
                mb: 2,
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)',
              }}
            >
              FF
            </Box>
            <Typography variant="h4" fontWeight="800" sx={{ mb: 1, letterSpacing: '-0.5px' }}>
              FactureFlow
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Système de Facturation Professionnel
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
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
                sx: { borderRadius: '12px' }
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
                sx: { borderRadius: '12px' }
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.8,
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 10px 28px rgba(37, 99, 235, 0.35)',
                }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Se Connecter'}
            </Button>
          </Box>

          <Divider sx={{ my: 4 }}>
            <Typography variant="caption" color="text.secondary" fontWeight="700">
              COMPTES DE TEST (SIMULATION)
            </Typography>
          </Divider>

          {/* Quick-fill actions for testing */}
          <Stack spacing={2}>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={() => handleQuickLogin('admin')}
              sx={{
                borderRadius: '12px',
                py: 1.3,
                borderWidth: '1.5px',
                borderColor: '#e2e8f0',
                color: '#0f172a',
                transition: 'all 0.2s',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#0f172a',
                  borderWidth: '1.5px',
                  bgcolor: '#f8fafc',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Connexion en tant qu'<strong>Admin</strong>
            </Button>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                color="info"
                fullWidth
                onClick={() => handleQuickLogin('client1')}
                sx={{
                  borderRadius: '12px',
                  py: 1.1,
                  fontSize: '0.8rem',
                  borderColor: '#e2e8f0',
                  color: '#475569',
                  borderWidth: '1.5px',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#2563eb',
                    borderWidth: '1.5px',
                    bgcolor: '#eff6ff',
                    color: '#2563eb',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                Client Acme Corp
              </Button>
              <Button
                variant="outlined"
                color="info"
                fullWidth
                onClick={() => handleQuickLogin('client2')}
                sx={{
                  borderRadius: '12px',
                  py: 1.1,
                  fontSize: '0.8rem',
                  borderColor: '#e2e8f0',
                  color: '#475569',
                  borderWidth: '1.5px',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#2563eb',
                    borderWidth: '1.5px',
                    bgcolor: '#eff6ff',
                    color: '#2563eb',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                Client Globex Corp
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>

      {/* Right side: Aesthetic Illustration Banner */}
      <Box
        sx={{
          flex: '1 1 50%',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: 'white',
          p: 6,
          overflow: 'hidden'
        }}
      >
        {/* Background Image of login visual */}
        <Box
          component="img"
          src="/images/login_visual.png"
          alt="FactureFlow Invoicing Visual"
          sx={{
            width: '80%',
            maxWidth: 440,
            height: 'auto',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
            mb: 5,
            transform: 'perspective(1000px) rotateY(-8deg) rotateX(6deg)',
            transition: 'all 0.5s ease-in-out',
            zIndex: 2,
            '&:hover': {
              transform: 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1.02)',
              boxShadow: '0 30px 70px rgba(0, 0, 0, 0.55)',
            }
          }}
        />

        <Box sx={{ maxWidth: 440, textAlign: 'center', zIndex: 2 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 1.5, color: '#f8fafc', letterSpacing: '-0.3px' }}>
            Facturation Intelligente & Intuitive
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6 }}>
            Créez vos documents professionnels, suivez les échéances de règlements clients, et analysez la croissance de votre entreprise grâce à nos tableaux de bord dynamiques.
          </Typography>
        </Box>

        {/* Ambient background glows */}
        <Box
          sx={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, rgba(37,99,235,0) 70%)',
            top: '-10%',
            right: '-10%',
            zIndex: 1
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0) 70%)',
            bottom: '-15%',
            left: '-15%',
            zIndex: 1
          }}
        />
      </Box>
    </Box>
  );
}

export default Login;
