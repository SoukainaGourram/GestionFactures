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
    { name: 'Juin', Facturé: 18200 + 12000 + 15000 + 9600, Payé: 18200 * 1.2 } // Hardcoded simulation from sample db data for visual richness
  ];

  // Adjust June values based on actual DB state
  let totalFacturesJuin = 0;
  let totalPayeJuin = 0;
  invoices.forEach(i => {
    // simple simulation parse
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
        return <Chip label="Payée" color="success" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'en_attente':
        return <Chip label="En attente" color="warning" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'refusee':
        return <Chip label="Rejetée" color="error" size="small" sx={{ fontWeight: 'bold' }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const statCards = [
    {
      title: 'Factures Émises',
      value: stats.total,
      subtitle: `${clientsCount} clients enregistrés`,
      icon: <ReceiptIcon sx={{ fontSize: 32 }} />,
      color: '#3b82f6',
      bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
    },
    {
      title: 'Montant Encaissé',
      value: `${stats.collected.toLocaleString('fr-FR')} DH`,
      subtitle: 'TTC réglés',
      icon: <MoneyIcon sx={{ fontSize: 32 }} />,
      color: '#10b981',
      bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
    },
    {
      title: 'En Attente de Règlement',
      value: `${stats.pending.toLocaleString('fr-FR')} DH`,
      subtitle: 'Montant en cours',
      icon: <HourglassIcon sx={{ fontSize: 32 }} />,
      color: '#f59e0b',
      bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
    },
    {
      title: 'Factures Rejetées',
      value: `${stats.rejected.toLocaleString('fr-FR')} DH`,
      subtitle: 'Montant impayé',
      icon: <CancelIcon sx={{ fontSize: 32 }} />,
      color: '#ef4444',
      bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
    }
  ];

  return (
    <Box>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight="700">
            Tableau de Bord Administrateur
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Vue d'ensemble de la facturation et de l'activité financière.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ReceiptIcon />}
          onClick={() => navigate('/factures/new')}
          sx={{ py: 1, px: 2, borderRadius: 2 }}
        >
          Créer une Facture
        </Button>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} mb={4}>
        {statCards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ border: '1px solid #f1f5f9', background: card.bg, borderRadius: 3, boxShadow: 'none' }}>
              <CardContent sx={{ p: 3, position: 'relative' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    color: card.color,
                    bgcolor: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: 2,
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {card.icon}
                </Box>
                <Typography variant="subtitle2" color="text.secondary" fontWeight="600" sx={{ mb: 1 }}>
                  {card.title}
                </Typography>
                <Typography variant="h4" fontWeight="800" sx={{ color: '#0f172a', mb: 0.5 }}>
                  {card.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight="500">
                  {card.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Grid */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3, height: 350 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Évolution Financière (Juin 2026)
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip formatter={(value) => `${value.toLocaleString('fr-FR')} DH`} />
                <Legend />
                <Bar dataKey="Facturé" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Payé" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, height: 350, display: 'flex', flexDirection: 'column' }}>
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
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
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
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Factures Récentes
          </Typography>
          <Button
            size="small"
            color="primary"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/factures')}
          >
            Toutes les factures
          </Button>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Numéro</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Montant HT</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Montant TTC</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.length > 0 ? (
                invoices.slice(0, 5).map((row) => (
                  <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell fontWeight="bold">{row.numero}</TableCell>
                    <TableCell>{row.client_nom}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.total_ht.toLocaleString('fr-FR')} DH</TableCell>
                    <TableCell fontWeight="bold">{row.total_ttc.toLocaleString('fr-FR')} DH</TableCell>
                    <TableCell>{getStatusChip(row.status)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
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