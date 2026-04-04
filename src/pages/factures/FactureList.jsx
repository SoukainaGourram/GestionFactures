import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';

function FactureList() {
  const navigate = useNavigate();

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Factures</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/factures/new')}>
          Nouvelle Facture
        </Button>
      </Box>
      <Typography>Liste des factures...</Typography>
    </Box>
  );
}

export default FactureList;