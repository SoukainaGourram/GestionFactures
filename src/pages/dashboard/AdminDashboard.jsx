import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFactures, getClients } from '../../services/jsonService';
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
  Stack,
  useTheme
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  HourglassEmpty as HourglassIcon,
  CancelOutlined as CancelIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

function AdminDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();

  const [invoices, setInvoices] = useState([]);
  const [clientsCount, setClientsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    collected: 0,
    pending: 0,
    rejected: 0
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [invRes, cliRes] = await Promise.all([getFactures(), getClients()]);
        const invs = invRes.data;
        setInvoices(invs);
        setClientsCount(cliRes.data.length);

        // Calculate statistics
        const totalCount = invs.length;
        let collectedSum = 0;
        let pendingSum = 0;
        let rejectedSum = 0;

        invs.forEach(inv => {
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
        console.error('Erreur lors du chargement des données du tableau de bord', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={50} />
      </Box>
    );
  }

  // Chart data: Status Distribution
  const pieData = [
    { name: 'Payées', value: invoices.filter(i => i.status === 'payee').length, color: '#10b981' },
    { name: 'En Attente', value: invoices.filter(i => i.status === 'en_attente').length, color: '#f59e0b' },
    { name: 'Rejetées', value: invoices.filter(i => i.status === 'refusee').length, color: '#ef4444' }
  ].filter(item => item.value > 0);

  // Chart data: Monthly invoices (grouped by month/date)
  const monthlyData = [
    { name: 'Jan', Facturé: 0, Payé: 0 },
    { name: 'Fév', Facturé: 0, Payé: 0 },
    { name: 'Mar', Facturé: 0, Payé: 0 },
    { name: 'Avr', Facturé: 0, Payé: 0 },
    { name: 'Mai', Facturé: 0, Payé: 0 },
    { name: 'Juin', Facturé: 0, Payé: 0 }
  ];

  // Group invoice totals for the current month
  let totalFacturesJuin = 0;
  let totalPayeJuin = 0;
  invoices.forEach(i => {
    if (i.date && i.date.includes('-06-')) {
      totalFacturesJuin += i.total_ttc;
      if (i.status === 'payee') {
        totalPayeJuin += i.total_ttc;
      }
    }
  });
  monthlyData[5].Facturé = Math.round(totalFacturesJuin);
  monthlyData[5].Payé = Math.round(totalPayeJuin);

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

  const statCards = [
    {
      title: 'Factures Émises',
      value: stats.total,
      subtitle: `${clientsCount} clients enregistrés`,
      icon: <ReceiptIcon sx={{ fontSize: 28 }} />,
      color: '#2563eb'
    },
    {
      title: 'Montant Encaissé',
      value: `${stats.collected.toLocaleString('fr-FR')} DH`,
      subtitle: 'TTC réglés',
      icon: <MoneyIcon sx={{ fontSize: 28 }} />,
      color: '#10b981'
    },
    {
      title: 'En Attente',
      value: `${stats.pending.toLocaleString('fr-FR')} DH`,
      subtitle: 'Règlements en attente',
      icon: <HourglassIcon sx={{ fontSize: 28 }} />,
      color: '#f59e0b'
    },
    {
      title: 'Factures Rejetées',
      value: `${stats.rejected.toLocaleString('fr-FR')} DH`,
      subtitle: 'Montant impayé',
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
        <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="800" sx={{ mb: 1, color: '#f8fafc', letterSpacing: '-0.5px' }}>
              Ravi de vous revoir, Administrateur !
            </Typography>
            <Typography variant="body1" sx={{ color: '#94a3b8' }}>
              Voici le statut de facturation et l'activité financière générale de vos clients.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ReceiptIcon />}
            onClick={() => navigate('/factures/new')}
            sx={{
              py: 1.4,
              px: 3,
              borderRadius: '12px',
              fontWeight: 'bold',
              bgcolor: '#2563eb',
              textTransform: 'none',
              '&:hover': { bgcolor: '#1d4ed8' },
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
            }}
          >
            Créer une Facture
          </Button>
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

      {/* Stats Grid */}
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

      {/* Charts Grid */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: 350, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Évolution Financière (Juin 2026)
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={monthlyData} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', 
                    fontFamily: '"Outfit", sans-serif' 
                  }}
                  formatter={(value) => [`${value.toLocaleString('fr-FR')} DH`, undefined]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
                <Bar dataKey="Facturé" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={30} />
                <Bar dataKey="Payé" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: 350, display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Répartition des Factures
            </Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
                <Typography color="text.secondary">Aucune facture enregistrée</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Invoices Table */}
      <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Factures Récentes
          </Typography>
          <Button
            size="small"
            color="primary"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/factures')}
            sx={{ fontWeight: 'bold' }}
          >
            Toutes les factures
          </Button>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Numéro</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Montant HT</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Montant TTC</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.length > 0 ? (
                invoices.slice(0, 5).map((row) => (
                  <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell fontWeight="bold">{row.numero}</TableCell>
                    <TableCell fontWeight="500">{row.client_nom}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.total_ht.toLocaleString('fr-FR')} DH</TableCell>
                    <TableCell fontWeight="bold" color="primary.main">{row.total_ttc.toLocaleString('fr-FR')} DH</TableCell>
                    <TableCell>{getStatusChip(row.status)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    Aucune facture récente.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default AdminDashboard;