import {
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import AgricultureRoundedIcon from "@mui/icons-material/AgricultureRounded";
import SpaRoundedIcon from "@mui/icons-material/SpaRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

const drawerWidth = 260;

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: <DashboardRoundedIcon /> },
  { label: "Fincas", to: "/farms", icon: <AgricultureRoundedIcon /> },
  { label: "Variedades", to: "/varieties", icon: <SpaRoundedIcon /> },
  { label: "Lotes", to: "/lots", icon: <Inventory2RoundedIcon /> },
  { label: "Tostiones", to: "/roasts", icon: <LocalFireDepartmentRoundedIcon /> },
  { label: "Ventas", to: "/sales", icon: <ShoppingCartRoundedIcon /> },
  { label: "Clientes", to: "/customers", icon: <GroupsRoundedIcon /> },
  { label: "Usuarios", to: "/users", icon: <ManageAccountsRoundedIcon />, adminOnly: true },
  { label: "Gastos", to: "/expenses", icon: <AccountBalanceWalletRoundedIcon /> }
];

const MainLayout = () => {
  const location = useLocation();
  const { logout, user } = useAuth();

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "none",
            borderRadius: 0,
            backgroundImage: "linear-gradient(180deg, rgba(31, 26, 56, 0.98) 0%, rgba(36, 28, 70, 0.95) 100%)",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            padding: 0
          }
        }}
      >
        <Box display="flex" flexDirection="column" height="100%" px={3} py={4} gap={4}>
          <Box>
            <Typography variant="h5" fontWeight={700} letterSpacing={0.6}>
              RoastSync
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Orquesta tu tostion diaria
            </Typography>
          </Box>

          <List sx={{ flexGrow: 1, display: "flex", flexDirection: "column", py: 0 }}>
            {navItems
              .filter((item) => !item.adminOnly || user?.is_superuser)
              .map((item) => {
                const isActive = location.pathname.startsWith(item.to);
                return (
                <ListItemButton
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  sx={{
                    px: 2.5,
                    py: 1.6,
                    gap: 1.5,
                    borderRadius: 0,
                    backgroundColor: isActive ? "rgba(255,255,255,0.16)" : "transparent",
                    color: isActive ? "secondary.main" : "rgba(255,255,255,0.78)",
                    '&:hover': {
                      backgroundColor: "rgba(255,255,255,0.2)",
                      color: "secondary.main"
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, mr: 2, color: "inherit" }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 700 : 500,
                      variant: "body1",
                      color: "inherit"
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

          <Box display="flex" flexDirection="column" gap={1.5}>
            <Box>
              <Typography variant="body2" sx={{ opacity: 0.6 }}>
                Sesion activa
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {user?.full_name ?? user?.email}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="secondary"
              onClick={logout}
              sx={{
                borderRadius: 2,
                borderWidth: 2,
                color: "#fff",
                borderColor: "rgba(255,255,255,0.35)",
                '&:hover': {
                  borderColor: "secondary.main",
                  backgroundColor: "rgba(255,255,255,0.08)"
                }
              }}
            >
              Cerrar sesion
            </Button>
          </Box>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          px: { xs: 3, md: 5 },
          py: { xs: 4, md: 5 }
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
