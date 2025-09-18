import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Slider,
  Stack,
  Typography
} from "@mui/material";
import MonetizationOnRoundedIcon from "@mui/icons-material/MonetizationOnRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import CoffeeRoundedIcon from "@mui/icons-material/CoffeeRounded";
import { useEffect, useMemo, useState } from "react";

import { fetchDashboardSummary } from "../services/api";
import type { DashboardSummary } from "../types";

const formatCurrency = (value: number) =>
  value.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 });

const formatKg = (value: number) => `${value.toFixed(2)} kg`;

const DashboardPage = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [projectionPercent, setProjectionPercent] = useState(100);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const { data } = await fetchDashboardSummary();
        setSummary(data as DashboardSummary);
      } catch (error) {
        console.error("Failed to load dashboard summary", error);
      }
    };
    void loadSummary();
  }, []);

  const projections = useMemo(() => {
    if (!summary) {
      return {
        roastedAvailable: 0,
        averagePrice: 0,
        fullValue: 0,
        halfValue: 0
      };
    }
    return {
      roastedAvailable: summary.inventory.roasted_available_kg,
      averagePrice: summary.financials.average_price_per_kg,
      fullValue: summary.financials.projected_full_sale_value,
      halfValue: summary.financials.projected_half_sale_value
    };
  }, [summary]);

  const dynamicProjection = useMemo(() => {
    if (!summary) {
      return { kilos: 0, value: 0 };
    }
    const kilos = (summary.inventory.roasted_available_kg * projectionPercent) / 100;
    const value = kilos * summary.financials.average_price_per_kg;
    return { kilos, value };
  }, [summary, projectionPercent]);

  if (!summary) {
    return (
      <Card>
        <CardHeader title="Cargando métricas" />
        <CardContent>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  const inventory = summary.inventory;
  const financials = summary.financials;
  const roastStats = summary.roasts;
  const profitMargin = financials.total_sales > 0 ? (financials.net_profit / financials.total_sales) * 100 : 0;
  const expenseRatio = financials.total_sales > 0 ? (financials.total_expenses / financials.total_sales) * 100 : 0;
  const greenUtilization = roastStats.total_green_purchased > 0
    ? (roastStats.total_roasted_produced / roastStats.total_green_purchased) * 100
    : 0;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="overline">Margen neto</Typography>
                  <Typography variant="h4">{profitMargin.toFixed(1)}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Utilidad frente a ventas totales
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="overline">Gastos / Ventas</Typography>
                  <Typography variant="h4">{expenseRatio.toFixed(1)}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Controla el peso de los gastos generales
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="overline">Promedio venta por kg</Typography>
                  <Typography variant="h4">{formatCurrency(financials.average_price_per_kg)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Basado en las ventas registradas
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="overline">Uso del verde</Typography>
                  <Typography variant="h4">{greenUtilization.toFixed(1)}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Proporción tostada vs comprada
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12} lg={4}>
        <Card>
          <CardHeader
            title="Salud financiera"
            subheader="Ventas, costos y utilidad acumulada"
            action={<Chip label={`Valor promedio ${formatCurrency(financials.average_price_per_kg)}/kg`} />}
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: "primary.main" }}>
                    <MonetizationOnRoundedIcon />
                  </Avatar>
                  <Stack spacing={0.5}>
                    <Typography variant="overline">Ventas acumuladas</Typography>
                    <Typography variant="h5">{formatCurrency(financials.total_sales)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatKg(financials.total_quantity_sold)} vendidas
                    </Typography>
                  </Stack>
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: "secondary.main" }}>
                    <PaidRoundedIcon />
                  </Avatar>
                  <Stack spacing={0.5}>
                    <Typography variant="overline">Utilidad neta</Typography>
                    <Typography variant="h5">{formatCurrency(financials.net_profit)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ventas - (gastos generales + compra de café)
                    </Typography>
                  </Stack>
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ bgcolor: "grey.800" }}>
                      <SavingsRoundedIcon />
                    </Avatar>
                    <Stack>
                      <Typography variant="overline">Gasto en café verde</Typography>
                      <Typography variant="h6">{formatCurrency(financials.purchase_costs)}</Typography>
                    </Stack>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ bgcolor: "grey.700" }}>
                      <Inventory2RoundedIcon />
                    </Avatar>
                    <Stack>
                      <Typography variant="overline">Gastos generales</Typography>
                      <Typography variant="h6">{formatCurrency(financials.total_expenses)}</Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} lg={4}>
        <Card>
          <CardHeader
            title="Inventario"
            subheader="Disponibilidad actual"
            action={<Chip color="secondary" label="Seguimiento diario" />}
          />
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  <CoffeeRoundedIcon />
                </Avatar>
                <Stack>
                  <Typography variant="overline">Verde disponible</Typography>
                  <Typography variant="h6">{formatKg(inventory.green_available_kg)}</Typography>
                </Stack>
              </Stack>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: "secondary.main" }}>
                  <LocalFireDepartmentRoundedIcon />
                </Avatar>
                <Stack>
                  <Typography variant="overline">Tostado disponible</Typography>
                  <Typography variant="h6">{formatKg(inventory.roasted_available_kg)}</Typography>
                </Stack>
              </Stack>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Verde tostado hasta ahora
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={
                    roastStats.total_green_purchased > 0
                      ? Math.min((roastStats.total_roasted_produced / roastStats.total_green_purchased) * 100, 100)
                      : 0
                  }
                  sx={{ mt: 1, borderRadius: 2, height: 8 }}
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} lg={4}>
        <Card>
          <CardHeader title="Proyección de inventario" subheader="Escenarios sobre el tostado disponible" />
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  {[25, 50, 75, 100].map((preset) => (
                    <Chip
                      key={preset}
                      label={`${preset}%`}
                      onClick={() => setProjectionPercent(preset)}
                      variant={projectionPercent === preset ? "filled" : "outlined"}
                    />
                  ))}
                </Stack>
                <Slider
                  value={projectionPercent}
                  onChange={(_, value) => setProjectionPercent(value as number)}
                  min={0}
                  max={100}
                  step={5}
                  valueLabelDisplay="auto"
                  sx={{ mt: 1 }}
                />
              </Box>
              <Stack spacing={0.5}>
                <Typography variant="overline">Inventario tostado disponible</Typography>
                <Typography variant="h5">{formatKg(projections.roastedAvailable)}</Typography>
              </Stack>
              <Stack spacing={0.5}>
                <Typography variant="overline">Proyección {projectionPercent}%</Typography>
                <Typography variant="h4">{formatCurrency(dynamicProjection.value)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Equivale a {formatKg(dynamicProjection.kilos)} vendidos al precio promedio
                </Typography>
              </Stack>
              <Divider />
              <Stack spacing={0.5}>
                <Typography variant="overline">Escenarios rápidos</Typography>
                <Typography variant="body2">
                  Vender todo: <strong>{formatCurrency(projections.fullValue)}</strong>
                </Typography>
                <Typography variant="body2">
                  Vender 50%: <strong>{formatCurrency(projections.halfValue)}</strong>
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title="Producción" subheader="Histórico acumulado" />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Stack>
                  <Typography variant="overline">Verde comprado</Typography>
                  <Typography variant="h5">{formatKg(roastStats.total_green_purchased)}</Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack>
                  <Typography variant="overline">Tostado producido</Typography>
                  <Typography variant="h5">{formatKg(roastStats.total_roasted_produced)}</Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack>
                  <Typography variant="overline">Tostado vendido</Typography>
                  <Typography variant="h5">{formatKg(roastStats.total_roasted_sold)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Diferencia inventario: {formatKg(roastStats.total_roasted_produced - roastStats.total_roasted_sold)}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default DashboardPage;
