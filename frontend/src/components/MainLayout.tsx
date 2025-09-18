import {
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
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
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
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

const sectionDescriptions: Record<string, string> = {
  Dashboard: "Resumen ejecutivo del negocio",
  Fincas: "Gestiona las fincas proveedoras",
  Variedades: "Control de variedades y procesos",
  Lotes: "Compras de café verde y su trazabilidad",
  Tostiones: "Historial y registro de tostiones",
  Ventas: "Seguimiento comercial y facturación",
  Clientes: "Directorio y relaciones comerciales",
  Usuarios: "Administración de cuentas internas",
  Gastos: "Control de egresos operativos"
};

const MainLayout = () => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const currentNav = navItems.find((item) =>
    item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to)
  );

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
            borderRight: 0,
            borderRadius: 0,
            backgroundColor: "#0b1220",
            color: "#f3f4f6",
            display: "flex",
            flexDirection: "column",
            px: 2,
            py: 3,
            gap: 3,
            boxShadow: "0 0 25px rgba(15, 23, 42, 0.35)"
          }
        }}
      >
        <Stack spacing={1} sx={{ pt: 1 }}>
          <Typography variant="h5" fontWeight={700} letterSpacing={0.4}>
            RoastSync
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.75 }}>
            Plataforma operativa de tueste
          </Typography>
        </Stack>

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
                    px: 2,
                    py: 1.3,
                    gap: 1.5,
                    borderRadius: 0,
                    mb: 0.25,
                    backgroundColor: isActive ? "rgba(249,250,251,0.14)" : "transparent",
                    color: isActive ? "secondary.main" : "rgba(243,244,246,0.85)",
                    transition: "all 0.2s ease",
                    '&:hover': {
                      backgroundColor: "rgba(249,250,251,0.18)",
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

        <Divider sx={{ borderColor: "rgba(255,255,255,0.12)", my: 2 }} />

        <Stack spacing={1.5} alignItems="flex-start" mb={2}>
          <Avatar sx={{ bgcolor: "secondary.main", color: "primary.contrastText" }}>
            {user?.full_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U"}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {user?.full_name ?? user?.email}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.6 }}>
              Sesión activa
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="secondary"
            onClick={logout}
            startIcon={<LogoutRoundedIcon />}
            sx={{
              borderRadius: 999,
              borderWidth: 2,
              color: "#f9fafb",
              borderColor: "rgba(255,255,255,0.3)",
              '&:hover': {
                borderColor: "secondary.light",
                backgroundColor: "rgba(255,255,255,0.12)"
              }
            }}
          >
            Cerrar sesión
          </Button>
        </Stack>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          bgcolor: "#f4f6fb",
          px: { xs: 3, md: 6 },
          py: { xs: 3, md: 4 }
        }}
      >
        <Box
          sx={{
            mb: 4,
            display: "flex",
            alignItems: { xs: "flex-start", md: "center" },
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            justifyContent: "space-between"
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {currentNav?.label ?? "Panel"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {sectionDescriptions[currentNav?.label ?? ""] ?? "Monitorea y gestiona la operación del café"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {new Date().toLocaleDateString("es-CO", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </Typography>
          </Stack>
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
