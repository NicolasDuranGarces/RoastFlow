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
  TablePagination,
  TextField,
  Tooltip
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

import { createLot, deleteLot, fetchFarms, fetchLots, fetchVarieties, updateLot } from "../services/api";
import type { CoffeeLot, Farm, Variety } from "../types";
import ConfirmDialog from "../components/ConfirmDialog";
import FilterPanel from "../components/FilterPanel";

const processOptions = ["Lavado", "Semilavado", "Honey", "Natural"];

const formatGrams = (value: number) =>
  value.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const formatPricePerKg = (value: number) =>
  value.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const initialForm = {
  farm_id: "",
  variety_id: "",
  process: processOptions[0],
  purchase_date: new Date().toISOString().slice(0, 10),
  green_weight_g: "",
  price_per_kg: "",
  moisture_level: "",
  notes: ""
};

const LotsPage = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [lots, setLots] = useState<CoffeeLot[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({
    farmId: "",
    varietyId: "",
    process: "",
    dateFrom: "",
    dateTo: "",
    minWeight: "",
    maxWeight: "",
    minPrice: "",
    maxPrice: ""
  });
  const [deleteTarget, setDeleteTarget] = useState<CoffeeLot | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadData = useMemo(
    () =>
      async () => {
        try {
          const [farmsRes, varietiesRes, lotsRes] = await Promise.all([
            fetchFarms(),
            fetchVarieties(),
            fetchLots()
          ]);
          setFarms(farmsRes.data as Farm[]);
          setVarieties(varietiesRes.data as Variety[]);
          setLots(lotsRes.data as CoffeeLot[]);
        } catch (error) {
          console.error("Failed to load lots", error);
        }
      },
    []
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredLots = useMemo(() => {
    return lots.filter((lot) => {
      if (filters.farmId && lot.farm_id !== Number(filters.farmId)) {
        return false;
      }
      if (filters.varietyId && lot.variety_id !== Number(filters.varietyId)) {
        return false;
      }
      if (filters.process && lot.process !== filters.process) {
        return false;
      }
      if (filters.dateFrom && lot.purchase_date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && lot.purchase_date > filters.dateTo) {
        return false;
      }
      if (filters.minWeight) {
        const minWeight = Number(filters.minWeight);
        if (!Number.isNaN(minWeight) && lot.green_weight_g < minWeight) {
          return false;
        }
      }
      if (filters.maxWeight) {
        const maxWeight = Number(filters.maxWeight);
        if (!Number.isNaN(maxWeight) && lot.green_weight_g > maxWeight) {
          return false;
        }
      }
      if (filters.minPrice) {
        const minPrice = Number(filters.minPrice);
        if (!Number.isNaN(minPrice) && lot.price_per_kg < minPrice) {
          return false;
        }
      }
      if (filters.maxPrice) {
        const maxPrice = Number(filters.maxPrice);
        if (!Number.isNaN(maxPrice) && lot.price_per_kg > maxPrice) {
          return false;
        }
      }
      return true;
    });
  }, [filters, lots]);

  const sortedLots = useMemo(() => {
    return [...filteredLots].sort((a, b) => {
      const dateDiff = new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }
      return b.id - a.id;
    });
  }, [filteredLots]);

  const paginatedLots = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedLots.slice(start, start + rowsPerPage);
  }, [sortedLots, page, rowsPerPage]);

  const isFiltering = useMemo(
    () => Object.values(filters).some((value) => value.toString().trim() !== ""),
    [filters]
  );

  useEffect(() => {
    setPage(0);
  }, [filteredLots.length]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleFilterChange = (field: keyof typeof filters) => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setFilters((prev) => ({ ...prev, [field]: value.toString() }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        farm_id: Number(form.farm_id),
        variety_id: Number(form.variety_id),
        process: form.process,
        purchase_date: form.purchase_date,
        green_weight_g: Number(form.green_weight_g),
        price_per_kg: Number(form.price_per_kg),
        moisture_level: form.moisture_level ? Number(form.moisture_level) : null,
        notes: form.notes
      };
      if (editingId) {
        await updateLot(editingId, payload);
      } else {
        await createLot(payload);
      }
      await loadData();
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to save lot", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (lot: CoffeeLot) => {
    setEditingId(lot.id);
    setForm({
      farm_id: String(lot.farm_id),
      variety_id: String(lot.variety_id),
      process: lot.process,
      purchase_date: lot.purchase_date,
      green_weight_g: String(lot.green_weight_g),
      price_per_kg: String(lot.price_per_kg),
      moisture_level: lot.moisture_level ? String(lot.moisture_level) : "",
      notes: lot.notes ?? ""
    });
    setDialogOpen(true);
  };

  const handleDeleteRequest = (lot: CoffeeLot) => {
    setDeleteTarget(lot);
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
      await deleteLot(deleteTarget.id);
      await loadData();
    } catch (error) {
      console.error("Failed to delete lot", error);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleDialogClose = () => {
    if (saving) {
      return;
    }
    setDialogOpen(false);
    resetForm();
  };

  return (
    <Stack spacing={4}>
      <Card sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <CardHeader
          title="Lotes registrados"
          subheader={`${sortedLots.length} de ${lots.length} registros`}
          action={
            <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={openCreateDialog}>
              Nuevo lote
            </Button>
          }
        />
        <CardContent sx={{ flexGrow: 1, overflowX: "auto" }}>
          <FilterPanel
            isDirty={isFiltering}
            onClear={() =>
              setFilters({
                farmId: "",
                varietyId: "",
                process: "",
                dateFrom: "",
                dateTo: "",
                minWeight: "",
                maxWeight: "",
                minPrice: "",
                maxPrice: ""
              })
            }
          >
            <TextField
              select
              label="Finca"
              value={filters.farmId}
              onChange={handleFilterChange("farmId")}
            >
              <MenuItem value="">Todas</MenuItem>
              {farms.map((farm) => (
                <MenuItem key={farm.id} value={String(farm.id)}>
                  {farm.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Variedad"
              value={filters.varietyId}
              onChange={handleFilterChange("varietyId")}
            >
              <MenuItem value="">Todas</MenuItem>
              {varieties.map((variety) => (
                <MenuItem key={variety.id} value={String(variety.id)}>
                  {variety.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Proceso"
              value={filters.process}
              onChange={handleFilterChange("process")}
            >
              <MenuItem value="">Todos</MenuItem>
              {processOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
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
              label="Gramos mínimos"
              type="number"
              value={filters.minWeight}
              onChange={handleFilterChange("minWeight")}
            />
            <TextField
              label="Gramos máximos"
              type="number"
              value={filters.maxWeight}
              onChange={handleFilterChange("maxWeight")}
            />
            <TextField
              label="Precio mínimo (por kg)"
              type="number"
              value={filters.minPrice}
              onChange={handleFilterChange("minPrice")}
            />
            <TextField
              label="Precio máximo (por kg)"
              type="number"
              value={filters.maxPrice}
              onChange={handleFilterChange("maxPrice")}
            />
          </FilterPanel>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Finca</TableCell>
                <TableCell>Variedad</TableCell>
                <TableCell>Proceso</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell align="right">Gramos verdes</TableCell>
                <TableCell align="right">Precio/kg</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedLots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    {isFiltering
                      ? "No hay lotes que coincidan con los filtros."
                      : "No hay lotes registrados."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLots.map((lot) => (
                  <TableRow key={lot.id}>
                    <TableCell>{farms.find((f) => f.id === lot.farm_id)?.name ?? ""}</TableCell>
                    <TableCell>{varieties.find((v) => v.id === lot.variety_id)?.name ?? ""}</TableCell>
                    <TableCell>{lot.process}</TableCell>
                    <TableCell>{lot.purchase_date}</TableCell>
                    <TableCell align="right">{formatGrams(lot.green_weight_g)}</TableCell>
                    <TableCell align="right">${formatPricePerKg(lot.price_per_kg)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton color="primary" onClick={() => handleEdit(lot)}>
                          <EditRoundedIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton color="error" onClick={() => handleDeleteRequest(lot)}>
                          <DeleteRoundedIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={sortedLots.length}
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
        </CardContent>
      </Card>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar lote"
        description={
          deleteTarget
            ? `¿Deseas eliminar el lote registrado el ${deleteTarget.purchase_date}? Esta acción no se puede deshacer.`
            : undefined
        }
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Eliminar"
        loading={deleting}
      />
      <Dialog open={dialogOpen} onClose={handleDialogClose} fullWidth maxWidth="md">
        <DialogTitle>{editingId ? "Editar lote" : "Registrar compra cafe verde"}</DialogTitle>
        <Box component="form" id="lot-form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={0}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              select
              label="Finca"
              value={form.farm_id}
              onChange={(e) => setForm((prev) => ({ ...prev, farm_id: e.target.value }))}
              required
            >
              {farms.map((farm) => (
                <MenuItem key={farm.id} value={String(farm.id)}>
                  {farm.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Variedad"
              value={form.variety_id}
              onChange={(e) => setForm((prev) => ({ ...prev, variety_id: e.target.value }))}
              required
            >
              {varieties.map((variety) => (
                <MenuItem key={variety.id} value={String(variety.id)}>
                  {variety.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Proceso"
              value={form.process}
              onChange={(e) => setForm((prev) => ({ ...prev, process: e.target.value }))}
              required
            >
              {processOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
              {!processOptions.includes(form.process) && form.process && (
                <MenuItem value={form.process}>{form.process}</MenuItem>
              )}
            </TextField>
            <TextField
              label="Fecha compra"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.purchase_date}
              onChange={(e) => setForm((prev) => ({ ...prev, purchase_date: e.target.value }))}
              required
            />
            <TextField
              label="Peso verde (g)"
              type="number"
              value={form.green_weight_g}
              onChange={(e) => setForm((prev) => ({ ...prev, green_weight_g: e.target.value }))}
              inputProps={{ min: 0, step: "1" }}
              required
            />
            <TextField
              label="Precio por kilo"
              type="number"
              value={form.price_per_kg}
              onChange={(e) => setForm((prev) => ({ ...prev, price_per_kg: e.target.value }))}
              inputProps={{ min: 0, step: "0.01" }}
              required
            />
            <TextField
              label="Humedad (%)"
              type="number"
              value={form.moisture_level}
              onChange={(e) => setForm((prev) => ({ ...prev, moisture_level: e.target.value }))}
              inputProps={{ min: 0, max: 100, step: "0.01" }}
            />
            <TextField
              label="Notas"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              multiline
              minRows={3}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {editingId ? "Actualizar" : "Crear"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
};

export default LotsPage;
