import React, { useState, useEffect } from 'react';
import {
  getCategories,
  addCategorie,
  updateCategorie,
  deleteCategorie
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

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog State
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Form fields
  const [formData, setFormData] = useState({
    nom: ''
  });

  // Notification State
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const loadData = async () => {
    try {
      setLoading(true);
      const catRes = await getCategories();
      setCategories(catRes.data);
    } catch (err) {
      showNotification('Erreur lors du chargement des catégories.', 'error');
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
    setIsEdit(false);
    setFormData({ nom: '' });
    setOpen(true);
  };

  const handleOpenEdit = (category) => {
    setIsEdit(true);
    setSelectedCategory(category);
    setFormData({ nom: category.nom });
    setOpen(true);
  };

  const handleDelete = async (category) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.nom}" ?`)) {
      try {
        await deleteCategorie(category.id);
        showNotification('Catégorie supprimée.');
        loadData();
      } catch (err) {
        showNotification('Erreur de suppression. Il se peut que des articles y soient liés.', 'error');
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nom) {
      return showNotification('Le nom de la catégorie est requis.', 'error');
    }

    const payload = { nom: formData.nom };

    try {
      if (isEdit) {
        await updateCategorie(selectedCategory.id, payload);
        showNotification('Catégorie mise à jour.');
      } else {
        await addCategorie(payload);
        showNotification('Catégorie créée.');
      }
      setOpen(false);
      loadData();
    } catch (err) {
      showNotification('Erreur lors de l\'enregistrement.', 'error');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight="700">Catégories</Typography>
          <Typography variant="body2" color="text.secondary">
            Gérez les catégories d'articles pour organiser votre catalogue de facturation.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd} sx={{ borderRadius: 2 }}>
          Nouvelle Catégorie
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden', maxWidth: 600 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '60%' }}>Nom de la Catégorie</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '20%' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <TableRow key={cat.id} hover>
                    <TableCell fontWeight="600">{cat.id}</TableCell>
                    <TableCell fontWeight="bold">{cat.nom}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton color="primary" onClick={() => handleOpenEdit(cat)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(cat)}>
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                    Aucune catégorie enregistrée.
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
            {isEdit ? 'Modifier la Catégorie' : 'Ajouter une Catégorie'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Nom de la catégorie"
                required
                fullWidth
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                InputProps={{ sx: { borderRadius: 2 } }}
              />
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

export default Categories;