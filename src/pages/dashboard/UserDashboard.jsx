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
        return <Chip label="Payée" color="success" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'en_attente':
        return <Chip label="En attente" color="warning" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'refusee':
        return <Chip label="Rejetée" color="error" size="small" sx={{ fontWeight: 'bold' }} />;
      default:
        return <Chip label={status} size="small" />;
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
      icon: <ReceiptIcon sx={{ fontSize: 32 }} />,
      color: '#3b82f6',
      bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
    },
    {
      title: 'Total Payé',
      value: `${stats.collected.toLocaleString('fr-FR')} DH`,
      subtitle: 'Montant réglé',
      icon: <MoneyIcon sx={{ fontSize: 32 }} />,
      color: '#10b981',
      bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
    },
    {
      title: 'Total En Attente',
      value: `${stats.pending.toLocaleString('fr-FR')} DH`,
      subtitle: 'À régler d\'ici l\'échéance',
      icon: <HourglassIcon sx={{ fontSize: 32 }} />,
      color: '#f59e0b',
      bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
    },
    {
      title: 'Total Rejeté',
      value: `${stats.rejected.toLocaleString('fr-FR')} DH`,
      subtitle: 'Litiges / Erreurs',
      icon: <CancelIcon sx={{ fontSize: 32 }} />,
      color: '#ef4444',
      bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
    }
  ];

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="700">
          Tableau de Bord Client
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Espace client pour <strong style={{ color: '#0f172a' }}>{currentUser?.name}</strong>. Consultez vos factures et suivez vos règlements.
        </Typography>
      </Box>

      {/* Stats Cards */}
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

      {/* Main Grid split: Recent Invoices & Chart */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Mes Dernières Factures
              </Typography>
              <Button
                size="small"
                color="primary"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/factures')}
              >
                Toutes mes factures
              </Button>
            </Box>

            <TableContainer>
              <Table sx={{ minWidth: 500 }}>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Numéro</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date d'émission</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Échéance</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Montant TTC</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.length > 0 ? (
                    invoices.slice(0, 5).map((row) => (
                      <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell fontWeight="bold">{row.numero}</TableCell>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.date_echeance || '-'}</TableCell>
                        <TableCell fontWeight="bold">{row.total_ttc.toLocaleString('fr-FR')} DH</TableCell>
                        <TableCell>{getStatusChip(row.status)}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="primary"
                            onClick={() => handleDownloadPDF(row)}
                            title="Télécharger la facture"
                          >
                            <DownloadIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
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
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
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