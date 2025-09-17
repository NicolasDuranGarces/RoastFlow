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
import { FormEvent, useEffect, useMemo, useState } from "react";

import { createRoast, deleteRoast, fetchLots, fetchRoasts, updateRoast } from "../services/api";
import type { CoffeeLot, RoastBatch } from "../types";

const initialForm = {
  lot_id: "",
  roast_date: new Date().toISOString().slice(0, 10),
  green_input_kg: "",
  roasted_output_kg: "",
  roast_level: "",
  notes: ""
};

const RoastsPage = () => {
  const [lots, setLots] = useState<CoffeeLot[]>([]);
  const [roasts, setRoasts] = useState<RoastBatch[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useMemo(
    () =>
      async () => {
        try {
          const [lotsRes, roastsRes] = await Promise.all([fetchLots(), fetchRoasts()]);
          setLots(lotsRes.data as CoffeeLot[]);
          setRoasts(roastsRes.data as RoastBatch[]);
        } catch (error) {
          console.error("Failed to load roasts", error);
        }
      },
    []
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        lot_id: Number(form.lot_id),
        roast_date: form.roast_date,
        green_input_kg: Number(form.green_input_kg),
        roasted_output_kg: Number(form.roasted_output_kg),
        roast_level: form.roast_level,
        notes: form.notes
      };
      if (editingId) {
        await updateRoast(editingId, payload);
      } else {
        await createRoast(payload);
      }
      resetForm();
      await loadData();
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
      green_input_kg: String(roast.green_input_kg),
      roasted_output_kg: String(roast.roasted_output_kg),
      roast_level: roast.roast_level ?? "",
      notes: roast.notes ?? ""
    });
  };

  const handleDelete = async (roast: RoastBatch) => {
    if (!window.confirm(`Eliminar tostion del ${roast.roast_date}?`)) {
      return;
    }
    try {
      await deleteRoast(roast.id);
      await loadData();
    } catch (error) {
      console.error("Failed to delete roast", error);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card sx={{ height: "100%" }}>
          <CardHeader title={editingId ? "Editar tostion" : "Registrar tostion"} />
          <CardContent>
            <Box component="form" display="flex" flexDirection="column" gap={2} onSubmit={handleSubmit}>
              <TextField
                select
                label="Lote"
                value={form.lot_id}
                onChange={(e) => setForm((prev) => ({ ...prev, lot_id: e.target.value }))}
                required
              >
                {lots.map((lot) => (
                  <MenuItem key={lot.id} value={lot.id}>
                    Lote #{lot.id} - {lot.process}
                  </MenuItem>
                ))}
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
                label="Kg verdes"
                type="number"
                value={form.green_input_kg}
                onChange={(e) => setForm((prev) => ({ ...prev, green_input_kg: e.target.value }))}
                required
              />
              <TextField
                label="Kg tostado"
                type="number"
                value={form.roasted_output_kg}
                onChange={(e) => setForm((prev) => ({ ...prev, roasted_output_kg: e.target.value }))}
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
              <Box display="flex" gap={2}>
                <Button type="submit" variant="contained" disabled={saving}>
                  {editingId ? "Actualizar" : "Guardar tostion"}
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
          <CardHeader title="Historial tostiones" />
          <CardContent sx={{ flexGrow: 1, overflowX: "auto" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Lote</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="right">Kg verdes</TableCell>
                  <TableCell align="right">Kg tostado</TableCell>
                  <TableCell align="right">Merma %</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roasts.map((roast) => (
                  <TableRow key={roast.id}>
                    <TableCell>{roast.lot_id}</TableCell>
                    <TableCell>{roast.roast_date}</TableCell>
                    <TableCell align="right">{roast.green_input_kg.toFixed(2)}</TableCell>
                    <TableCell align="right">{roast.roasted_output_kg.toFixed(2)}</TableCell>
                    <TableCell align="right">{roast.shrinkage_pct.toFixed(2)}%</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton color="primary" onClick={() => handleEdit(roast)}>
                          <EditRoundedIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton color="error" onClick={() => handleDelete(roast)}>
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
    </Grid>
  );
};

export default RoastsPage;
