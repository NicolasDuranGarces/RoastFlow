import {
  Avatar,
  Box,
  Button,
  Collapse,
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
import AssignmentLateRoundedIcon from "@mui/icons-material/AssignmentLateRounded";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import CoffeeMakerRoundedIcon from "@mui/icons-material/CoffeeMakerRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

const drawerWidth = 260;

type NavItem = {
  label: string;
  to: string;
  icon: JSX.Element;
  adminOnly?: boolean;
};

const navSections: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Resumen",
    items: [{ label: "Dashboard", to: "/dashboard", icon: <DashboardRoundedIcon /> }]
  },
  {
    title: "Producción",
    items: [
      { label: "Fincas", to: "/farms", icon: <AgricultureRoundedIcon /> },
      { label: "Variedades", to: "/varieties", icon: <SpaRoundedIcon /> },
      { label: "Lotes", to: "/lots", icon: <Inventory2RoundedIcon /> },
      { label: "Tostiones", to: "/roasts", icon: <LocalFireDepartmentRoundedIcon /> },
      { label: "Inventario tostado", to: "/inventory", icon: <CoffeeMakerRoundedIcon /> }
    ]
  },
  {
    title: "Comercial",
    items: [
      { label: "Ventas", to: "/sales", icon: <ShoppingCartRoundedIcon /> },
      { label: "Deudas", to: "/debts", icon: <AssignmentLateRoundedIcon /> },
      { label: "Clientes", to: "/customers", icon: <GroupsRoundedIcon /> },
      { label: "Referencias de precio", to: "/price-references", icon: <LocalOfferRoundedIcon /> }
    ]
  },
  {
    title: "Finanzas",
    items: [{ label: "Gastos", to: "/expenses", icon: <AccountBalanceWalletRoundedIcon /> }]
  },
  {
    title: "Administración",
    items: [{ label: "Usuarios", to: "/users", icon: <ManageAccountsRoundedIcon />, adminOnly: true }]
  }
];

const flatNavItems = navSections.flatMap((section) => section.items);

const sectionDescriptions: Record<string, string> = {
  Dashboard: "Resumen ejecutivo del negocio",
  Fincas: "Gestiona las fincas proveedoras",
  Variedades: "Control de variedades y procesos",
  Lotes: "Compras de café verde y su trazabilidad",
  Tostiones: "Historial y registro de tostiones",
  "Inventario tostado": "Control en tiempo real del café tostado disponible",
  Ventas: "Seguimiento comercial y facturación",
  Deudas: "Control de cuentas por cobrar",
  Clientes: "Directorio y relaciones comerciales",
  "Referencias de precio": "Catálogo de precios por variedad y presentación",
  Usuarios: "Administración de cuentas internas",
  Gastos: "Control de egresos operativos"
};

const MainLayout = () => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const currentNav = flatNavItems.find((item) =>
    item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to)
  );

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial = Object.fromEntries(navSections.map((section) => [section.title, true]));
    const activeSection = navSections.find((section) =>
      section.items.some((item) => location.pathname.startsWith(item.to))
    );
    if (activeSection) {
      initial[activeSection.title] = true;
    }
    return initial;
  });

  const handleToggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  useEffect(() => {
    const activeSection = navSections.find((section) =>
      section.items.some((item) => location.pathname.startsWith(item.to))
    );
    if (activeSection) {
      setOpenSections((prev) => ({ ...prev, [activeSection.title]: true }));
    }
  }, [location.pathname]);

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

        <List sx={{ flexGrow: 1, display: "flex", flexDirection: "column", py: 0, gap: 1.5 }}>
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) => !item.adminOnly || user?.is_superuser);
            if (visibleItems.length === 0) {
              return null;
            }
            return (
              <Box key={section.title}>
                <ListItemButton
                  onClick={() => handleToggleSection(section.title)}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 0,
                    mb: 0.25,
                    color: "rgba(243,244,246,0.8)",
                    '&:hover': {
                      backgroundColor: "rgba(249,250,251,0.14)",
                      color: "secondary.main"
                    }
                  }}
                >
                  <ListItemText
                    primary={section.title}
                    primaryTypographyProps={{
                      variant: "overline",
                      letterSpacing: 1,
                      fontWeight: 700
                    }}
                  />
                  {openSections[section.title] ? (
                    <ExpandLessRoundedIcon fontSize="small" />
                  ) : (
                    <ExpandMoreRoundedIcon fontSize="small" />
                  )}
                </ListItemButton>
                <Collapse in={openSections[section.title]} timeout="auto" unmountOnExit>
                  {visibleItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.to);
                    return (
                      <ListItemButton
                        key={item.to}
                        component={NavLink}
                        to={item.to}
                        sx={{
                          px: 3,
                          py: 1.1,
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
                </Collapse>
              </Box>
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
