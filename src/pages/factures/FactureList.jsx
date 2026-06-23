import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getFactures, deleteFacture, updateFacture, addNotification } from '../../services/jsonService';
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
  Alert,
  Grid
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
  CancelOutlined as CancelIcon,
  FileDownload as ExportIcon
} from '@mui/icons-material';

function FactureList() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tabVal, setTabVal] = useState('toutes');
  const [selectedYear, setSelectedYear] = useState('toutes');
  
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
      let data = res.data || [];
      
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
        
        // Log notification
        await addNotification({
          message: `Facture ${invoice.numero} supprimée par ${currentUser.name}.`,
          type: 'suppression',
          date: new Date().toISOString()
        });

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
      console.error(e);
      showNotification('Erreur lors de la génération du PDF.', 'error');
    }
  };

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
      const updatedInvoice = { 
        ...activeInvoice, 
        status: newStatus,
        validated_by_admin: newStatus === 'payee' ? true : false,
        date_encaissement: newStatus === 'payee' ? new Date().toISOString().split('T')[0] : activeInvoice.date_encaissement
      };
      await updateFacture(activeInvoice.id, updatedInvoice);
      
      // Log notification
      await addNotification({
        message: `La facture ${activeInvoice.numero} a été ${newStatus === 'payee' ? 'validée (Payée)' : newStatus === 'refusee' ? 'rejetée' : 'remise en attente'} par l'Administrateur.`,
        type: newStatus === 'payee' ? 'validation' : newStatus === 'refusee' ? 'rejet' : 'modification',
        date: new Date().toISOString()
      });

      showNotification(`Le statut de la facture ${activeInvoice.numero} a été modifié.`);
      
      // Simulate email alert in case of admin validation
      if (newStatus === 'payee') {
        alert(`[Notification Workflow] Un e-mail contenant le PDF de facturation a été envoyé directement au client ${activeInvoice.client_nom}.`);
      }

      handleCloseStatusMenu();
      loadInvoices();
    } catch (err) {
      showNotification('Erreur lors de la modification du statut.', 'error');
    }
  };

  // Export CSV (Excel)
  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      return showNotification('Aucune facture à exporter.', 'warning');
    }

    const headers = [
      'Numero', 'Client', 'Societe Emettrice', 'Date Emission', 
      'Echeance', 'Total HT', 'TVA', 'Total TTC', 
      'Statut', 'Devise', 'Reglement', 'Date Depot', 'Date Encaissement'
    ];

    const csvRows = [
      headers.join(';'), // Semicolon separator for Excel French compatibility
      ...filteredInvoices.map(inv => [
        inv.numero,
        `"${(inv.client_nom || '').replace(/"/g, '""')}"`,
        `"${(inv.company_name || '').replace(/"/g, '""')}"`,
        inv.date || '',
        inv.date_echeance || '',
        inv.total_ht || 0,
        inv.tva || 0,
        inv.total_ttc || 0,
        inv.status || '',
        inv.currency || 'MAD',
        inv.type_virement || '',
        inv.date_depot || '',
        inv.date_encaissement || ''
      ].join(';'))
    ];

    const csvContent = '\uFEFF' + csvRows.join('\n'); // Add UTF-8 BOM for Excel formatting
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Export_Factures_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Export CSV (Excel) généré avec succès.');
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

  const getCurrencySymbol = (curr) => {
    return curr === 'MAD' ? 'DH' : curr === 'EUR' ? '€' : '$';
  };

  // Filter, search and annual archive
  const handleTabChange = (event, newValue) => {
    setTabVal(newValue);
  };

  const filteredInvoices = invoices.filter(inv => {
    // Search filter
    const matchesSearch = 
      inv.numero.toLowerCase().includes(search.toLowerCase()) ||
      (inv.client_nom && inv.client_nom.toLowerCase().includes(search.toLowerCase()));

    // Tab filter
    const matchesTab = tabVal === 'toutes' ? true : inv.status === tabVal;

    // Year filter (Annual Archiving)
    let matchesYear = true;
    if (selectedYear !== 'toutes') {
      const invYear = inv.date ? new Date(inv.date).getFullYear().toString() : '';
      matchesYear = invYear === selectedYear;
    }

    return matchesSearch && matchesTab && matchesYear;
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.5px' }}>Factures</Typography>
          <Typography variant="body2" color="text.secondary">
            {isAdmin 
              ? 'Consultez, gérez, validez et exportez les factures de l\'ensemble des clients.' 
              : 'Consultez et téléchargez vos factures de règlement.'}
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportCSV}
            sx={{ borderRadius: '12px', py: 1.2, px: 2, textTransform: 'none', fontWeight: 'bold', borderColor: '#cbd5e1', color: '#475569' }}
          >
            Exporter Excel (CSV)
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/factures/new')}
            sx={{ borderRadius: '12px', py: 1.2, px: 2.5, textTransform: 'none', fontWeight: 'bold', bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
          >
            Nouvelle Facture
          </Button>
        </Stack>
      </Box>

      {/* Tabs & Filters */}
      <Paper sx={{ mb: 3, borderRadius: '16px', bgcolor: 'white', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <Tabs
          value={tabVal}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: '1px solid #f1f5f9' }}
        >
          <Tab label="Toutes" value="toutes" sx={{ fontWeight: 'bold', textTransform: 'none' }} />
          <Tab label="Payées" value="payee" sx={{ fontWeight: 'bold', textTransform: 'none' }} />
          <Tab label="En Attente" value="en_attente" sx={{ fontWeight: 'bold', textTransform: 'none' }} />
          <Tab label="Rejetées" value="refusee" sx={{ fontWeight: 'bold', textTransform: 'none' }} />
        </Tabs>

        {/* Search Bar & Annual Archiving filter */}
        <Box p={2.5}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                placeholder="Rechercher par numéro de facture ou client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '12px', bgcolor: '#f8fafc' }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Archivage Annuel"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                fullWidth
                size="small"
                InputProps={{ sx: { borderRadius: '12px', bgcolor: '#f8fafc' } }}
              >
                <MenuItem value="toutes">Toutes les années</MenuItem>
                <MenuItem value="2026">Exercice 2026</MenuItem>
                <MenuItem value="2025">Exercice 2025</MenuItem>
                <MenuItem value="2024">Exercice 2024</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Numéro</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Émetteur (Société)</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Date d'émission</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Total TTC</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Statut</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <TableRow key={inv.id} hover>
                    <TableCell fontWeight="bold">{inv.numero}</TableCell>
                    <TableCell fontSize="0.85rem" color="text.secondary">{inv.company_name || 'FactureFlow'}</TableCell>
                    <TableCell fontWeight="600">{inv.client_nom}</TableCell>
                    <TableCell>{inv.date}</TableCell>
                    <TableCell fontWeight="bold" color="primary.main">
                      {inv.total_ttc.toLocaleString('fr-FR')} {getCurrencySymbol(inv.currency)}
                    </TableCell>
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
                        {!isAdmin && (
                          <IconButton
                            color="info"
                            onClick={() => navigate(`/factures/edit/${inv.id}`)}
                            title="Modifier / Compléter"
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    Aucune facture trouvée pour ces critères.
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
        PaperProps={{ sx: { borderRadius: '12px', minWidth: 160 } }}
      >
        <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', fontWeight: 'bold', color: 'text.secondary' }}>
          Modifier Statut (Validation)
        </Typography>
        <MenuItem onClick={() => handleUpdateStatus('payee')} sx={{ color: 'success.main', fontWeight: 500 }}>
          <CheckIcon sx={{ mr: 1.5, fontSize: 20 }} /> Valider (Payée)
        </MenuItem>
        <MenuItem onClick={() => handleUpdateStatus('en_attente')} sx={{ color: 'warning.main', fontWeight: 500 }}>
          <PendingIcon sx={{ mr: 1.5, fontSize: 20 }} /> Remettre en attente
        </MenuItem>
        <MenuItem onClick={() => handleUpdateStatus('refusee')} sx={{ color: 'error.main', fontWeight: 500 }}>
          <CancelIcon sx={{ mr: 1.5, fontSize: 20 }} /> Rejeter (Annulée)
        </MenuItem>
      </Menu>

      {/* Snackbar notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={notification.severity} sx={{ width: '100%', borderRadius: '8px' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default FactureList;