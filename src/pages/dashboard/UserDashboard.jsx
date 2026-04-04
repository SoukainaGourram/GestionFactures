import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';

function UserDashboard() {
  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>
        Tableau de bord
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center', bgcolor: '#1976d2', color: 'white' }}>
            <Typography variant="h6">Total Factures</Typography>
            <Typography variant="h3">0</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center', bgcolor: '#2e7d32', color: 'white' }}>
            <Typography variant="h6">Total Encaissé</Typography>
            <Typography variant="h3">0 DH</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center', bgcolor: '#ed6c02', color: 'white' }}>
            <Typography variant="h6">En Attente</Typography>
            <Typography variant="h3">0</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center', bgcolor: '#d32f2f', color: 'white' }}></Paper>