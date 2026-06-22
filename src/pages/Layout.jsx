import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  ShoppingBag as ShoppingBagIcon,
  Category as CategoryIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';

const drawerWidth = 260;

function Layout() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Tableau de bord', icon: <DashboardIcon />, path: '/', roles: ['admin', 'client'] },
    { text: 'Factures', icon: <ReceiptIcon />, path: '/factures', roles: ['admin', 'client'] },
    { text: 'Clients', icon: <PeopleIcon />, path: '/clients', roles: ['admin'] },
    { text: 'Articles', icon: <ShoppingBagIcon />, path: '/articles', roles: ['admin'] },
    { text: 'Catégories', icon: <CategoryIcon />, path: '/categories', roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(userRole));

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a', color: '#f8fafc' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid #1e293b' }}>
        <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 40, height: 40, fontWeight: 'bold' }}>GF</Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#fff', lineHeight: 1.2 }}>
            FactureFlow
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            Gestion Professionnelle
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 2, m: 2, bgcolor: '#1e293b', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: userRole === 'admin' ? theme.palette.secondary.main : theme.palette.info.main }}>
          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
        </Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="body2" fontWeight="bold" noWrap sx={{ color: '#f1f5f9' }}>
            {currentUser?.name || 'Utilisateur'}
          </Typography>
          <Chip
            label={userRole === 'admin' ? 'Admin' : 'Client'}
            size="small"
            color={userRole === 'admin' ? 'secondary' : 'info'}
            sx={{ height: 20, fontSize: '0.65rem', mt: 0.5, fontWeight: 'bold' }}
          />
        </Box>
      </Box>

      <Divider sx={{ borderColor: '#1e293b' }} />

      <List sx={{ px: 2, py: 1, flexGrow: 1 }}>
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  px: 2,
                  bgcolor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? '#fff' : '#94a3b8',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.main' : '#1e293b',
                    color: '#fff',
                    '& .MuiListItemIcon-root': { color: '#fff' }
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <ListItemIcon sx={{ color: isActive ? '#fff' : '#94a3b8', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isActive ? 600 : 500 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ p: 2, borderTop: '1px solid #1e293b' }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            py: 1,
            color: '#ef4444',
            '&:hover': {
              bgcolor: 'rgba(239, 68, 68, 0.08)',
            }
          }}
        >
          <ListItemIcon sx={{ color: '#ef4444', minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Déconnexion" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #e2e8f0',
          color: '#1e293b'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" fontWeight="600" sx={{ color: '#0f172a' }}>
            {location.pathname === '/'
              ? 'Tableau de bord'
              : location.pathname.startsWith('/factures')
              ? 'Factures'
              : location.pathname.startsWith('/clients')
              ? 'Clients'
              : location.pathname.startsWith('/articles')
              ? 'Articles'
              : location.pathname.startsWith('/categories')
              ? 'Catégories'
              : 'Gestion Factures'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" fontWeight="500" sx={{ display: { xs: 'none', sm: 'block' }, color: '#64748b' }}>
              Bonjour, <strong style={{ color: '#0f172a' }}>{currentUser?.name || 'Utilisateur'}</strong>
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: theme.palette.primary.main,
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}
              >
                {currentUser?.name ? currentUser.name.split(' ').map(n=>n[0]).join('').toUpperCase() : 'U'}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                elevation: 3,
                sx: { borderRadius: 2, mt: 1, minWidth: 150 }
              }}
            >
              <MenuItem onClick={handleClose} sx={{ fontSize: '0.9rem' }}>Profil</MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: 500 }}>
                Déconnexion
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none' },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;
