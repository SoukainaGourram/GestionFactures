import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getFactures, deleteFacture, updateFacture } from '../../services/jsonService';
import { generatePDF } from '../../utils/pdfGenerator';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Stack,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  MoreVert as MoreIcon,
  CheckCircle as CheckIcon,
  HourglassEmpty as PendingIcon,
  CancelOutlined as CancelIcon
} from '@mui/icons-material';

function FactureList() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tabVal, setTabVal] = useState('toutes');
  
  // Menu / Popover action state for status edit
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeInvoice, setActiveInvoice] = useState(null);
  
  // Notification State
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const isAdmin = userRole === 'admin';

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await getFactures();
      let data = res.data;
      
      // If role is client, filter invoices by client_id
      if (!isAdmin && currentUser && currentUser.clientId) {
        data = data.filter(inv => String(inv.client_id) === String(currentUser.clientId));
      }
      
      setInvoices(data);
    } catch (err) {
      showNotification('Erreur lors du chargement des factures.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [currentUser, userRole]);

  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setNotification({ ...notification, open: false });
  };

  const handleDelete = async (invoice) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la facture ${invoice.numero} ?`)) {
      try {
        await deleteFacture(invoice.id);
        showNotification('Facture supprimée.');
        loadInvoices();
      } catch (err) {
        showNotification('Erreur de suppression.', 'error');
      }
    }
  };

  const handleDownloadPDF = (invoice) => {
    try {
      generatePDF(invoice);
      showNotification('PDF généré et téléchargé.');
    } catch (e) {
      showNotification('Erreur lors de la génération du PDF.', 'error');
    }
  };

  // Status modification actions for admin
  const handleOpenStatusMenu = (event, invoice) => {
    setAnchorEl(event.currentTarget);
    setActiveInvoice(invoice);
  };

  const handleCloseStatusMenu = () => {
    setAnchorEl(null);
    setActiveInvoice(null);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!activeInvoice) return;
    try {
      const updatedInvoice = { ...activeInvoice, status: newStatus };
      await updateFacture(activeInvoice.id, updatedInvoice);
      showNotification(`Le statut de la facture ${activeInvoice.numero} est maintenant : ${newStatus === 'payee' ? 'Payée' : newStatus === 'en_attente' ? 'En attente' : 'Rejetée'}.`);
      handleCloseStatusMenu();
      loadInvoices();
    } catch (err) {
      showNotification('Erreur lors de la modification du statut.', 'error');
    }
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

  // Filter and search
  const handleTabChange = (event, newValue) => {
    setTabVal(newValue);
  };

  const filteredInvoices = invoices.filter(inv => {
    // Search filter
    const matchesSearch = 
      inv.numero.toLowerCase().includes(search.toLowerCase()) ||
      (inv.client_nom && inv.client_nom.toLowerCase().includes(search.toLowerCase()));

    // Tab filter
    if (tabVal === 'toutes') return matchesSearch;
    return matchesSearch && inv.status === tabVal;
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight="700">Factures</Typography>
          <Typography variant="body2" color="text.secondary">
            {isAdmin 
              ? 'Consultez, modifiez et créez les factures de l\'ensemble des clients.' 
              : 'Consultez et téléchargez vos factures de règlement.'}
          </Typography>
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/factures/new')}
            sx={{ borderRadius: 2 }}
          >
            Nouvelle Facture
          </Button>
        )}
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 3, bgcolor: 'white', overflow: 'hidden' }}>
        <Tabs
          value={tabVal}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: '1px solid #f1f5f9' }}
        >
          <Tab label="Toutes" value="toutes" sx={{ fontWeight: 'bold' }} />
          <Tab label="Payées" value="payee" sx={{ fontWeight: 'bold' }} />
          <Tab label="En Attente" value="en_attente" sx={{ fontWeight: 'bold' }} />
          <Tab label="Rejetées" value="refusee" sx={{ fontWeight: 'bold' }} />
        </Tabs>

        {/* Search Bar inside Paper for clean integration */}
        <Box p={2}>
          <TextField
            placeholder="Rechercher par numéro de facture ou client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              sx: { borderRadius: 2, bgcolor: '#f8fafc' }
            }}
          />
        </Box>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Numéro</TableCell>
                {isAdmin && <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>}
                <TableCell sx={{ fontWeight: 'bold' }}>Date d'émission</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date d'échéance</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Total TTC</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <TableRow key={inv.id} hover>
                    <TableCell fontWeight="bold">{inv.numero}</TableCell>
                    {isAdmin && <TableCell fontWeight="600">{inv.client_nom}</TableCell>}
                    <TableCell>{inv.date}</TableCell>
                    <TableCell>{inv.date_echeance || '-'}</TableCell>
                    <TableCell fontWeight="bold">{inv.total_ttc.toLocaleString('fr-FR')} DH</TableCell>
                    <TableCell>{getStatusChip(inv.status)}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton
                          color="primary"
                          onClick={() => handleDownloadPDF(inv)}
                          title="Télécharger PDF"
                        >
                          <DownloadIcon />
                        </IconButton>
                        
                        {isAdmin && (
                          <>
                            <IconButton
                              color="info"
                              onClick={() => navigate(`/factures/edit/${inv.id}`)}
                              title="Modifier la facture"
                            >
                              <EditIcon />
                            </IconButton>
                            
                            <IconButton
                              color="secondary"
                              onClick={(e) => handleOpenStatusMenu(e, inv)}
                              title="Changer le statut"
                            >
                              <MoreIcon />
                            </IconButton>
                            
                            <IconButton
                              color="error"
                              onClick={() => handleDelete(inv)}
                              title="Supprimer la facture"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} align="center" sx={{ py: 3 }}>
                    Aucune facture trouvée.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Admin Status Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseStatusMenu}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 150 } }}
      >
        <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', fontWeight: 'bold', color: 'text.secondary' }}>
          Modifier Statut
        </Typography>
        <MenuItem onClick={() => handleUpdateStatus('payee')} sx={{ color: 'success.main', fontWeight: 500 }}>
          <CheckIcon sx={{ mr: 1.5, fontSize: 20 }} /> Payée
        </MenuItem>
        <MenuItem onClick={() => handleUpdateStatus('en_attente')} sx={{ color: 'warning.main', fontWeight: 500 }}>
          <PendingIcon sx={{ mr: 1.5, fontSize: 20 }} /> En attente
        </MenuItem>
        <MenuItem onClick={() => handleUpdateStatus('refusee')} sx={{ color: 'error.main', fontWeight: 500 }}>
          <CancelIcon sx={{ mr: 1.5, fontSize: 20 }} /> Rejetée
        </MenuItem>
      </Menu>

      {/* Snackbar notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={notification.severity} sx={{ width: '100%', borderRadius: 2 }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default FactureList;