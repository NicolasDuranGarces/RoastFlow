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
  Tooltip
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

import { createLot, deleteLot, fetchFarms, fetchLots, fetchVarieties, updateLot } from "../services/api";
import type { CoffeeLot, Farm, Variety } from "../types";
import ConfirmDialog from "../components/ConfirmDialog";
import FilterPanel from "../components/FilterPanel";

const processOptions = ["Lavado", "Semilavado", "Honey", "Natural"];

const initialForm = {
  farm_id: "",
  variety_id: "",
  process: processOptions[0],
  purchase_date: new Date().toISOString().slice(0, 10),
  green_weight_kg: "",
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
        if (!Number.isNaN(minWeight) && lot.green_weight_kg < minWeight) {
          return false;
        }
      }
      if (filters.maxWeight) {
        const maxWeight = Number(filters.maxWeight);
        if (!Number.isNaN(maxWeight) && lot.green_weight_kg > maxWeight) {
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

  const isFiltering = useMemo(
    () => Object.values(filters).some((value) => value.toString().trim() !== ""),
    [filters]
  );

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
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
        green_weight_kg: Number(form.green_weight_kg),
        price_per_kg: Number(form.price_per_kg),
        moisture_level: form.moisture_level ? Number(form.moisture_level) : null,
        notes: form.notes
      };
      if (editingId) {
        await updateLot(editingId, payload);
      } else {
        await createLot(payload);
      }
      resetForm();
      await loadData();
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
      green_weight_kg: String(lot.green_weight_kg),
      price_per_kg: String(lot.price_per_kg),
      moisture_level: lot.moisture_level ? String(lot.moisture_level) : "",
      notes: lot.notes ?? ""
    });
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

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card sx={{ height: "100%" }}>
          <CardHeader title={editingId ? "Editar lote" : "Registrar compra cafe verde"} />
          <CardContent>
            <Box component="form" display="flex" flexDirection="column" gap={2} onSubmit={handleSubmit}>
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
                label="Peso verde (kg)"
                type="number"
                value={form.green_weight_kg}
                onChange={(e) => setForm((prev) => ({ ...prev, green_weight_kg: e.target.value }))}
                inputProps={{ min: 0, step: "0.01" }}
                required
              />
              <TextField
                label="Precio por kg"
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
                rows={3}
              />
              <Box display="flex" gap={2}>
                <Button type="submit" variant="contained" disabled={saving}>
                  {editingId ? "Actualizar" : "Guardar lote"}
                </Button>
                {editingId && (
                  <Button variant="outlined" onClick={resetForm} disabled={saving}>
                    Cancelar
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={8}>
        <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <CardHeader
            title="Lotes registrados"
            subheader={`${filteredLots.length} de ${lots.length} registros`}
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
                label="Kg minimo"
                type="number"
                value={filters.minWeight}
                onChange={handleFilterChange("minWeight")}
              />
              <TextField
                label="Kg maximo"
                type="number"
                value={filters.maxWeight}
                onChange={handleFilterChange("maxWeight")}
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
            </FilterPanel>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Finca</TableCell>
                  <TableCell>Variedad</TableCell>
                  <TableCell>Proceso</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="right">Kg verdes</TableCell>
                  <TableCell align="right">Precio/kg</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {filteredLots.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      {isFiltering
                        ? "No hay lotes que coincidan con los filtros."
                        : "No hay lotes registrados."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLots.map((lot) => (
                    <TableRow key={lot.id}>
                      <TableCell>{farms.find((f) => f.id === lot.farm_id)?.name ?? ""}</TableCell>
                      <TableCell>{varieties.find((v) => v.id === lot.variety_id)?.name ?? ""}</TableCell>
                      <TableCell>{lot.process}</TableCell>
                      <TableCell>{lot.purchase_date}</TableCell>
                      <TableCell align="right">{lot.green_weight_kg.toFixed(2)}</TableCell>
                      <TableCell align="right">${lot.price_per_kg.toFixed(2)}</TableCell>
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
          </CardContent>
        </Card>
      </Grid>
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
    </Grid>
  );
};

export default LotsPage;
