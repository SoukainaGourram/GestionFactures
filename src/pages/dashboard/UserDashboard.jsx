import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getFactures } from '../../services/jsonService';
import { generatePDF } from '../../utils/pdfGenerator';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  IconButton,
  useTheme
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  HourglassEmpty as HourglassIcon,
  CancelOutlined as CancelIcon,
  Download as DownloadIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

function UserDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    collected: 0,
    pending: 0,
    rejected: 0
  });

  useEffect(() => {
    async function fetchData() {
      if (!currentUser || !currentUser.clientId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await getFactures();
        // Filter invoices belonging to the logged-in client
        const clientInvoices = res.data.filter(inv => String(inv.client_id) === String(currentUser.clientId));
        setInvoices(clientInvoices);

        // Calculate statistics
        const totalCount = clientInvoices.length;
        let collectedSum = 0;
        let pendingSum = 0;
        let rejectedSum = 0;

        clientInvoices.forEach(inv => {
          if (inv.status === 'payee') {
            collectedSum += inv.total_ttc;
          } else if (inv.status === 'en_attente') {
            pendingSum += inv.total_ttc;
          } else if (inv.status === 'refusee') {
            rejectedSum += inv.total_ttc;
          }
        });

        setStats({
          total: totalCount,
          collected: collectedSum,
          pending: pendingSum,
          rejected: rejectedSum
        });
      } catch (err) {
        console.error('Erreur lors du chargement du tableau de bord client', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentUser]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={50} />
      </Box>
    );
  }

  const handleDownloadPDF = (invoice) => {
    generatePDF(invoice);
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'payee':
        return <Chip label="Payée" color="success" size="small" sx={{ fontWeight: 'bold', borderRadius: '6px' }} />;
      case 'en_attente':
        return <Chip label="En attente" color="warning" size="small" sx={{ fontWeight: 'bold', borderRadius: '6px' }} />;
      case 'refusee':
        return <Chip label="Rejetée" color="error" size="small" sx={{ fontWeight: 'bold', borderRadius: '6px' }} />;
      default:
        return <Chip label={status} size="small" sx={{ borderRadius: '6px' }} />;
    }
  };

  // Chart data
  const pieData = [
    { name: 'Payées', value: invoices.filter(i => i.status === 'payee').length, color: '#10b981' },
    { name: 'En Attente', value: invoices.filter(i => i.status === 'en_attente').length, color: '#f59e0b' },
    { name: 'Rejetées', value: invoices.filter(i => i.status === 'refusee').length, color: '#ef4444' }
  ].filter(item => item.value > 0);

  const statCards = [
    {
      title: 'Mes Factures',
      value: stats.total,
      subtitle: 'Toutes vos factures',
      icon: <ReceiptIcon sx={{ fontSize: 28 }} />,
      color: '#2563eb'
    },
    {
      title: 'Total Payé',
      value: `${stats.collected.toLocaleString('fr-FR')} DH`,
      subtitle: 'Montant réglé',
      icon: <MoneyIcon sx={{ fontSize: 28 }} />,
      color: '#10b981'
    },
    {
      title: 'Total En Attente',
      value: `${stats.pending.toLocaleString('fr-FR')} DH`,
      subtitle: 'À régler d\'ici l\'échéance',
      icon: <HourglassIcon sx={{ fontSize: 28 }} />,
      color: '#f59e0b'
    },
    {
      title: 'Total Rejeté',
      value: `${stats.rejected.toLocaleString('fr-FR')} DH`,
      subtitle: 'Litiges / Erreurs',
      icon: <CancelIcon sx={{ fontSize: 28 }} />,
      color: '#ef4444'
    }
  ];

  return (
    <Box>
      {/* Welcome Banner */}
      <Box
        sx={{
          mb: 4,
          p: { xs: 3, md: 4 },
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.85) 100%), url("/images/dashboard_banner.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="h4" fontWeight="800" sx={{ mb: 1, color: '#f8fafc', letterSpacing: '-0.5px' }}>
            Bienvenue, {currentUser?.name || 'Client'} !
          </Typography>
          <Typography variant="body1" sx={{ color: '#94a3b8' }}>
            Consultez vos factures émises, téléchargez vos reçus et suivez l'état de vos règlements.
          </Typography>
        </Box>

        {/* Floating gradient accent */}
        <Box
          sx={{
            position: 'absolute',
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0) 70%)',
            top: -100,
            right: 100,
            zIndex: 1
          }}
        />
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        {statCards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card 
              sx={{ 
                border: '1px solid #f1f5f9', 
                bgcolor: 'white', 
                borderRadius: '16px', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '4px',
                  height: '100%',
                  bgcolor: card.color
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="700" sx={{ mb: 1, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h5" fontWeight="800" sx={{ color: '#0f172a', mb: 0.5 }}>
                      {card.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight="500">
                      {card.subtitle}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      color: card.color,
                      bgcolor: `${card.color}15`, // Approx 8% opacity background
                      borderRadius: '12px',
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Grid split: Recent Invoices & Chart */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Mes Dernières Factures
              </Typography>
              <Button
                size="small"
                color="primary"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/factures')}
                sx={{ fontWeight: 'bold' }}
              >
                Toutes mes factures
              </Button>
            </Box>

            <TableContainer>
              <Table sx={{ minWidth: 500 }}>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Numéro</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Date d'émission</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Échéance</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Montant TTC</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Statut</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.length > 0 ? (
                    invoices.slice(0, 5).map((row) => (
                      <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell fontWeight="bold">{row.numero}</TableCell>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.date_echeance || '-'}</TableCell>
                        <TableCell fontWeight="bold" color="primary.main">{row.total_ttc.toLocaleString('fr-FR')} DH</TableCell>
                        <TableCell>{getStatusChip(row.status)}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="primary"
                            onClick={() => handleDownloadPDF(row)}
                            title="Télécharger la facture (PDF)"
                          >
                            <DownloadIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        Aucune facture enregistrée pour votre compte.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Statut de vos Règlements
            </Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', 
                        fontFamily: '"Outfit", sans-serif' 
                      }} 
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.8rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary">Aucune statistique disponible</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default UserDashboard;