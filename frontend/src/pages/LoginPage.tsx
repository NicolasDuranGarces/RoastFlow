import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Typography
} from "@mui/material";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

const LoginPage = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@caturro.cafe");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError("No se pudo iniciar sesion. Verifica tus credenciales.");
      console.error(err);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: { xs: 6, md: 10 },
        background: "linear-gradient(135deg, #f6f0e9 0%, #f0e6ff 100%)"
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 1100,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          overflow: "hidden",
          boxShadow: "0 40px 90px -50px rgba(31, 26, 56, 0.65)"
        }}
      >
        <Box
          sx={{
            flexBasis: { xs: "40%", md: "45%" },
            flexGrow: 1,
            background: "linear-gradient(155deg, #1f1a38 0%, #40286f 100%)",
            color: "#ffffff",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            justifyContent: "space-between",
            p: { xs: 4, md: 6 }
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ letterSpacing: 3, textTransform: "uppercase", opacity: 0.75 }}>
              RoastSync · Uso interno
            </Typography>
            <Typography variant="h3" fontWeight={700} mt={2}>
              Tostion y despacho sincronizados
            </Typography>
            <Typography variant="body1" mt={2} sx={{ opacity: 0.85 }}>
              Portal interno para el equipo de tueste: registra compras, tostiones y despachos con la trazabilidad
              que necesitamos a diario.
            </Typography>
          </Box>

          <Box display="flex" flexDirection="column" gap={2}>
            {["Estado inmediato de inventario", "Merma calculada automaticamente", "Ventas y gastos consolidado"]
              .map((item) => (
                <Box key={item} display="flex" alignItems="center" gap={1.5}>
                  <CheckCircleOutlineRoundedIcon fontSize="small" />
                  <Typography variant="body2">{item}</Typography>
                </Box>
              ))}
          </Box>

          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            Acceso reservado al equipo de produccion y operaciones. {new Date().getFullYear()} RoastSync.
          </Typography>
        </Box>

        <CardContent
          sx={{
            flexBasis: { xs: "60%", md: "55%" },
            display: "flex",
            flexDirection: "column",
            gap: 3,
            justifyContent: "center",
            p: { xs: 4, md: 6 }
          }}
        >
          <Box display="flex" flexDirection="column" gap={1.5}>
            <Typography variant="h4" fontWeight={700} color="text.primary">
              Acceso interno
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Utiliza tu correo corporativo para ingresar al panel operativo y mantener actualizada la trazabilidad
              del cafe.
            </Typography>
          </Box>

          <Divider sx={{ my: 1 }} />

          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={3}>
            <TextField
              label="Correo empresarial"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              autoComplete="email"
            />
            <TextField
              label="Clave"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton edge="end" onClick={() => setShowPassword((prev) => !prev)} aria-label="Mostrar clave">
                      {showPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {error && <Alert severity="error">{error}</Alert>}

            <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ py: 1.4 }}>
              {loading ? "Accediendo..." : "Entrar"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
