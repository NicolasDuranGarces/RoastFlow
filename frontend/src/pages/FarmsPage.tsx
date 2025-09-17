import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
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
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

import { createFarm, deleteFarm, fetchFarms, updateFarm } from "../services/api";
import type { Farm } from "../types";
import ConfirmDialog from "../components/ConfirmDialog";
import FilterPanel from "../components/FilterPanel";

const emptyForm = { name: "", location: "", notes: "" };

const FarmsPage = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ name: "", location: "", notes: "" });
  const [deleteTarget, setDeleteTarget] = useState<Farm | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadFarms = useMemo(
    () =>
      async () => {
        try {
          const { data } = await fetchFarms();
          setFarms(data as Farm[]);
        } catch (error) {
          console.error("Failed to load farms", error);
        }
      },
    []
  );

  useEffect(() => {
    void loadFarms();
  }, [loadFarms]);

  const filteredFarms = useMemo(() => {
    const nameFilter = filters.name.toLowerCase();
    const locationFilter = filters.location.toLowerCase();
    const notesFilter = filters.notes.toLowerCase();
    return farms.filter((farm) => {
      const matchesName = farm.name.toLowerCase().includes(nameFilter);
      const matchesLocation = (farm.location ?? "").toLowerCase().includes(locationFilter);
      const matchesNotes = (farm.notes ?? "").toLowerCase().includes(notesFilter);
      return matchesName && matchesLocation && matchesNotes;
    });
  }, [farms, filters]);

  const isFiltering = useMemo(
    () => Object.values(filters).some((value) => value.toString().trim() !== ""),
    [filters]
  );

  const resetForm = () => {
    setForm(emptyForm);
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
      if (editingId) {
        await updateFarm(editingId, form);
      } else {
        await createFarm(form);
      }
      resetForm();
      await loadFarms();
    } catch (error) {
      console.error("Failed to save farm", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (farm: Farm) => {
    setEditingId(farm.id);
    setForm({ name: farm.name, location: farm.location ?? "", notes: farm.notes ?? "" });
  };

  const handleDeleteRequest = (farm: Farm) => {
    setDeleteTarget(farm);
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
      await deleteFarm(deleteTarget.id);
      await loadFarms();
    } catch (error) {
      console.error("Failed to delete farm", error);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <Grid container spacing={4} sx={{ height: "100%" }}>
      <Grid item xs={12} md={5}>
        <Card sx={{ height: "100%" }}>
          <CardHeader title={editingId ? "Editar finca" : "Registrar finca"} subheader="Gestiona las fincas proveedoras" />
          <CardContent>
            <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Nombre"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
              <TextField
                label="Ubicacion"
                value={form.location}
                onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
              />
              <TextField
                label="Notas"
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                multiline
                minRows={3}
              />
              <Box display="flex" gap={2}>
                <Button type="submit" variant="contained" disabled={saving}>
                  {editingId ? "Actualizar" : "Crear"}
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
      <Grid item xs={12} md={7}>
        <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <CardHeader
            title="Fincas registradas"
            subheader={`${filteredFarms.length} de ${farms.length} registros`}
          />
          <CardContent sx={{ flexGrow: 1, overflowX: "auto" }}>
            <FilterPanel
              isDirty={isFiltering}
              onClear={() => setFilters({ name: "", location: "", notes: "" })}
            >
              <TextField
                label="Nombre"
                value={filters.name}
                onChange={handleFilterChange("name")}
                placeholder="Filtrar por nombre"
              />
              <TextField
                label="Ubicacion"
                value={filters.location}
                onChange={handleFilterChange("location")}
                placeholder="Filtrar por ubicacion"
              />
              <TextField
                label="Notas"
                value={filters.notes}
                onChange={handleFilterChange("notes")}
                placeholder="Filtrar por notas"
              />
            </FilterPanel>
            {filteredFarms.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {isFiltering ? "No hay fincas que coincidan con los filtros." : "No hay fincas registradas."}
              </Typography>
            ) : (
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Ubicacion</TableCell>
                    <TableCell>Notas</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredFarms.map((farm) => (
                    <TableRow key={farm.id} hover>
                      <TableCell>{farm.name}</TableCell>
                      <TableCell>{farm.location}</TableCell>
                      <TableCell>{farm.notes}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar">
                          <IconButton color="primary" onClick={() => handleEdit(farm)}>
                            <EditRoundedIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton color="error" onClick={() => handleDeleteRequest(farm)}>
                            <DeleteRoundedIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Grid>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar finca"
        description={
          deleteTarget ? `¿Deseas eliminar la finca "${deleteTarget.name}"? Esta acción no se puede deshacer.` : undefined
        }
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Eliminar"
        loading={deleting}
      />
    </Grid>
  );
};

export default FarmsPage;
