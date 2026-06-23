import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getFactures,
  addFacture,
  updateFacture,
  getClients,
  getArticles,
  addNotification
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
  ArrowBack as ArrowBackIcon,
  Clear as ClearIcon,
  Gesture as SignatureIcon
} from '@mui/icons-material';

const COMPANIES = [
  "FactureFlow Inc. (Tech)",
  "Global Services S.A.",
  "Tech Solutions SARL"
];

const CURRENCIES = [
  { value: 'MAD', label: 'MAD (DH)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'USD', label: 'USD ($)' }
];

const BILLING_METHODS = [
  { value: 'simple', label: 'Méthode 1 : Simple HT + TVA (20%)' },
  { value: 'remise_ligne', label: 'Méthode 2 : Remise par ligne' },
  { value: 'remise_globale', label: 'Méthode 3 : Remise globale' },
  { value: 'par_categorie', label: 'Méthode 4 : TVA par catégorie' }
];

const VIREMENT_TYPES = [
  "Virement Bancaire",
  "Chèque",
  "Espèces",
  "Carte Bancaire"
];

function FactureForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser, userRole } = useAuth();
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
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [selectedClientId, setSelectedClientId] = useState('');
  const [status, setStatus] = useState('en_attente');
  
  // New Fields (Cahier des charges)
  const [billingMethod, setBillingMethod] = useState('simple');
  const [companyName, setCompanyName] = useState(COMPANIES[0]);
  const [currency, setCurrency] = useState('MAD');
  const [typeVirement, setTypeVirement] = useState(VIREMENT_TYPES[0]);
  const [dateDepot, setDateDepot] = useState(new Date().toISOString().split('T')[0]);
  const [dateEncaissement, setDateEncaissement] = useState('');
  const [remiseGlobale, setRemiseGlobale] = useState(0);

  // Signature Pad state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [existingSignature, setExistingSignature] = useState('');
  const [showCanvas, setShowCanvas] = useState(true);

  // Line Items
  const [items, setItems] = useState([
    { article_id: '', designation: '', prix_unitaire: 0, quantite: 1, remise: 0, categorie_id: '', total: 0 }
  ]);

  // Totals
  const [totalHt, setTotalHt] = useState(0);
  const [totalTtc, setTotalTtc] = useState(0);
  const [calculatedTva, setCalculatedTva] = useState(0);

  const currencySymbol = currency === 'MAD' ? 'DH' : currency === 'EUR' ? '€' : '$';

  // Load dependency data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [clientsRes, articlesRes] = await Promise.all([getClients(), getArticles()]);
        setClients(clientsRes.data || []);
        setArticles(articlesRes.data || []);

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
            setBillingMethod(invoice.billing_method || 'simple');
            setCompanyName(invoice.company_name || COMPANIES[0]);
            setCurrency(invoice.currency || 'MAD');
            setTypeVirement(invoice.type_virement || VIREMENT_TYPES[0]);
            setDateDepot(invoice.date_depot || '');
            setDateEncaissement(invoice.date_encaissement || '');
            setRemiseGlobale(invoice.remise_globale || 0);
            
            if (invoice.signature_data) {
              setExistingSignature(invoice.signature_data);
              setShowCanvas(false);
            }

            setItems(invoice.items.map(item => ({ 
              ...item,
              remise: item.remise || 0,
              categorie_id: item.categorie_id || ''
            })));
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

  // Helper for Category based TVA
  const getTvaRateForCategory = (catId) => {
    switch (Number(catId)) {
      case 1: return 20; // Informatique
      case 2: return 10; // Services
      case 3: return 0;  // Formation
      default: return 20;
    }
  };

  // Recalculate totals whenever items, method, or global discount changes
  useEffect(() => {
    let ht = 0;
    let tva = 0;

    if (billingMethod === 'simple') {
      ht = items.reduce((sum, item) => sum + (item.prix_unitaire * item.quantite), 0);
      tva = ht * 0.20;
      setTotalHt(ht);
      setCalculatedTva(tva);
      setTotalTtc(ht + tva);
    } 
    else if (billingMethod === 'remise_ligne') {
      ht = items.reduce((sum, item) => {
        const lineVal = item.prix_unitaire * item.quantite;
        const discount = lineVal * ((item.remise || 0) / 100);
        return sum + (lineVal - discount);
      }, 0);
      tva = ht * 0.20;
      setTotalHt(ht);
      setCalculatedTva(tva);
      setTotalTtc(ht + tva);
    } 
    else if (billingMethod === 'remise_globale') {
      const originalHt = items.reduce((sum, item) => sum + (item.prix_unitaire * item.quantite), 0);
      const discount = originalHt * (remiseGlobale / 100);
      const netHt = originalHt - discount;
      tva = netHt * 0.20;
      setTotalHt(netHt); // Total HT is the net HT
      setCalculatedTva(tva);
      setTotalTtc(netHt + tva);
    } 
    else if (billingMethod === 'par_categorie') {
      let totalHtAccum = 0;
      let totalTvaAccum = 0;
      items.forEach(item => {
        const lineHt = item.prix_unitaire * item.quantite;
        const tvaRate = getTvaRateForCategory(item.categorie_id);
        const lineTva = lineHt * (tvaRate / 100);
        totalHtAccum += lineHt;
        totalTvaAccum += lineTva;
      });
      setTotalHt(totalHtAccum);
      setCalculatedTva(totalTvaAccum);
      setTotalTtc(totalHtAccum + totalTvaAccum);
    }
  }, [items, billingMethod, remiseGlobale]);

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
      { article_id: '', designation: '', prix_unitaire: 0, quantite: 1, remise: 0, categorie_id: '', total: 0 }
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
        item.categorie_id = selectedArticle.categorie_id || '';
      }
    } else if (field === 'quantite') {
      const qty = parseInt(value, 10);
      item.quantite = isNaN(qty) || qty < 1 ? 1 : qty;
    } else if (field === 'prix_unitaire') {
      const price = parseFloat(value);
      item.prix_unitaire = isNaN(price) || price < 0 ? 0 : price;
    } else if (field === 'remise') {
      const disc = parseFloat(value);
      item.remise = isNaN(disc) || disc < 0 ? 0 : disc > 100 ? 100 : disc;
    }

    // Line total calculation depends on billing method
    const baseTotal = item.prix_unitaire * item.quantite;
    if (billingMethod === 'remise_ligne') {
      item.total = baseTotal * (1 - (item.remise || 0) / 100);
    } else {
      item.total = baseTotal;
    }
    
    updated[index] = item;
    setItems(updated);
  };

  // Signature Drawing Events
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a'; // dark slate
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
    
    if (e.touches) {
      e.preventDefault();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
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

    // Convert signature drawing to base64
    let signatureBase64 = existingSignature;
    if (showCanvas && hasSignature && canvasRef.current) {
      signatureBase64 = canvasRef.current.toDataURL('image/png');
    }

    const invoiceData = {
      numero,
      date,
      date_echeance: dateEcheance,
      client_id: selectedClientId,
      client_nom: selectedClientObj ? selectedClientObj.nom : 'Inconnu',
      status,
      billing_method: billingMethod,
      company_name: companyName,
      currency,
      type_virement: typeVirement,
      date_depot: dateDepot,
      date_encaissement: dateEncaissement,
      remise_globale: remiseGlobale,
      signature_data: signatureBase64,
      validated_by_admin: status === 'payee' ? true : false,
      items: items.map(it => ({
        article_id: it.article_id,
        designation: it.designation,
        prix_unitaire: it.prix_unitaire,
        quantite: it.quantite,
        remise: it.remise || 0,
        categorie_id: it.categorie_id || '',
        total: it.total
      })),
      total_ht: totalHt,
      tva: calculatedTva, // Store total calculated TVA value
      total_ttc: totalTtc
    };

    try {
      setSaving(true);
      if (isEdit) {
        invoiceData.id = Number(id);
        await updateFacture(id, invoiceData);
        
        // Log notification
        await addNotification({
          message: `Facture ${numero} mise à jour par ${currentUser.name} (Statut: ${status === 'payee' ? 'Validée/Payée' : status === 'refusee' ? 'Rejetée' : 'En attente'}).`,
          type: status === 'payee' ? 'validation' : status === 'refusee' ? 'rejet' : 'modification',
          date: new Date().toISOString()
        });

        showNotification('Facture mise à jour avec succès.');
      } else {
        await addFacture(invoiceData);
        
        // Log notification
        await addNotification({
          message: `Nouvelle facture ${numero} créée par ${currentUser.name} pour le client ${invoiceData.client_nom}.`,
          type: 'creation',
          date: new Date().toISOString()
        });

        showNotification('Facture créée avec succès.');
      }

      // Simulate email alert in case of admin validation
      if (status === 'payee' && userRole === 'admin') {
        alert(`[Notification Workflow] Un e-mail contenant le PDF de facturation a été envoyé directement au client ${invoiceData.client_nom} (${selectedClientObj?.email || 'client@test.com'}).`);
      }

      setTimeout(() => {
        navigate('/factures');
      }, 1500);
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
        <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.5px' }}>
          {isEdit ? 'Modifier la Facture' : 'Créer une Facture'}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Left Column - General Info */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              <Card sx={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" mb={2.5}>Informations Générales</Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Société Émettrice"
                      select
                      required
                      fullWidth
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      InputProps={{ sx: { borderRadius: '12px' } }}
                    >
                      {COMPANIES.map(company => (
                        <MenuItem key={company} value={company}>{company}</MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      label="Numéro de Facture"
                      required
                      fullWidth
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      InputProps={{ sx: { borderRadius: '12px' } }}
                    />

                    <TextField
                      select
                      label="Client Destinataire"
                      required
                      fullWidth
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      InputProps={{ sx: { borderRadius: '12px' } }}
                    >
                      {clients.map(c => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.nom} ({c.codeClient || `CLI-${c.id}`})
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      select
                      label="Devise"
                      required
                      fullWidth
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      InputProps={{ sx: { borderRadius: '12px' } }}
                    >
                      {CURRENCIES.map(curr => (
                        <MenuItem key={curr.value} value={curr.value}>{curr.label}</MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      select
                      label="Méthode de Calcul"
                      required
                      fullWidth
                      value={billingMethod}
                      onChange={(e) => setBillingMethod(e.target.value)}
                      InputProps={{ sx: { borderRadius: '12px' } }}
                    >
                      {BILLING_METHODS.map(method => (
                        <MenuItem key={method.value} value={method.value}>{method.label}</MenuItem>
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
                      InputProps={{ sx: { borderRadius: '12px' } }}
                    />

                    <TextField
                      label="Date d'échéance"
                      type="date"
                      required
                      fullWidth
                      value={dateEcheance}
                      onChange={(e) => setDateEcheance(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ sx: { borderRadius: '12px' } }}
                    />
                  </Stack>
                </CardContent>
              </Card>

              {/* Payment Follow-up Card */}
              <Card sx={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" mb={2.5}>Suivi des Paiements</Typography>
                  <Stack spacing={2}>
                    <TextField
                      select
                      label="Type de Règlement"
                      required
                      fullWidth
                      value={typeVirement}
                      onChange={(e) => setTypeVirement(e.target.value)}
                      InputProps={{ sx: { borderRadius: '12px' } }}
                    >
                      {VIREMENT_TYPES.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      label="Date de Dépôt"
                      type="date"
                      fullWidth
                      value={dateDepot}
                      onChange={(e) => setDateDepot(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ sx: { borderRadius: '12px' } }}
                    />

                    <TextField
                      label="Date d'Encaissement"
                      type="date"
                      fullWidth
                      value={dateEncaissement}
                      onChange={(e) => setDateEncaissement(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ sx: { borderRadius: '12px' } }}
                      helperText="Date réelle de réception des fonds"
                    />

                    <TextField
                      select
                      label="Statut Facture"
                      required
                      fullWidth
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      InputProps={{ sx: { borderRadius: '12px' } }}
                    >
                      <MenuItem value="en_attente">En attente (Encours)</MenuItem>
                      <MenuItem value="payee">Payée (Validée)</MenuItem>
                      <MenuItem value="refusee">Rejetée (Annulée)</MenuItem>
                    </TextField>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* Right Column - Line Items & Signature */}
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              <Card sx={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight="bold">Détails des Articles</Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleAddItem}
                      sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 'bold' }}
                      size="small"
                    >
                      Ajouter une Ligne
                    </Button>
                  </Box>

                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: '12px', mb: 3 }}>
                    <Table>
                      <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', width: '35%', color: '#475569' }}>Article</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', width: '20%', color: '#475569' }}>P.U ({currencySymbol})</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', width: '15%', color: '#475569' }}>Qté</TableCell>
                          {billingMethod === 'remise_ligne' && (
                            <TableCell sx={{ fontWeight: 'bold', width: '15%', color: '#475569' }}>Remise (%)</TableCell>
                          )}
                          <TableCell sx={{ fontWeight: 'bold', width: '20%', color: '#475569' }}>Total ({currencySymbol})</TableCell>
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
                                InputProps={{ sx: { borderRadius: '8px' } }}
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
                                InputProps={{ sx: { borderRadius: '8px' } }}
                              />
                            </TableCell>
                            
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                value={item.quantite}
                                onChange={(e) => handleItemFieldChange(idx, 'quantite', e.target.value)}
                                inputProps={{ min: 1 }}
                                InputProps={{ sx: { borderRadius: '8px' } }}
                              />
                            </TableCell>

                            {billingMethod === 'remise_ligne' && (
                              <TableCell>
                                <TextField
                                  type="number"
                                  size="small"
                                  value={item.remise || 0}
                                  onChange={(e) => handleItemFieldChange(idx, 'remise', e.target.value)}
                                  inputProps={{ min: 0, max: 100 }}
                                  InputProps={{ sx: { borderRadius: '8px' } }}
                                />
                              </TableCell>
                            )}
                            
                            <TableCell fontWeight="bold">
                              {item.total.toLocaleString('fr-FR')} {currencySymbol}
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

                  {billingMethod === 'remise_globale' && (
                    <Box display="flex" justifyContent="flex-end" mb={3} pr={2}>
                      <TextField
                        label="Remise Globale (%)"
                        type="number"
                        size="small"
                        value={remiseGlobale}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setRemiseGlobale(isNaN(val) || val < 0 ? 0 : val > 100 ? 100 : val);
                        }}
                        InputProps={{ sx: { borderRadius: '8px', width: 200 } }}
                      />
                    </Box>
                  )}

                  <Divider sx={{ my: 3 }} />

                  {/* Totals Summary */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', pr: 2 }}>
                    <Stack spacing={1.2} sx={{ width: 280 }}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="text.secondary" variant="body2">Total HT brut :</Typography>
                        <Typography fontWeight="500" variant="body2">
                          {items.reduce((sum, item) => sum + (item.prix_unitaire * item.quantite), 0).toLocaleString('fr-FR')} {currencySymbol}
                        </Typography>
                      </Box>
                      {billingMethod === 'remise_globale' && (
                        <Box display="flex" justifyContent="space-between" color="error.main">
                          <Typography variant="body2">Remise Globale ({remiseGlobale}%) :</Typography>
                          <Typography variant="body2" fontWeight="500">
                            -{(items.reduce((sum, item) => sum + (item.prix_unitaire * item.quantite), 0) * (remiseGlobale / 100)).toLocaleString('fr-FR')} {currencySymbol}
                          </Typography>
                        </Box>
                      )}
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="text.secondary" variant="body2">Total HT net :</Typography>
                        <Typography fontWeight="600" variant="body2">{totalHt.toLocaleString('fr-FR')} {currencySymbol}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="text.secondary" variant="body2">
                          {billingMethod === 'par_categorie' ? 'TVA cumulée :' : 'TVA (20%) :'}
                        </Typography>
                        <Typography fontWeight="500" variant="body2">{calculatedTva.toLocaleString('fr-FR')} {currencySymbol}</Typography>
                      </Box>
                      <Divider />
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="subtitle1" fontWeight="bold">Total TTC :</Typography>
                        <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                          {totalTtc.toLocaleString('fr-FR')} {currencySymbol}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>

              {/* Digital Signature Drawing Canvas */}
              <Card sx={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" mb={1}>
                    Signature Électronique
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                    Veuillez apposer votre signature numérique ci-dessous pour certifier la facture.
                  </Typography>

                  {existingSignature && !showCanvas ? (
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                      <Box component="img" src={existingSignature} alt="Signature existante" sx={{ maxHeight: 120, maxWidth: '100%', objectFit: 'contain' }} />
                      <Box mt={1.5}>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          startIcon={<SignatureIcon />}
                          onClick={() => setShowCanvas(true)}
                          sx={{ borderRadius: '8px', textTransform: 'none' }}
                        >
                          Dessiner une nouvelle signature
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box>
                      <Box 
                        sx={{ 
                          border: '1px dashed #cbd5e1', 
                          borderRadius: '12px', 
                          overflow: 'hidden', 
                          bgcolor: '#f8fafc',
                          position: 'relative'
                        }}
                      >
                        <canvas
                          ref={canvasRef}
                          width={500}
                          height={150}
                          style={{ width: '100%', height: '150px', cursor: 'crosshair', display: 'block' }}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                        />
                      </Box>
                      <Stack direction="row" spacing={2} sx={{ mt: 2 }} justifyContent="flex-end">
                        {existingSignature && (
                          <Button 
                            variant="text" 
                            color="inherit" 
                            onClick={() => setShowCanvas(false)}
                            sx={{ borderRadius: '8px', textTransform: 'none' }}
                          >
                            Annuler et garder l'ancienne
                          </Button>
                        )}
                        <Button 
                          variant="outlined" 
                          color="error" 
                          size="small"
                          startIcon={<ClearIcon />}
                          onClick={clearSignature}
                          sx={{ borderRadius: '8px', textTransform: 'none' }}
                        >
                          Effacer le dessin
                        </Button>
                      </Stack>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Actions Buttons */}
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => navigate('/factures')}
                  sx={{ borderRadius: '12px', px: 3, py: 1.2, textTransform: 'none', fontWeight: 'bold' }}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={saving}
                  sx={{ 
                    borderRadius: '12px', 
                    px: 3, 
                    py: 1.2, 
                    textTransform: 'none', 
                    fontWeight: 'bold',
                    bgcolor: '#2563eb',
                    '&:hover': { bgcolor: '#1d4ed8' }
                  }}
                >
                  {saving ? 'Enregistrement...' : isEdit ? 'Mettre à jour la Facture' : 'Enregistrer la Facture'}
                </Button>
              </Box>
            </Stack>
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
        <Alert onClose={handleCloseSnackbar} severity={notification.severity} sx={{ width: '100%', borderRadius: '8px' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default FactureForm;