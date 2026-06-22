import React, { useState, useEffect } from 'react';
import {
  getArticles,
  addArticle,
  updateArticle,
  deleteArticle,
  getCategories
} from '../../services/jsonService';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Stack,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

function Articles() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog State
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  
  // Form fields
  const [formData, setFormData] = useState({
    designation: '',
    prix_unitaire: '',
    categorie_id: ''
  });

  // Notification State
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [artRes, catRes] = await Promise.all([getArticles(), getCategories()]);
      setArticles(artRes.data);
      setCategories(catRes.data);
    } catch (err) {
      showNotification('Erreur lors du chargement des données.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setNotification({ ...notification, open: false });
  };

  const handleOpenAdd = () => {
    if (categories.length === 0) {
      return showNotification('Veuillez d\'abord créer au moins une catégorie.', 'warning');
    }
    setIsEdit(false);
    setFormData({
      designation: '',
      prix_unitaire: '',
      categorie_id: categories[0].id
    });
    setOpen(true);
  };

  const handleOpenEdit = (article) => {
    setIsEdit(true);
    setSelectedArticle(article);
    setFormData({
      designation: article.designation,
      prix_unitaire: article.prix_unitaire,
      categorie_id: article.categorie_id
    });
    setOpen(true);
  };

  const handleDelete = async (article) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'article "${article.designation}" ?`)) {
      try {
        await deleteArticle(article.id);
        showNotification('Article supprimé.');
        loadData();
      } catch (err) {
        showNotification('Erreur de suppression.', 'error');
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const price = parseFloat(formData.prix_unitaire);
    if (!formData.designation || isNaN(price) || price < 0 || !formData.categorie_id) {
      return showNotification('Veuillez remplir tous les champs correctement.', 'error');
    }

    const payload = {
      designation: formData.designation,
      prix_unitaire: price,
      categorie_id: isNaN(Number(formData.categorie_id)) ? formData.categorie_id : Number(formData.categorie_id)
    };

    try {
      if (isEdit) {
        await updateArticle(selectedArticle.id, payload);
        showNotification('Article mis à jour.');
      } else {
        await addArticle(payload);
        showNotification('Article créé.');
      }
      setOpen(false);
      loadData();
    } catch (err) {
      showNotification('Erreur lors de l\'enregistrement.', 'error');
    }
  };

  const getCategoryName = (catId) => {
    const category = categories.find(c => String(c.id) === String(catId));
    return category ? category.nom : 'Non catégorisé';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight="700">Articles</Typography>
          <Typography variant="body2" color="text.secondary">
            Gérez le catalogue des articles et services disponibles pour la facturation.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd} sx={{ borderRadius: 2 }}>
          Nouvel Article
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Désignation</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Catégorie</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Prix Unitaire</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {articles.length > 0 ? (
                articles.map((art) => (
                  <TableRow key={art.id} hover>
                    <TableCell fontWeight="600">{art.id}</TableCell>
                    <TableCell fontWeight="bold">{art.designation}</TableCell>
                    <TableCell>{getCategoryName(art.categorie_id)}</TableCell>
                    <TableCell fontWeight="600" color="primary.main">
                      {art.prix_unitaire.toLocaleString('fr-FR')} DH
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton color="primary" onClick={() => handleOpenEdit(art)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(art)}>
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    Aucun article dans le catalogue.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <form onSubmit={handleFormSubmit}>
          <DialogTitle fontWeight="bold">
            {isEdit ? 'Modifier l\'Article' : 'Ajouter un Article'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                label="Désignation de l'article"
                required
                fullWidth
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                InputProps={{ sx: { borderRadius: 2 } }}
              />

              <TextField
                label="Prix Unitaire (DH)"
                type="number"
                required
                fullWidth
                value={formData.prix_unitaire}
                onChange={(e) => setFormData({ ...formData, prix_unitaire: e.target.value })}
                inputProps={{ min: 0, step: 'any' }}
                InputProps={{ sx: { borderRadius: 2 } }}
              />

              <TextField
                select
                label="Catégorie"
                required
                fullWidth
                value={formData.categorie_id}
                onChange={(e) => setFormData({ ...formData, categorie_id: e.target.value })}
                InputProps={{ sx: { borderRadius: 2 } }}
              >
                {categories.map(c => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.nom}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpen(false)} variant="outlined" color="inherit" sx={{ borderRadius: 2 }}>
              Annuler
            </Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: 2 }}>
              Enregistrer
            </Button>
          </DialogActions>
        </form>
      </Dialog>

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

export default Articles;