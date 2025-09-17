import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  IconButton,
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
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

import { createVariety, deleteVariety, fetchVarieties, updateVariety } from "../services/api";
import type { Variety } from "../types";
import ConfirmDialog from "../components/ConfirmDialog";
import FilterPanel from "../components/FilterPanel";

const emptyForm = { name: "", description: "" };

const VarietiesPage = () => {
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ name: "", description: "" });
  const [deleteTarget, setDeleteTarget] = useState<Variety | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formOpen, setFormOpen] = useState(true);

  const loadVarieties = useMemo(
    () =>
      async () => {
        try {
          const { data } = await fetchVarieties();
          setVarieties(data as Variety[]);
        } catch (error) {
          console.error("Failed to load varieties", error);
        }
      },
    []
  );

  useEffect(() => {
    void loadVarieties();
  }, [loadVarieties]);

  const filteredVarieties = useMemo(() => {
    const nameFilter = filters.name.toLowerCase();
    const descriptionFilter = filters.description.toLowerCase();
    return varieties.filter((variety) => {
      const matchesName = variety.name.toLowerCase().includes(nameFilter);
      const matchesDescription = (variety.description ?? "").toLowerCase().includes(descriptionFilter);
      return matchesName && matchesDescription;
    });
  }, [filters, varieties]);

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
        await updateVariety(editingId, form);
      } else {
        await createVariety(form);
      }
      resetForm();
      await loadVarieties();
    } catch (error) {
      console.error("Failed to save variety", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (variety: Variety) => {
    setEditingId(variety.id);
    setForm({ name: variety.name, description: variety.description ?? "" });
  };

  const handleDeleteRequest = (variety: Variety) => {
    setDeleteTarget(variety);
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
      await deleteVariety(deleteTarget.id);
      await loadVarieties();
    } catch (error) {
      console.error("Failed to delete variety", error);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <Stack spacing={4} sx={{ height: "100%" }}>
      <Card>
        <CardHeader
          title={editingId ? "Editar variedad" : "Registrar variedad"}
          subheader="Gestiona variedades y procesos"
          action={
            <Button size="small" onClick={() => setFormOpen((prev) => !prev)}>
              {formOpen ? "Ocultar" : "Mostrar"}
            </Button>
          }
        />
        <Collapse in={formOpen} timeout="auto" unmountOnExit>
          <CardContent>
            <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Nombre"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
              <TextField
                label="Descripcion"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
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
        </Collapse>
      </Card>
      <Card sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <CardHeader
          title="Variedades registradas"
          subheader={`${filteredVarieties.length} de ${varieties.length} registros`}
        />
        <CardContent sx={{ flexGrow: 1, overflowX: "auto" }}>
            <FilterPanel
              isDirty={isFiltering}
              onClear={() => setFilters({ name: "", description: "" })}
            >
              <TextField
                label="Nombre"
                value={filters.name}
                onChange={handleFilterChange("name")}
                placeholder="Filtrar por nombre"
              />
              <TextField
                label="Descripcion"
                value={filters.description}
                onChange={handleFilterChange("description")}
                placeholder="Filtrar por descripcion"
              />
            </FilterPanel>
            {filteredVarieties.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {isFiltering
                  ? "No hay variedades que coincidan con los filtros."
                  : "No hay variedades registradas."}
              </Typography>
            ) : (
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Descripcion</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredVarieties.map((variety) => (
                    <TableRow key={variety.id} hover>
                      <TableCell>{variety.name}</TableCell>
                      <TableCell>{variety.description}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar">
                          <IconButton color="primary" onClick={() => handleEdit(variety)}>
                            <EditRoundedIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton color="error" onClick={() => handleDeleteRequest(variety)}>
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
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar variedad"
        description={
          deleteTarget
            ? `¿Deseas eliminar la variedad "${deleteTarget.name}"? Esta acción no se puede deshacer.`
            : undefined
        }
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Eliminar"
        loading={deleting}
      />
    </Stack>
  );
};

export default VarietiesPage;
