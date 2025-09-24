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
  Tooltip,
  Typography
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { createRoast, deleteRoast, fetchFarms, fetchLots, fetchRoasts, fetchVarieties, updateRoast } from "../services/api";
import type { CoffeeLot, Farm, RoastBatch, Variety } from "../types";
import ConfirmDialog from "../components/ConfirmDialog";
import FilterPanel from "../components/FilterPanel";

const formatGrams = (value: number) =>
  value.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const initialForm = {
  lot_id: "",
  roast_date: new Date().toISOString().slice(0, 10),
  green_input_g: "",
  roasted_output_g: "",
  roast_level: "",
  notes: ""
};

const MIN_AVAILABLE_GREEN_G = 200;

const RoastsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [lots, setLots] = useState<CoffeeLot[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [roasts, setRoasts] = useState<RoastBatch[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ green?: string; roasted?: string }>({});
  const [filters, setFilters] = useState({
    lotId: "",
    dateFrom: "",
    dateTo: "",
    minGreen: "",
    maxGreen: "",
    minRoasted: "",
    maxRoasted: "",
    roastLevel: "",
    varietyId: ""
  });
  const [deleteTarget, setDeleteTarget] = useState<RoastBatch | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadData = useMemo(
    () =>
      async () => {
        try {
          const [lotsRes, roastsRes, farmsRes, varietiesRes] = await Promise.all([
            fetchLots(),
            fetchRoasts(),
            fetchFarms(),
            fetchVarieties()
          ]);
          setLots(lotsRes.data as CoffeeLot[]);
          setRoasts(roastsRes.data as RoastBatch[]);
          setFarms(farmsRes.data as Farm[]);
          setVarieties(varietiesRes.data as Variety[]);
        } catch (error) {
          console.error("Failed to load roasts", error);
        }
      },
    []
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const state = location.state as { prefilters?: Partial<typeof filters> } | undefined;
    if (state?.prefilters) {
      setFilters((prev) => ({ ...prev, ...state.prefilters }));
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const getAvailableGreenGrams = (lotId: number, ignoreRoastId: number | null) => {
    const lot = lots.find((candidate) => candidate.id === lotId);
    if (!lot) {
      return 0;
    }
    const used = roasts.reduce((total, roast) => {
      if (roast.lot_id !== lotId) {
        return total;
      }
      if (ignoreRoastId && roast.id === ignoreRoastId) {
        return total;
      }
      return total + roast.green_input_g;
    }, 0);
    return Math.max(0, lot.green_weight_g - used);
  };

  const availableGreenForSelectedLot = useMemo(() => {
    if (!form.lot_id) {
      return null;
    }
    return getAvailableGreenGrams(Number(form.lot_id), editingId);
  }, [form.lot_id, editingId, lots, roasts]);

  const lotOptions = useMemo(() => {
    return lots.filter((lot) => {
      const available = getAvailableGreenGrams(lot.id, editingId);
      if (editingId && Number(form.lot_id) === lot.id) {
        return true;
      }
      return available >= MIN_AVAILABLE_GREEN_G;
    });
  }, [editingId, form.lot_id, lots, roasts]);

  const filteredRoasts = useMemo(() => {
    return roasts.filter((roast) => {
      if (filters.lotId && roast.lot_id !== Number(filters.lotId)) {
        return false;
      }
      if (filters.dateFrom && roast.roast_date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && roast.roast_date > filters.dateTo) {
        return false;
      }
      if (filters.minGreen) {
        const min = Number(filters.minGreen);
        if (!Number.isNaN(min) && roast.green_input_g < min) {
          return false;
        }
      }
      if (filters.maxGreen) {
        const max = Number(filters.maxGreen);
        if (!Number.isNaN(max) && roast.green_input_g > max) {
          return false;
        }
      }
      if (filters.minRoasted) {
        const min = Number(filters.minRoasted);
        if (!Number.isNaN(min) && roast.roasted_output_g < min) {
          return false;
        }
      }
      if (filters.maxRoasted) {
        const max = Number(filters.maxRoasted);
        if (!Number.isNaN(max) && roast.roasted_output_g > max) {
          return false;
        }
      }
      if (filters.roastLevel && !(roast.roast_level ?? "").toLowerCase().includes(filters.roastLevel.toLowerCase())) {
        return false;
      }
      if (filters.varietyId) {
        const lot = lots.find((candidate) => candidate.id === roast.lot_id);
        if (!lot || String(lot.variety_id) !== filters.varietyId) {
          return false;
        }
      }
      return true;
    });
  }, [filters, roasts, lots]);

  const sortedRoasts = useMemo(() => {
    return [...filteredRoasts].sort((a, b) => {
      const dateDiff = new Date(b.roast_date).getTime() - new Date(a.roast_date).getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }
      return b.id - a.id;
    });
  }, [filteredRoasts]);

  const paginatedRoasts = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedRoasts.slice(start, start + rowsPerPage);
  }, [sortedRoasts, page, rowsPerPage]);

  const isFiltering = useMemo(
    () => Object.values(filters).some((value) => value.toString().trim() !== ""),
    [filters]
  );

  useEffect(() => {
    setPage(0);
  }, [filteredRoasts.length]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setErrors({});
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
    const payload = {
      lot_id: Number(form.lot_id),
      roast_date: form.roast_date,
      green_input_g: Number(form.green_input_g),
      roasted_output_g: Number(form.roasted_output_g),
      roast_level: form.roast_level,
      notes: form.notes
    };

    const nextErrors: { green?: string; roasted?: string } = {};
    if (!payload.green_input_g || Number.isNaN(payload.green_input_g) || payload.green_input_g <= 0) {
      nextErrors.green = "Ingresa gramos verdes mayores a cero";
    } else if (payload.lot_id) {
      const available = getAvailableGreenGrams(payload.lot_id, editingId);
      if (payload.green_input_g > available) {
        nextErrors.green = `Solo hay ${formatGrams(available)} g verdes disponibles`;
      }
    }

    if (!payload.roasted_output_g || Number.isNaN(payload.roasted_output_g) || payload.roasted_output_g <= 0) {
      nextErrors.roasted = "Ingresa gramos tostados mayores a cero";
    } else if (!nextErrors.green && payload.roasted_output_g > payload.green_input_g) {
      nextErrors.roasted = "El tostado no puede superar al verde";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      if (editingId) {
        await updateRoast(editingId, payload);
      } else {
        await createRoast(payload);
      }
      await loadData();
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to save roast", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (roast: RoastBatch) => {
    setEditingId(roast.id);
    setForm({
      lot_id: String(roast.lot_id),
      roast_date: roast.roast_date,
      green_input_g: String(roast.green_input_g),
      roasted_output_g: String(roast.roasted_output_g),
      roast_level: roast.roast_level ?? "",
      notes: roast.notes ?? ""
    });
    setDialogOpen(true);
  };

  const handleDeleteRequest = (roast: RoastBatch) => {
    setDeleteTarget(roast);
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
      await deleteRoast(deleteTarget.id);
      await loadData();
    } catch (error) {
      console.error("Failed to delete roast", error);
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
          title="Historial tostiones"
          subheader={`${sortedRoasts.length} de ${roasts.length} registros`}
          action={
            <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={openCreateDialog}>
              Nueva tostion
            </Button>
          }
        />
        <CardContent sx={{ flexGrow: 1, overflowX: "auto" }}>
          <FilterPanel
            isDirty={isFiltering}
            onClear={() =>
              setFilters({
                lotId: "",
                dateFrom: "",
                dateTo: "",
                minGreen: "",
                maxGreen: "",
                minRoasted: "",
                maxRoasted: "",
                roastLevel: "",
                varietyId: ""
              })
            }
          >
            <TextField
              select
              label="Lote"
              value={filters.lotId}
              onChange={handleFilterChange("lotId")}
            >
              <MenuItem value="">Todos</MenuItem>
              {lots.map((lot) => {
                const varietyName = varieties.find((v) => v.id === lot.variety_id)?.name ?? "Variedad";
                const farmName = farms.find((f) => f.id === lot.farm_id)?.name ?? "Finca";
                return (
                  <MenuItem key={lot.id} value={String(lot.id)}>
                    <Box display="flex" flexDirection="column" alignItems="flex-start">
                      <Typography variant="body2" fontWeight={600}>
                        {`Lote #${lot.id} · ${varietyName}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {`${new Date(lot.purchase_date).toLocaleDateString()} · ${lot.process} · ${farmName}`}
                      </Typography>
                    </Box>
                  </MenuItem>
                );
              })}
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
              label="Gramos verdes min"
              type="number"
              value={filters.minGreen}
              onChange={handleFilterChange("minGreen")}
            />
            <TextField
              label="Gramos verdes max"
              type="number"
              value={filters.maxGreen}
              onChange={handleFilterChange("maxGreen")}
            />
            <TextField
              label="Gramos tostados min"
              type="number"
              value={filters.minRoasted}
              onChange={handleFilterChange("minRoasted")}
            />
            <TextField
              label="Gramos tostados max"
              type="number"
              value={filters.maxRoasted}
              onChange={handleFilterChange("maxRoasted")}
            />
            <TextField
              label="Nivel de tueste"
              value={filters.roastLevel}
              onChange={handleFilterChange("roastLevel")}
              placeholder="Filtrar por nivel"
            />
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
          </FilterPanel>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Tostión</TableCell>
                <TableCell>Origen</TableCell>
                <TableCell align="right">Gramos verdes</TableCell>
                <TableCell align="right">Gramos tostados</TableCell>
                <TableCell align="right">Merma %</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedRoasts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" color="text.secondary">
                      {isFiltering
                        ? "No hay tostiones que coincidan con los filtros."
                        : "No hay tostiones registradas."}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRoasts.map((roast) => {
                  const lot = lots.find((candidate) => candidate.id === roast.lot_id);
                  const varietyName = lot
                    ? varieties.find((variety) => variety.id === lot.variety_id)?.name ?? "Variedad desconocida"
                    : "Variedad desconocida";
                  const farmName = lot
                    ? farms.find((farm) => farm.id === lot.farm_id)?.name ?? "Finca desconocida"
                    : "Finca desconocida";
                  const process = lot?.process ?? "Proceso N/D";
                  const roastDate = new Date(roast.roast_date).toLocaleDateString();

                  return (
                    <TableRow key={roast.id}>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" fontWeight={600}>
                            {`Roast #${roast.id}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {`Fecha ${roastDate}`}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" fontWeight={600}>
                            {varietyName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {`${process} · ${farmName}`}
                          </Typography>
                          {lot ? (
                            <Typography variant="caption" color="text.secondary">
                              {`Compra ${new Date(lot.purchase_date).toLocaleDateString()}`}
                            </Typography>
                          ) : null}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">{formatGrams(roast.green_input_g)}</TableCell>
                      <TableCell align="right">{formatGrams(roast.roasted_output_g)}</TableCell>
                      <TableCell align="right">{roast.shrinkage_pct.toFixed(2)}%</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Ver ventas relacionadas">
                            <IconButton
                              size="small"
                              onClick={() =>
                                navigate("/sales", {
                                  state: { prefilters: { roastId: String(roast.id) } }
                                })
                              }
                            >
                              <ShoppingCartRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton color="primary" size="small" onClick={() => handleEdit(roast)}>
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton color="error" size="small" onClick={() => handleDeleteRequest(roast)}>
                              <DeleteRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={sortedRoasts.length}
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
        title="Eliminar tostion"
        description={
          deleteTarget
            ? `¿Deseas eliminar la tostion realizada el ${deleteTarget.roast_date}? Esta acción no se puede deshacer.`
            : undefined
        }
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Eliminar"
        loading={deleting}
      />
      <Dialog open={dialogOpen} onClose={handleDialogClose} fullWidth maxWidth="md">
        <DialogTitle>{editingId ? "Editar tostion" : "Registrar tostion"}</DialogTitle>
        <Box component="form" id="roast-form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={0}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              select
              label="Lote"
              value={form.lot_id}
              onChange={(e) => setForm((prev) => ({ ...prev, lot_id: e.target.value }))}
              required
            >
              {lotOptions.map((lot) => {
                const farmName = farms.find((farm) => farm.id === lot.farm_id)?.name ?? "Finca desconocida";
                const varietyName =
                  varieties.find((variety) => variety.id === lot.variety_id)?.name ?? "Variedad desconocida";
                const formattedDate = new Date(lot.purchase_date).toLocaleDateString();
                const available = getAvailableGreenGrams(lot.id, editingId);

                return (
                  <MenuItem key={lot.id} value={String(lot.id)}>
                    <Box display="flex" flexDirection="column" alignItems="flex-start">
                      <Typography variant="body2" fontWeight={600}>
                        {`Lote #${lot.id} · ${varietyName}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {`${formattedDate} · ${lot.process} · ${farmName} · Disponible: ${formatGrams(available)} g`}
                      </Typography>
                    </Box>
                  </MenuItem>
                );
              })}
            </TextField>
            <TextField
              label="Fecha"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.roast_date}
              onChange={(e) => setForm((prev) => ({ ...prev, roast_date: e.target.value }))}
              required
            />
            <TextField
              label="Gramos verdes"
              type="number"
              value={form.green_input_g}
              onChange={(e) => setForm((prev) => ({ ...prev, green_input_g: e.target.value }))}
              error={Boolean(errors.green)}
              helperText={
                errors.green ??
                (availableGreenForSelectedLot != null
                  ? `Disponible: ${formatGrams(availableGreenForSelectedLot)} g`
                  : undefined)
              }
              inputProps={{ min: 0, step: "1" }}
              required
            />
            <TextField
              label="Gramos tostados"
              type="number"
              value={form.roasted_output_g}
              onChange={(e) => setForm((prev) => ({ ...prev, roasted_output_g: e.target.value }))}
              error={Boolean(errors.roasted)}
              helperText={errors.roasted}
              inputProps={{ min: 0, step: "1" }}
              required
            />
            <TextField
              label="Nivel de tueste"
              value={form.roast_level}
              onChange={(e) => setForm((prev) => ({ ...prev, roast_level: e.target.value }))}
            />
            <TextField
              label="Notas"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              multiline
              rows={3}
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

export default RoastsPage;
