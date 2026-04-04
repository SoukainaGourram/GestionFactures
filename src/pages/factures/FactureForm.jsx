import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function FactureForm() {
  const navigate = useNavigate();

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>
        Nouvelle Facture
      </Typography>
      <Button variant="outlined" onClick={() => navigate('/factures')}>
        Retour
      </Button>
    </Box>
  );
}

export default FactureForm;