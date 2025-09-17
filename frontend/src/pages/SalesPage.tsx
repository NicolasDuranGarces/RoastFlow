import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { createSale, deleteSale, fetchCustomers, fetchRoasts, fetchSales, updateSale } from "../services/api";
import type { Customer, RoastBatch, Sale } from "../types";

const buildEmptySaleForm = () => ({
  roast_batch_id: "",
  customer_id: "",
  sale_date: new Date().toISOString().slice(0, 10),
  quantity_kg: "",
  price_per_kg: "",
  notes: ""
});

const SalesPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [roasts, setRoasts] = useState<RoastBatch[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [saleForm, setSaleForm] = useState(buildEmptySaleForm);
  const [saleEditingId, setSaleEditingId] = useState<number | null>(null);
  const [saleSaving, setSaleSaving] = useState(false);

  const loadData = useMemo(
    () =>
      async () => {
        try {
          const [customersRes, roastsRes, salesRes] = await Promise.all([
            fetchCustomers(),
            fetchRoasts(),
            fetchSales()
          ]);
          setCustomers(customersRes.data as Customer[]);
          setRoasts(roastsRes.data as RoastBatch[]);
          setSales(salesRes.data as Sale[]);
        } catch (error) {
          console.error("Failed to load sales data", error);
        }
      },
    []
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetSaleForm = () => {
    setSaleForm(buildEmptySaleForm());
    setSaleEditingId(null);
  };

  const handleSaveSale = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaleSaving(true);
    try {
      const payload = {
        roast_batch_id: Number(saleForm.roast_batch_id),
        customer_id: saleForm.customer_id ? Number(saleForm.customer_id) : null,
        sale_date: saleForm.sale_date,
        quantity_kg: Number(saleForm.quantity_kg),
        price_per_kg: Number(saleForm.price_per_kg),
        notes: saleForm.notes
      };
      if (saleEditingId) {
        await updateSale(saleEditingId, payload);
      } else {
        await createSale(payload);
      }
      resetSaleForm();
      await loadData();
    } catch (error) {
      console.error("Failed to save sale", error);
    } finally {
      setSaleSaving(false);
    }
  };

  const handleEditSale = (sale: Sale) => {
    setSaleEditingId(sale.id);
    setSaleForm({
      roast_batch_id: String(sale.roast_batch_id),
      customer_id: sale.customer_id ? String(sale.customer_id) : "",
      sale_date: sale.sale_date,
      quantity_kg: String(sale.quantity_kg),
      price_per_kg: String(sale.price_per_kg),
      notes: sale.notes ?? ""
    });
  };

  const handleDeleteSale = async (sale: Sale) => {
    if (!window.confirm(`Eliminar venta del ${sale.sale_date}?`)) {
      return;
    }
    try {
      await deleteSale(sale.id);
      await loadData();
    } catch (error) {
      console.error("Failed to delete sale", error);
    }
  };

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={5}>
        <Card sx={{ height: "100%" }}>
          <CardHeader title={saleEditingId ? "Editar venta" : "Registrar venta"} />
          <CardContent>
            <Box component="form" display="flex" flexDirection="column" gap={2} onSubmit={handleSaveSale}>
              <TextField
                select
                label="Tostion"
                value={saleForm.roast_batch_id}
                onChange={(e) => setSaleForm((prev) => ({ ...prev, roast_batch_id: e.target.value }))}
                required
              >
                {roasts.map((roast) => (
                  <MenuItem key={roast.id} value={roast.id}>
                    Roast #{roast.id} - {roast.roast_date}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Cliente"
                value={saleForm.customer_id}
                onChange={(e) => setSaleForm((prev) => ({ ...prev, customer_id: e.target.value }))}
              >
                <MenuItem value="">Venta mostrador</MenuItem>
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Fecha"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={saleForm.sale_date}
                onChange={(e) => setSaleForm((prev) => ({ ...prev, sale_date: e.target.value }))}
                required
              />
              <TextField
                label="Cantidad (kg)"
                type="number"
                value={saleForm.quantity_kg}
                onChange={(e) => setSaleForm((prev) => ({ ...prev, quantity_kg: e.target.value }))}
                required
              />
              <TextField
                label="Precio por kg"
                type="number"
                value={saleForm.price_per_kg}
                onChange={(e) => setSaleForm((prev) => ({ ...prev, price_per_kg: e.target.value }))}
                required
              />
              <TextField
                label="Notas"
                value={saleForm.notes}
                onChange={(e) => setSaleForm((prev) => ({ ...prev, notes: e.target.value }))}
                multiline
                rows={3}
              />
              <Box display="flex" gap={2}>
                <Button type="submit" variant="contained" disabled={saleSaving}>
                  {saleEditingId ? "Actualizar" : "Guardar venta"}
                </Button>
                {saleEditingId && (
                  <Button variant="outlined" onClick={resetSaleForm} disabled={saleSaving}>
                    Cancelar
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={7}>
        <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <CardHeader title="Historial de ventas" subheader={`${sales.length} registros`} />
          <CardContent sx={{ flexGrow: 1, overflowX: "auto" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Tostion</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell align="right">Kg</TableCell>
                  <TableCell align="right">Precio/kg</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{sale.sale_date}</TableCell>
                    <TableCell>{sale.roast_batch_id}</TableCell>
                    <TableCell>{customers.find((c) => c.id === sale.customer_id)?.name ?? ""}</TableCell>
                    <TableCell align="right">{sale.quantity_kg.toFixed(2)}</TableCell>
                    <TableCell align="right">${sale.price_per_kg.toFixed(2)}</TableCell>
                    <TableCell align="right">${sale.total_price.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton color="primary" onClick={() => handleEditSale(sale)}>
                          <EditRoundedIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton color="error" onClick={() => handleDeleteSale(sale)}>
                          <DeleteRoundedIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="body2" color="text.secondary">
          ¿Necesitas crear o editar clientes? Usa la seccion dedicada en el menu "Clientes".
        </Typography>
      </Grid>
    </Grid>
  );
};

export default SalesPage;
