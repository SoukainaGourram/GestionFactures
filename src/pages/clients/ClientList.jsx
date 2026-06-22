import React, { useState, useEffect } from 'react';
import { getClients, addClient, updateClient, deleteClient, getUsers, addUser, deleteUser } from '../../services/jsonService';
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
  InputAdornment,
  CircularProgress,
  Stack,
  Alert,
  Snackbar,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

function ClientList() {
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Dialog State
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    password: 'client123' // default password for mock login
  });
  
  // Notification State
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [cliRes, userRes] = await Promise.all([
        getClients(),
        getUsers().catch(err => {
          console.warn("[Users API] Endpoint /users non accessible. Fonctionnement en mode dégradé sans synchro de login.", err);
          return { data: [] }; // Return empty data on failure
        })
      ]);
      setClients(cliRes.data || []);
      setUsers(userRes.data || []);
    } catch (err) {
      showNotification('Erreur de chargement des données.', 'error');
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
    setFormData({
      nom: '',
      email: '',
      telephone: '',
      adresse: '',
      password: 'client123'
    });
    setOpen(true);
  };

  const handleOpenEdit = (client) => {
    setIsEdit(true);
    setSelectedClient(client);
    
    // Find matching user password if exists
    const matchingUser = users.find(u => String(u.clientId) === String(client.id));
    
    setFormData({
      nom: client.nom,
      email: client.email,
      telephone: client.telephone || '',
      adresse: client.adresse || '',
      password: matchingUser ? matchingUser.password : 'client123'
    });
    setOpen(true);
  };

  const handleDelete = async (client) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le client ${client.nom} ? Ses identifiants de connexion seront également supprimés.`)) {
      try {
        await deleteClient(client.id);
        
        // Also delete matching user login account (safely ignore errors if /users endpoint is missing)
        try {
          const matchingUser = users.find(u => String(u.clientId) === String(client.id));
          if (matchingUser) {
            await deleteUser(matchingUser.id);
          }
        } catch (userErr) {
          console.warn("Impossible de supprimer le compte utilisateur lié:", userErr);
        }
        
        showNotification(`Client ${client.nom} supprimé.`);
        loadData();
      } catch (err) {
        console.error("Erreur de suppression du client:", err);
        showNotification('Erreur lors de la suppression.', 'error');
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nom || !formData.email) {
      return showNotification('Le nom et l\'email sont requis.', 'error');
    }

    try {
      if (isEdit) {
        // Update client
        const updatedClient = {
          ...selectedClient,
          nom: formData.nom,
          email: formData.email,
          telephone: formData.telephone,
          adresse: formData.adresse
        };
        await updateClient(selectedClient.id, updatedClient);

        // Update corresponding user in users list (safely ignore errors if /users endpoint is missing)
        try {
          const matchingUser = users.find(u => String(u.clientId) === String(selectedClient.id));
          if (matchingUser) {
            await updateUser(matchingUser.id, {
              ...matchingUser,
              email: formData.email,
              password: formData.password,
              name: formData.nom
            });
          }
        } catch (userErr) {
          console.warn("Impossible de mettre à jour le compte utilisateur lié:", userErr);
        }
        showNotification('Client mis à jour avec succès.');
      } else {
        // Create client
        const newClient = {
          nom: formData.nom,
          email: formData.email,
          telephone: formData.telephone,
          adresse: formData.adresse,
          codeClient: `CLI-2026-${String(clients.length + 1).padStart(4, '0')}`
        };
        const clientResult = await addClient(newClient);
        const createdClient = clientResult.data;

        // Create corresponding user account for login (safely ignore errors if /users endpoint is missing)
        try {
          const newUserAccount = {
            email: formData.email,
            password: formData.password,
            role: 'client',
            clientId: createdClient.id,
            name: formData.nom
          };
          await addUser(newUserAccount);
        } catch (userErr) {
          console.warn("Impossible de créer le compte utilisateur lié:", userErr);
        }

        showNotification('Client créé avec succès.');
      }
      setOpen(false);
      loadData();
    } catch (err) {
      showNotification('Erreur lors de l\'enregistrement.', 'error');
    }
  };

  // Filter clients based on search query
  const filteredClients = clients.filter(c => 
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.codeClient && c.codeClient.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight="700">Clients</Typography>
          <Typography variant="body2" color="text.secondary">
            Gérez les fiches clients et leurs comptes de connexion.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleOpenAdd} 
          sx={{ 
            borderRadius: '12px',
            bgcolor: '#2563eb',
            py: 1.2,
            px: 2.5,
            fontWeight: 'bold',
            '&:hover': { bgcolor: '#1d4ed8' },
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.2)'
          }}
        >
          Nouveau Client
        </Button>
      </Box>

      {/* Search Bar */}
      <TextField
        placeholder="Rechercher un client (Nom, Code, Email)..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          sx: { borderRadius: '12px', bgcolor: 'white' }
        }}
      />

      {loading ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Client / Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Téléphone</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Adresse</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => {
                  // Determine dynamic logo
                  let logoUrl = null;
                  if (client.email === 'client1@test.com') logoUrl = '/images/logo_acme.png';
                  else if (client.email === 'client2@test.com') logoUrl = '/images/logo_globex.png';

                  return (
                    <TableRow key={client.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar 
                            src={logoUrl || undefined}
                            sx={{ 
                              width: 40, 
                              height: 40, 
                              bgcolor: 'primary.light',
                              fontSize: '1rem',
                              fontWeight: 'bold',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                            }}
                          >
                            {!logoUrl && client.nom.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="bold" color="primary.main">
                              {client.nom}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {client.codeClient || `CLI-${client.id}`}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{client.email}</TableCell>
                      <TableCell>{client.telephone || '-'}</TableCell>
                      <TableCell>{client.adresse || '-'}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <IconButton color="primary" onClick={() => handleOpenEdit(client)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton color="error" onClick={() => handleDelete(client)}>
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    Aucun client trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <form onSubmit={handleFormSubmit}>
          <DialogTitle fontWeight="bold">
            {isEdit ? 'Modifier le Client' : 'Créer un Nouveau Client'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Nom / Raison Sociale"
                required
                fullWidth
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                InputProps={{ sx: { borderRadius: '12px' } }}
              />
              <TextField
                label="Adresse Email"
                type="email"
                required
                fullWidth
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                InputProps={{ sx: { borderRadius: '12px' } }}
                helperText="Sert d'identifiant de connexion pour le client"
              />
              <TextField
                label="Téléphone"
                fullWidth
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                InputProps={{ sx: { borderRadius: '12px' } }}
              />
              <TextField
                label="Adresse Physique"
                fullWidth
                multiline
                rows={2}
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                InputProps={{ sx: { borderRadius: '12px' } }}
              />
              <TextField
                label="Mot de passe du compte client"
                required
                fullWidth
                type="text" // text format so they can see what is generated/modified
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                InputProps={{ sx: { borderRadius: '12px' } }}
                helperText="Mot de passe que le client utilisera pour se connecter à son espace"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpen(false)} variant="outlined" color="inherit" sx={{ borderRadius: '12px' }}>
              Annuler
            </Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: '12px', bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}>
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
        <Alert onClose={handleCloseSnackbar} severity={notification.severity} sx={{ width: '100%', borderRadius: '8px' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ClientList;