import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

function Articles() {
  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Articles</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Nouvel Article
        </Button>
      </Box>
      <Typography>Liste des articles...</Typography>
    </Box>
  );
}

export default Articles;