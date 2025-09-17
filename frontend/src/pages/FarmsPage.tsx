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

import { createFarm, deleteFarm, fetchFarms, updateFarm } from "../services/api";
import type { Farm } from "../types";

const emptyForm = { name: "", location: "", notes: "" };

const FarmsPage = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

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

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
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

  const handleDelete = async (farm: Farm) => {
    if (!window.confirm(`Eliminar finca "${farm.name}"?`)) {
      return;
    }
    try {
      await deleteFarm(farm.id);
      await loadFarms();
    } catch (error) {
      console.error("Failed to delete farm", error);
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
          <CardHeader title="Fincas registradas" subheader={`${farms.length} registros`} />
          <CardContent sx={{ flexGrow: 1, overflowX: "auto" }}>
            {farms.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay fincas registradas.
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
                  {farms.map((farm) => (
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
                          <IconButton color="error" onClick={() => handleDelete(farm)}>
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

export default FarmsPage;
