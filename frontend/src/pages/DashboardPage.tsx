import { Box, Button, Card, CardContent, CardHeader, Divider, Grid, LinearProgress, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { fetchDashboardSummary } from "../services/api";
import type { DashboardSummary, SaleItem } from "../types";

const formatCurrency = (value: number) =>
  value.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 });

const formatGrams = (value: number) =>
  `${value.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} g`;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });

const DashboardPage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const { data } = await fetchDashboardSummary();
        setSummary(data as DashboardSummary);
      } catch (error) {
        console.error("Failed to load dashboard summary", error);
      } finally {
        setLoading(false);
      }
    };
    void loadSummary();
  }, []);

  const totals = useMemo(() => {
    if (!summary) {
      return {
        totalSales: 0,
        totalPurchases: 0,
        totalExpenses: 0,
        expectedCash: 0,
        coffeeValue: 0,
      };
    }
    return {
      totalSales: summary.cash.total_sales,
      totalPurchases: summary.cash.total_purchases,
      totalExpenses: summary.cash.total_expenses,
      expectedCash: summary.cash.expected_cash,
      coffeeValue: summary.cash.coffee_inventory_value,
      totalDebt: summary.cash.total_debt,
    };
  }, [summary]);

  if (loading) {
    return (
      <Card>
        <CardHeader title="Cargando métricas" />
        <CardContent>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader title="No pudimos cargar la información" />
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Intenta recargar la página o verifica la conexión con el servidor.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const { cash, inventory, recent_purchases, recent_expenses, recent_sales } = summary;

  const saleSummaryLine = (items: SaleItem[]): string => {
    if (!items.length) {
      return "Sin detalle";
    }
    if (items.length === 1) {
      const item = items[0];
      return `${item.bags} bolsa(s) · ${item.bag_size_g}g`; 
    }
    const totalBags = items.reduce((sum, item) => sum + item.bags, 0);
    return `${items.length} tostiones · ${totalBags} bolsas`;
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6} lg={4}>
        <Card>
          <CardHeader title="Resumen financiero" subheader="Panorama general del dinero" />
          <CardContent>
            <Stack spacing={1.5}>
              <Stack spacing={0.25}>
                <Typography variant="overline">Ventas acumuladas</Typography>
                <Typography variant="h5">{formatCurrency(totals.totalSales)}</Typography>
              </Stack>
              <Stack spacing={0.25}>
                <Typography variant="overline">Compras de café</Typography>
                <Typography variant="h6">{formatCurrency(totals.totalPurchases)}</Typography>
              </Stack>
              <Stack spacing={0.25}>
                <Typography variant="overline">Gastos registrados</Typography>
                <Typography variant="h6">{formatCurrency(totals.totalExpenses)}</Typography>
              </Stack>
              <Divider sx={{ my: 1 }} />
              <Stack spacing={0.25}>
                <Typography variant="overline">Saldo esperado</Typography>
                <Typography variant="h4">{formatCurrency(totals.expectedCash)}</Typography>
              </Stack>
              <Stack spacing={0.25}>
                <Typography variant="overline">Valor inventario de café</Typography>
                <Typography variant="h6">{formatCurrency(totals.coffeeValue)}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Verde: {formatCurrency(cash.green_inventory_value)} · Tostado: {formatCurrency(cash.roasted_inventory_value)}
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={4}>
        <Card>
          <CardHeader title="Inventario" subheader="Existencias actuales" />
          <CardContent>
            <Stack spacing={2}>
              <Stack spacing={0.25}>
                <Typography variant="overline">Café verde disponible</Typography>
                <Typography variant="h5">{formatGrams(inventory.green_available_g)}</Typography>
              </Stack>
              <Stack spacing={0.25}>
                <Typography variant="overline">Café tostado disponible</Typography>
                <Typography variant="h5">{formatGrams(inventory.roasted_available_g)}</Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} lg={4}>
        <Card>
          <CardHeader title="Indicadores rápidos" />
          <CardContent>
            <Stack spacing={1.5}>
              <Stack spacing={0.25}>
                <Typography variant="overline">Ingresos netos (Ventas - Gastos)</Typography>
                <Typography variant="h6">{formatCurrency(cash.total_sales - cash.total_expenses)}</Typography>
              </Stack>
              <Stack spacing={0.25}>
                <Typography variant="overline">Inversión total en café</Typography>
                <Typography variant="h6">{formatCurrency(cash.total_purchases)}</Typography>
              </Stack>
              <Stack spacing={0.25}>
                <Typography variant="overline">Deuda pendiente</Typography>
                <Typography variant="h5" color={cash.total_debt > 0 ? "error.main" : "success.main"}>
                  {formatCurrency(cash.total_debt)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Clientes con saldo por cobrar
                </Typography>
              </Stack>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate("/debts")}
                sx={{ alignSelf: "flex-start" }}
              >
                Ver deudas
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={4}>
        <Card>
          <CardHeader title="Últimas compras" subheader={`Mostrando ${recent_purchases.length} registros`} />
          <CardContent>
            <Stack spacing={1.5}>
              {recent_purchases.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Aún no hay compras registradas.
                </Typography>
              ) : (
                recent_purchases.map((purchase) => (
                  <Box key={purchase.id}>
                    <Typography variant="subtitle2">{`Lote #${purchase.id} · ${purchase.process}`}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {`${formatDate(purchase.purchase_date)} · ${formatGrams(purchase.green_weight_g)} · ${formatCurrency(
                        purchase.price_per_kg
                      )}/kg`}
                    </Typography>
                  </Box>
                ))
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={4}>
        <Card>
          <CardHeader title="Últimas ventas" subheader={`Mostrando ${recent_sales.length} registros`} />
          <CardContent>
            <Stack spacing={1.5}>
              {recent_sales.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Aún no hay ventas registradas.
                </Typography>
              ) : (
                recent_sales.map((sale) => (
                  <Box key={sale.id}>
                    <Typography variant="subtitle2">{`Venta #${sale.id} · ${formatCurrency(sale.total_price)}`}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {`${formatDate(sale.sale_date)} · ${formatGrams(sale.total_quantity_g)} · ${saleSummaryLine(
                      sale.items ?? []
                    )}`}
                  </Typography>
                  <Typography
                    variant="caption"
                    color={sale.total_price - sale.amount_paid > 0 ? "error" : "text.secondary"}
                  >
                    {sale.total_price - sale.amount_paid > 0
                      ? `Saldo pendiente: ${formatCurrency(Math.max(sale.total_price - sale.amount_paid, 0))}`
                      : `Pagado: ${formatCurrency(sale.amount_paid)}`}
                  </Typography>
                </Box>
              ))
            )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} lg={4}>
        <Card>
          <CardHeader title="Últimos gastos" subheader={`Mostrando ${recent_expenses.length} registros`} />
          <CardContent>
            <Stack spacing={1.5}>
              {recent_expenses.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Aún no hay gastos registrados.
                </Typography>
              ) : (
                recent_expenses.map((expense) => (
                  <Box key={expense.id}>
                    <Typography variant="subtitle2">{`${expense.category}`}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {`${formatDate(expense.expense_date)} · ${formatCurrency(expense.amount)}`}
                    </Typography>
                  </Box>
                ))
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default DashboardPage;
