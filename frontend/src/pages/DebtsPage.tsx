import {
  Card,
  CardContent,
  CardHeader,
  Chip,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Button
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { fetchCustomers, fetchSalesDebts } from "../services/api";
import type { Customer, Sale } from "../types";

const formatCurrency = (value: number) =>
  value.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 });

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });

const DebtsPage = () => {
  const navigate = useNavigate();
  const [debts, setDebts] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "overdue" | "partial">("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadData = async () => {
    try {
      setLoading(true);
      const [debtsRes, customersRes] = await Promise.all([fetchSalesDebts(), fetchCustomers()]);
      setDebts(debtsRes.data as Sale[]);
      setCustomers(customersRes.data as Customer[]);
    } catch (error) {
      console.error("Failed to load debts", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredDebts = useMemo(() => {
    return debts.filter((sale) => {
      const balance = Math.max(sale.total_price - sale.amount_paid, 0);
      if (statusFilter === "partial") {
        return balance > 0 && sale.amount_paid > 0;
      }
      if (statusFilter === "overdue") {
        return balance > 0 && sale.amount_paid === 0;
      }
      return balance > 0;
    });
  }, [debts, statusFilter]);

  useEffect(() => {
    setPage(0);
  }, [filteredDebts.length, statusFilter]);

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredDebts.slice(start, start + rowsPerPage);
  }, [filteredDebts, page, rowsPerPage]);

  const totalOutstanding = useMemo(
    () => filteredDebts.reduce((sum, sale) => sum + Math.max(sale.total_price - sale.amount_paid, 0), 0),
    [filteredDebts]
  );

  const customerName = (customerId?: number | null) => {
    if (!customerId) {
      return "Venta mostrador";
    }
    return customers.find((customer) => customer.id === customerId)?.name ?? "Cliente";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="Cuentas por cobrar" />
        <CardContent>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={3}>
      <Card>
        <CardHeader
          title="Cuentas por cobrar"
          subheader={`Saldo total pendiente: ${formatCurrency(totalOutstanding)}`}
          action={
            <Button startIcon={<RefreshRoundedIcon />} onClick={loadData} variant="outlined">
              Actualizar
            </Button>
          }
        />
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }}>
              <TextField
                select
                label="Estado"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                sx={{ maxWidth: 240 }}
              >
                <MenuItem value="all">Todas las deudas</MenuItem>
                <MenuItem value="overdue">No se ha registrado pago</MenuItem>
                <MenuItem value="partial">Pagos parciales</MenuItem>
              </TextField>
              <Typography variant="body2" color="text.secondary">
                {`Mostrando ${filteredDebts.length} registros`}
              </Typography>
            </Stack>

            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Venta</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Pagado</TableCell>
                  <TableCell align="right">Saldo</TableCell>
                  <TableCell>Notas</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Typography variant="body2" color="text.secondary">
                        No hay deudas con el filtro seleccionado.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((sale) => {
                    const balance = Math.max(sale.total_price - sale.amount_paid, 0);
                    return (
                      <TableRow key={sale.id}>
                        <TableCell>{`Venta #${sale.id}`}</TableCell>
                        <TableCell>{customerName(sale.customer_id)}</TableCell>
                        <TableCell>{formatDate(sale.sale_date)}</TableCell>
                        <TableCell align="right">{formatCurrency(sale.total_price)}</TableCell>
                        <TableCell align="right">{formatCurrency(sale.amount_paid)}</TableCell>
                        <TableCell align="right">
                          <Chip color="warning" size="small" label={formatCurrency(balance)} />
                        </TableCell>
                        <TableCell>{sale.notes ?? "—"}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() =>
                              navigate("/sales", {
                                state: { prefilters: { status: "pending" } }
                              })
                            }
                          >
                            Ver ventas
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={filteredDebts.length}
              page={page}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 20]}
              labelRowsPerPage="Filas por página"
            />
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default DebtsPage;
