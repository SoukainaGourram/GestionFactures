import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getFactures,
  addFacture,
  updateFacture,
  getClients,
  getArticles
} from '../../services/jsonService';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Stack,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

function FactureForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // Data Lists from API
  const [clients, setClients] = useState([]);
  const [articles, setArticles] = useState([]);
  
  // Loading and Notification
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  // Form Fields
  const [numero, setNumero] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateEcheance, setDateEcheance] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // default 30 days
  );
  const [selectedClientId, setSelectedClientId] = useState('');
  const [status, setStatus] = useState('en_attente');
  
  // Line Items
  const [items, setItems] = useState([
    { article_id: '', designation: '', prix_unitaire: 0, quantite: 1, total: 0 }
  ]);

  // Totals
  const [totalHt, setTotalHt] = useState(0);
  const tvaRate = 20; // 20% TVA
  const [totalTtc, setTotalTtc] = useState(0);

  // Load dependency data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [clientsRes, articlesRes] = await Promise.all([getClients(), getArticles()]);
        setClients(clientsRes.data);
        setArticles(articlesRes.data);

        if (isEdit) {
          // Fetch existing invoice to edit
          const facturesRes = await getFactures();
          const invoice = facturesRes.data.find(inv => inv.id.toString() === id);
          if (invoice) {
            setNumero(invoice.numero);
            setDate(invoice.date);
            setDateEcheance(invoice.date_echeance || '');
            setSelectedClientId(invoice.client_id);
            setStatus(invoice.status);
            setItems(invoice.items.map(item => ({ ...item })));
          } else {
            showNotification('Facture non trouvée.', 'error');
            navigate('/factures');
          }
        } else {
          // Auto generate next invoice number
          const facturesRes = await getFactures();
          const nextId = facturesRes.data.length + 1;
          const currentYear = new Date().getFullYear();
          setNumero(`FAC-${currentYear}-${String(nextId).padStart(4, '0')}`);
        }
      } catch (err) {
        showNotification('Erreur lors du chargement des données.', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, isEdit]);

  // Recalculate totals whenever items change
  useEffect(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.prix_unitaire * item.quantite), 0);
    setTotalHt(subtotal);
    const tax = subtotal * (tvaRate / 100);
    setTotalTtc(subtotal + tax);
  }, [items]);

  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setNotification({ ...notification, open: false });
  };

  // Item modifications
  const handleAddItem = () => {
    setItems([
      ...items,
      { article_id: '', designation: '', prix_unitaire: 0, quantite: 1, total: 0 }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      return showNotification('Une facture doit contenir au moins un article.', 'warning');
    }
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  const handleItemFieldChange = (index, field, value) => {
    const updated = [...items];
    const item = { ...updated[index] };

    if (field === 'article_id') {
      const selectedArticle = articles.find(art => String(art.id) === String(value));
      if (selectedArticle) {
        item.article_id = value;
        item.designation = selectedArticle.designation;
        item.prix_unitaire = selectedArticle.prix_unitaire;
      }
    } else if (field === 'quantite') {
      const qty = parseInt(value, 10);
      item.quantite = isNaN(qty) || qty < 1 ? 1 : qty;
    } else if (field === 'prix_unitaire') {
      const price = parseFloat(value);
      item.prix_unitaire = isNaN(price) || price < 0 ? 0 : price;
    }

    item.total = item.prix_unitaire * item.quantite;
    updated[index] = item;
    setItems(updated);
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClientId) {
      return showNotification('Veuillez sélectionner un client.', 'error');
    }
    if (items.some(item => !item.article_id)) {
      return showNotification('Veuillez sélectionner un article pour chaque ligne.', 'error');
    }

    const selectedClientObj = clients.find(c => String(c.id) === String(selectedClientId));

    const invoiceData = {
      numero,
      date,
      date_echeance: dateEcheance,
      client_id: selectedClientId,
      client_nom: selectedClientObj ? selectedClientObj.nom : 'Inconnu',
      status,
      items: items.map(it => ({
        article_id: it.article_id,
        designation: it.designation,
        prix_unitaire: it.prix_unitaire,
        quantite: it.quantite,
        total: it.total
      })),
      total_ht: totalHt,
      tva: tvaRate,
      total_ttc: totalTtc
    };

    try {
      setSaving(true);
      if (isEdit) {
        invoiceData.id = parseInt(id, 10);
        await updateFacture(id, invoiceData);
        showNotification('Facture mise à jour avec succès.');
      } else {
        await addFacture(invoiceData);
        showNotification('Facture créée avec succès.');
      }
      setTimeout(() => {
        navigate('/factures');
      }, 1000);
    } catch (err) {
      showNotification('Erreur lors de la sauvegarde de la facture.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={3} display="flex" alignItems="center" gap={1}>
        <IconButton onClick={() => navigate('/factures')} color="inherit">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="700">
          {isEdit ? 'Modifier la Facture' : 'Nouvelle Facture'}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Left Column - General Info */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={2}>Informations Générales</Typography>
                <Stack spacing={2.5}>
                  <TextField
                    label="Numéro de Facture"
                    required
                    fullWidth
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    InputProps={{ sx: { borderRadius: 2 } }}
                  />

                  <TextField
                    select
                    label="Client"
                    required
                    fullWidth
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    InputProps={{ sx: { borderRadius: 2 } }}
                  >
                    {clients.map(c => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.nom} ({c.codeClient || `CLI-${c.id}`})
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="Date d'émission"
                    type="date"
                    required
                    fullWidth
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ sx: { borderRadius: 2 } }}
                  />

                  <TextField
                    label="Date d'échéance"
                    type="date"
                    required
                    fullWidth
                    value={dateEcheance}
                    onChange={(e) => setDateEcheance(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ sx: { borderRadius: 2 } }}
                  />

                  <TextField
                    select
                    label="Statut"
                    required
                    fullWidth
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    InputProps={{ sx: { borderRadius: 2 } }}
                  >
                    <MenuItem value="en_attente">En attente</MenuItem>
                    <MenuItem value="payee">Payée</MenuItem>
                    <MenuItem value="refusee">Rejetée</MenuItem>
                  </TextField>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Line Items */}
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight="bold">Détails des Articles</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddItem}
                    sx={{ borderRadius: 2 }}
                    size="small"
                  >
                    Ajouter une Ligne
                  </Button>
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, mb: 3 }}>
                  <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Article</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>P.U (DH)</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Qté</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Total (DH)</TableCell>
                        <TableCell sx={{ width: '5%' }} align="center"></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <TextField
                              select
                              fullWidth
                              size="small"
                              value={item.article_id}
                              onChange={(e) => handleItemFieldChange(idx, 'article_id', e.target.value)}
                              InputProps={{ sx: { borderRadius: 1.5 } }}
                            >
                              {articles.map(art => (
                                <MenuItem key={art.id} value={art.id}>
                                  {art.designation}
                                </MenuItem>
                              ))}
                            </TextField>
                          </TableCell>
                          
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={item.prix_unitaire}
                              onChange={(e) => handleItemFieldChange(idx, 'prix_unitaire', e.target.value)}
                              InputProps={{ sx: { borderRadius: 1.5 } }}
                            />
                          </TableCell>
                          
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={item.quantite}
                              onChange={(e) => handleItemFieldChange(idx, 'quantite', e.target.value)}
                              inputProps={{ min: 1 }}
                              InputProps={{ sx: { borderRadius: 1.5 } }}
                            />
                          </TableCell>
                          
                          <TableCell fontWeight="bold">
                            {item.total.toLocaleString('fr-FR')} DH
                          </TableCell>
                          
                          <TableCell align="center">
                            <IconButton color="error" onClick={() => handleRemoveItem(idx)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider sx={{ my: 3 }} />

                {/* Totals Summary */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', pr: 2 }}>
                  <Stack spacing={1} sx={{ width: 250 }}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="text.secondary">Total HT :</Typography>
                      <Typography fontWeight="500">{totalHt.toLocaleString('fr-FR')} DH</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="text.secondary">TVA ({tvaRate}%) :</Typography>
                      <Typography fontWeight="500">{(totalHt * (tvaRate / 100)).toLocaleString('fr-FR')} DH</Typography>
                    </Box>
                    <Divider />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="subtitle1" fontWeight="bold">Total TTC :</Typography>
                      <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                        {totalTtc.toLocaleString('fr-FR')} DH
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </CardContent>
            </Card>

            {/* Actions Buttons */}
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate('/factures')}
                sx={{ borderRadius: 2, px: 3, py: 1 }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={saving}
                sx={{ borderRadius: 2, px: 3, py: 1 }}
              >
                {saving ? 'Enregistrement...' : 'Enregistrer la Facture'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>

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

export default FactureForm;