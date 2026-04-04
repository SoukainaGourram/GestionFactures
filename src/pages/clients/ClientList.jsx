import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

function ClientList() {
  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Clients</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Nouveau Client
        </Button>
      </Box>
      <Typography>Liste des clients...</Typography>
    </Box>
  );
}

export default ClientList;