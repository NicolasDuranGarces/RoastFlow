import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography
} from "@mui/material";
import { useEffect, useState } from "react";

import { fetchDashboardSummary } from "../services/api";
import type { DashboardSummary } from "../types";

const DashboardPage = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const { data } = await fetchDashboardSummary();
        setSummary(data as DashboardSummary);
      } catch (error) {
        console.error("Failed to load dashboard summary", error);
      }
    };
    loadSummary();
  }, []);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title="Inventario" subheader="Cafe disponible" />
          <CardContent>
            <Typography variant="h6">
              Verde: {summary?.inventory.green_available_kg.toFixed(2) ?? "0.00"} kg
            </Typography>
            <Typography variant="h6">
              Tostado: {summary?.inventory.roasted_available_kg.toFixed(2) ?? "0.00"} kg
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title="Ventas" subheader="Resumen financiero" />
          <CardContent>
            <Typography>Total ventas: ${summary?.financials.total_sales.toFixed(2) ?? "0.00"}</Typography>
            <Typography>Total gastos: ${summary?.financials.total_expenses.toFixed(2) ?? "0.00"}</Typography>
            <Typography>Costo compras: ${summary?.financials.purchase_costs.toFixed(2) ?? "0.00"}</Typography>
            <Typography variant="h6" mt={1}>
              Utilidad neta: ${summary?.financials.net_profit.toFixed(2) ?? "0.00"}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title="Produccion" subheader="Tostion acumulada" />
          <CardContent>
            <Typography>
              Verde comprado: {summary?.roasts.total_green_purchased.toFixed(2) ?? "0.00"} kg
            </Typography>
            <Typography>
              Tostado producido: {summary?.roasts.total_roasted_produced.toFixed(2) ?? "0.00"} kg
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default DashboardPage;
