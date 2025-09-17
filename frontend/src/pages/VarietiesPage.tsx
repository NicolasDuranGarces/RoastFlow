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
import { FormEvent, useEffect, useMemo, useState } from "react";

import { createVariety, deleteVariety, fetchVarieties, updateVariety } from "../services/api";
import type { Variety } from "../types";

const emptyForm = { name: "", description: "" };

const VarietiesPage = () => {
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

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

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
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

  const handleDelete = async (variety: Variety) => {
    if (!window.confirm(`Eliminar variedad "${variety.name}"?`)) {
      return;
    }
    try {
      await deleteVariety(variety.id);
      await loadVarieties();
    } catch (error) {
      console.error("Failed to delete variety", error);
    }
  };

  return (
    <Grid container spacing={4} sx={{ height: "100%" }}>
      <Grid item xs={12} md={5}>
        <Card sx={{ height: "100%" }}>
          <CardHeader title={editingId ? "Editar variedad" : "Registrar variedad"} subheader="Gestiona variedades y procesos" />
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
        </Card>
      </Grid>
      <Grid item xs={12} md={7}>
        <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <CardHeader title="Variedades registradas" subheader={`${varieties.length} registros`} />
          <CardContent sx={{ flexGrow: 1, overflowX: "auto" }}>
            {varieties.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay variedades registradas.
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
                  {varieties.map((variety) => (
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
                          <IconButton color="error" onClick={() => handleDelete(variety)}>
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
    </Grid>
  );
};

export default VarietiesPage;
