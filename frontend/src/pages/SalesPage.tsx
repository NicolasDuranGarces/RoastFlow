import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

import {
  createSale,
  deleteSale,
  fetchCustomers,
  fetchFarms,
  fetchLots,
  fetchRoasts,
  fetchSales,
  fetchVarieties,
  updateSale
} from "../services/api";
import type { Customer, Farm, RoastBatch, Sale, Variety, CoffeeLot } from "../types";
import ConfirmDialog from "../components/ConfirmDialog";
import FilterPanel from "../components/FilterPanel";

const buildEmptySaleForm = () => ({
  roast_batch_id: "",
  customer_id: "",
  sale_date: new Date().toISOString().slice(0, 10),
  quantity_kg: "",
  price_per_kg: "",
  notes: ""
});

const MIN_AVAILABLE_ROAST_KG = 0.1;

const SalesPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [roasts, setRoasts] = useState<RoastBatch[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [lots, setLots] = useState<CoffeeLot[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);

  const [saleForm, setSaleForm] = useState(buildEmptySaleForm);
  const [saleEditingId, setSaleEditingId] = useState<number | null>(null);
  const [saleSaving, setSaleSaving] = useState(false);
  const [saleErrors, setSaleErrors] = useState<{ quantity?: string; price?: string }>({});
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    roastId: "",
    customerId: "",
    minQuantity: "",
    maxQuantity: "",
    minPrice: "",
    maxPrice: "",
    minTotal: "",
    maxTotal: "",
    notes: ""
  });
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadData = useMemo(
    () =>
      async () => {
        try {
          const [customersRes, roastsRes, salesRes, lotsRes, varietiesRes, farmsRes] = await Promise.all([
            fetchCustomers(),
            fetchRoasts(),
            fetchSales(),
            fetchLots(),
            fetchVarieties(),
            fetchFarms()
          ]);
          setCustomers(customersRes.data as Customer[]);
          setRoasts(roastsRes.data as RoastBatch[]);
          setSales(salesRes.data as Sale[]);
          setLots(lotsRes.data as CoffeeLot[]);
          setVarieties(varietiesRes.data as Variety[]);
          setFarms(farmsRes.data as Farm[]);
        } catch (error) {
          console.error("Failed to load sales data", error);
        }
      },
    []
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const getAvailableRoastedKg = (roastId: number, ignoreSaleId: number | null) => {
    const roast = roasts.find((candidate) => candidate.id === roastId);
    if (!roast) {
      return 0;
    }
    const used = sales.reduce((total, current) => {
      if (current.roast_batch_id !== roastId) {
        return total;
      }
      if (ignoreSaleId && current.id === ignoreSaleId) {
        return total;
      }
      return total + current.quantity_kg;
    }, 0);
    return Math.max(0, roast.roasted_output_kg - used);
  };

  const availableForSelectedRoast = useMemo(() => {
    if (!saleForm.roast_batch_id) {
      return null;
    }
    return getAvailableRoastedKg(Number(saleForm.roast_batch_id), saleEditingId);
  }, [saleForm.roast_batch_id, saleEditingId, roasts, sales]);

  const roastOptions = useMemo(() => {
    return roasts.filter((roast) => {
      const available = getAvailableRoastedKg(roast.id, saleEditingId);
      if (saleEditingId && Number(saleForm.roast_batch_id) === roast.id) {
        return true;
      }
      return available >= MIN_AVAILABLE_ROAST_KG;
    });
  }, [roasts, sales, saleEditingId, saleForm.roast_batch_id]);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      if (filters.dateFrom && sale.sale_date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && sale.sale_date > filters.dateTo) {
        return false;
      }
      if (filters.roastId && sale.roast_batch_id !== Number(filters.roastId)) {
        return false;
      }
      if (filters.customerId) {
        const customerId = sale.customer_id ?? null;
        if (filters.customerId === "none" && customerId !== null) {
          return false;
        }
        if (filters.customerId !== "none" && customerId !== Number(filters.customerId)) {
          return false;
        }
      }
      if (filters.minQuantity) {
        const minQuantity = Number(filters.minQuantity);
        if (!Number.isNaN(minQuantity) && sale.quantity_kg < minQuantity) {
          return false;
        }
      }
      if (filters.maxQuantity) {
        const maxQuantity = Number(filters.maxQuantity);
        if (!Number.isNaN(maxQuantity) && sale.quantity_kg > maxQuantity) {
          return false;
        }
      }
      if (filters.minPrice) {
        const minPrice = Number(filters.minPrice);
        if (!Number.isNaN(minPrice) && sale.price_per_kg < minPrice) {
          return false;
        }
      }
      if (filters.maxPrice) {
        const maxPrice = Number(filters.maxPrice);
        if (!Number.isNaN(maxPrice) && sale.price_per_kg > maxPrice) {
          return false;
        }
      }
      if (filters.minTotal) {
        const minTotal = Number(filters.minTotal);
        if (!Number.isNaN(minTotal) && sale.total_price < minTotal) {
          return false;
        }
      }
      if (filters.maxTotal) {
        const maxTotal = Number(filters.maxTotal);
        if (!Number.isNaN(maxTotal) && sale.total_price > maxTotal) {
          return false;
        }
      }
      if (filters.notes && !(sale.notes ?? "").toLowerCase().includes(filters.notes.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [filters, sales]);

  const isFiltering = useMemo(
    () => Object.values(filters).some((value) => value.toString().trim() !== ""),
    [filters]
  );

  const resetSaleForm = () => {
    setSaleForm(buildEmptySaleForm());
    setSaleEditingId(null);
    setSaleErrors({});
  };

  const openCreateDialog = () => {
    resetSaleForm();
    setDialogOpen(true);
  };

  const handleFilterChange = (field: keyof typeof filters) => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setFilters((prev) => ({ ...prev, [field]: value.toString() }));
  };

  const handleSaveSale = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      roast_batch_id: Number(saleForm.roast_batch_id),
      customer_id: saleForm.customer_id ? Number(saleForm.customer_id) : null,
      sale_date: saleForm.sale_date,
      quantity_kg: Number(saleForm.quantity_kg),
      price_per_kg: Number(saleForm.price_per_kg),
      notes: saleForm.notes
    };

    const errors: { quantity?: string; price?: string } = {};
    if (!payload.quantity_kg || Number.isNaN(payload.quantity_kg) || payload.quantity_kg <= 0) {
      errors.quantity = "Ingresa una cantidad mayor a cero";
    }

    if (payload.roast_batch_id && payload.quantity_kg > 0) {
      const available = getAvailableRoastedKg(payload.roast_batch_id, saleEditingId);
      if (payload.quantity_kg > available) {
        errors.quantity = `Solo hay ${available.toFixed(2)} kg tostados disponibles`;
      }
    }

    if (!payload.price_per_kg || Number.isNaN(payload.price_per_kg) || payload.price_per_kg <= 0) {
      errors.price = "Ingresa un precio por kg válido";
    }

    if (Object.keys(errors).length > 0) {
      setSaleErrors(errors);
      return;
    }

    setSaleErrors({});
    setSaleSaving(true);
    try {
      if (saleEditingId) {
        await updateSale(saleEditingId, payload);
      } else {
        await createSale(payload);
      }
      await loadData();
      resetSaleForm();
      setDialogOpen(false);
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
    setDialogOpen(true);
  };

  const handleDeleteRequest = (sale: Sale) => {
    setDeleteTarget(sale);
  };

  const handleDeleteCancel = () => {
    if (deleting) {
      return;
    }
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    try {
      await deleteSale(deleteTarget.id);
      await loadData();
    } catch (error) {
      console.error("Failed to delete sale", error);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleDialogClose = () => {
    if (saleSaving) {
      return;
    }
    setDialogOpen(false);
    resetSaleForm();
  };

  return (
    <Stack spacing={4}>
      <Card sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <CardHeader
          title="Historial de ventas"
          subheader={`${filteredSales.length} de ${sales.length} registros`}
          action={
            <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={openCreateDialog}>
              Nueva venta
            </Button>
          }
        />
        <CardContent sx={{ flexGrow: 1, overflowX: "auto" }}>
          <FilterPanel
            isDirty={isFiltering}
            onClear={() =>
              setFilters({
                dateFrom: "",
                dateTo: "",
                roastId: "",
                customerId: "",
                minQuantity: "",
                maxQuantity: "",
                minPrice: "",
                maxPrice: "",
                minTotal: "",
                maxTotal: "",
                notes: ""
              })
            }
          >
            <TextField
              label="Desde"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.dateFrom}
              onChange={handleFilterChange("dateFrom")}
            />
            <TextField
              label="Hasta"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.dateTo}
              onChange={handleFilterChange("dateTo")}
            />
            <TextField
              select
              label="Tostion"
              value={filters.roastId}
              onChange={handleFilterChange("roastId")}
            >
              <MenuItem value="">Todas</MenuItem>
              {roasts.map((roast) => (
                <MenuItem key={roast.id} value={String(roast.id)}>
                  Roast #{roast.id}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Cliente"
              value={filters.customerId}
              onChange={handleFilterChange("customerId")}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="none">Venta mostrador</MenuItem>
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={String(customer.id)}>
                  {customer.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Kg minimo"
              type="number"
              value={filters.minQuantity}
              onChange={handleFilterChange("minQuantity")}
            />
            <TextField
              label="Kg maximo"
              type="number"
              value={filters.maxQuantity}
              onChange={handleFilterChange("maxQuantity")}
            />
            <TextField
              label="Precio minimo"
              type="number"
              value={filters.minPrice}
              onChange={handleFilterChange("minPrice")}
            />
            <TextField
              label="Precio maximo"
              type="number"
              value={filters.maxPrice}
              onChange={handleFilterChange("maxPrice")}
            />
            <TextField
              label="Total minimo"
              type="number"
              value={filters.minTotal}
              onChange={handleFilterChange("minTotal")}
            />
            <TextField
              label="Total maximo"
              type="number"
              value={filters.maxTotal}
              onChange={handleFilterChange("maxTotal")}
            />
            <TextField
              label="Notas"
              value={filters.notes}
              onChange={handleFilterChange("notes")}
              placeholder="Buscar en notas"
            />
          </FilterPanel>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Venta</TableCell>
                <TableCell>Tostión</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell align="right">Kg</TableCell>
                <TableCell align="right">Precio/kg</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    {isFiltering
                      ? "No hay ventas que coincidan con los filtros."
                      : "No hay ventas registradas."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => {
                  const roast = roasts.find((candidate) => candidate.id === sale.roast_batch_id);
                  const lot = roast ? lots.find((candidate) => candidate.id === roast.lot_id) : undefined;
                  const varietyName = lot
                    ? varieties.find((variety) => variety.id === lot.variety_id)?.name ?? "Variedad desconocida"
                    : "Variedad desconocida";
                  const farmName = lot
                    ? farms.find((farm) => farm.id === lot.farm_id)?.name ?? "Finca desconocida"
                    : "Finca desconocida";
                  const process = lot?.process ?? "Proceso N/D";
                  const roastDate = roast ? new Date(roast.roast_date).toLocaleDateString() : "Fecha N/D";
                  const available = roast ? getAvailableRoastedKg(roast.id, sale.id) : 0;
                  const customerName = customers.find((c) => c.id === sale.customer_id)?.name ?? "Venta mostrador";

                  return (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" fontWeight={600}>
                            {`Venta #${sale.id}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(sale.sale_date).toLocaleDateString()}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" fontWeight={600}>
                            {`Roast #${sale.roast_batch_id} · ${varietyName}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {`${roastDate} · ${process} · ${farmName}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {`Disponible: ${available.toFixed(2)} kg`}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" fontWeight={600}>
                            {customerName}
                          </Typography>
                          {sale.customer_id === null ? (
                            <Typography variant="caption" color="text.secondary">
                              Venta mostrador
                            </Typography>
                          ) : null}
                        </Stack>
                      </TableCell>
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
                          <IconButton color="error" onClick={() => handleDeleteRequest(sale)}>
                            <DeleteRoundedIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar venta"
        description={
          deleteTarget
            ? `¿Deseas eliminar la venta del ${deleteTarget.sale_date}? Esta acción no se puede deshacer.`
            : undefined
        }
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Eliminar"
        loading={deleting}
      />
      <Dialog open={dialogOpen} onClose={handleDialogClose} fullWidth maxWidth="md">
        <DialogTitle>{saleEditingId ? "Editar venta" : "Registrar venta"}</DialogTitle>
        <Box component="form" id="sale-form" onSubmit={handleSaveSale} display="flex" flexDirection="column" gap={0}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              select
              label="Tostion"
              value={saleForm.roast_batch_id}
              onChange={(e) => setSaleForm((prev) => ({ ...prev, roast_batch_id: e.target.value }))}
              required
            >
              {roastOptions.map((roast) => {
                const lot = lots.find((candidate) => candidate.id === roast.lot_id);
                const varietyName = lot
                  ? varieties.find((variety) => variety.id === lot.variety_id)?.name ?? "Variedad desconocida"
                  : "Variedad desconocida";
                const farmName = lot
                  ? farms.find((farm) => farm.id === lot.farm_id)?.name ?? "Finca desconocida"
                  : "Finca desconocida";
                const process = lot?.process ?? "Proceso N/D";
                const roastDate = new Date(roast.roast_date).toLocaleDateString();
                const available = getAvailableRoastedKg(roast.id, saleEditingId);

                return (
                  <MenuItem key={roast.id} value={String(roast.id)}>
                    <Box display="flex" flexDirection="column" alignItems="flex-start">
                      <Typography variant="body2" fontWeight={600}>
                        {`Roast #${roast.id} · ${varietyName}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {`${roastDate} · ${process} · ${farmName} · Disponible: ${available.toFixed(2)} kg`}
                      </Typography>
                    </Box>
                  </MenuItem>
                );
              })}
            </TextField>
            <TextField
              select
              label="Cliente"
              value={saleForm.customer_id}
              onChange={(e) => setSaleForm((prev) => ({ ...prev, customer_id: e.target.value }))}
            >
              <MenuItem value="">Venta mostrador</MenuItem>
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={String(customer.id)}>
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
              error={Boolean(saleErrors.quantity)}
              helperText={
                saleErrors.quantity ??
                (availableForSelectedRoast != null
                  ? `Disponible: ${availableForSelectedRoast.toFixed(2)} kg`
                  : undefined)
              }
              inputProps={{ min: 0, step: "0.01" }}
              required
            />
            <TextField
              label="Precio por kg"
              type="number"
              value={saleForm.price_per_kg}
              onChange={(e) => setSaleForm((prev) => ({ ...prev, price_per_kg: e.target.value }))}
              error={Boolean(saleErrors.price)}
              helperText={saleErrors.price}
              inputProps={{ min: 0, step: "0.01" }}
              required
            />
            <TextField
              label="Notas"
              value={saleForm.notes}
              onChange={(e) => setSaleForm((prev) => ({ ...prev, notes: e.target.value }))}
              multiline
              rows={3}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose} disabled={saleSaving}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={saleSaving}>
              {saleEditingId ? "Actualizar" : "Crear"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
};

export default SalesPage;
