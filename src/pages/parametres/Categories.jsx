import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

function Categories() {
  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Catégories</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Nouvelle Catégorie
        </Button>
      </Box>
      <Typography>Liste des catégories...</Typography>
    </Box>
  );
}

export default Categories;