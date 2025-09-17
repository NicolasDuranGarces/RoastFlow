import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  FormControlLabel,
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

import { createUser, deleteUser, fetchUsers, updateUser } from "../services/api";
import type { User } from "../types";
import { useAuth } from "../hooks/useAuth";

const emptyForm = {
  email: "",
  full_name: "",
  password: "",
  is_active: true,
  is_superuser: false
};

const UsersPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const loadUsers = useMemo(
    () =>
      async () => {
        try {
          const { data } = await fetchUsers();
          setUsers(data as User[]);
        } catch (error) {
          console.error("Failed to load users", error);
        }
      },
    []
  );

  useEffect(() => {
    if (user?.is_superuser) {
      void loadUsers();
    }
  }, [loadUsers, user]);

  if (!user?.is_superuser) {
    return (
      <Card>
        <CardHeader title="Usuarios" />
        <CardContent>
          <Typography variant="body1">
            Solo los administradores pueden gestionar usuarios. Solicita acceso a un superusuario.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const payload = {
          full_name: form.full_name,
          is_active: form.is_active,
          is_superuser: form.is_superuser,
          password: form.password || undefined
        };
        await updateUser(editingId, payload);
      } else {
        await createUser(form);
      }
      resetForm();
      await loadUsers();
    } catch (error) {
      console.error("Failed to save user", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setForm({
      email: user.email,
      full_name: user.full_name ?? "",
      password: "",
      is_active: user.is_active,
      is_superuser: user.is_superuser
    });
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Eliminar usuario ${user.email}?`)) {
      return;
    }
    try {
      await deleteUser(user.id);
      await loadUsers();
    } catch (error) {
      console.error("Failed to delete user", error);
    }
  };

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={5}>
        <Card sx={{ height: "100%" }}>
          <CardHeader title={editingId ? "Editar usuario" : "Crear usuario"} />
          <CardContent>
            <Box component="form" display="flex" flexDirection="column" gap={2} onSubmit={handleSubmit}>
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                required
                disabled={Boolean(editingId)}
              />
              <TextField
                label="Nombre completo"
                value={form.full_name}
                onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
              />
              <TextField
                label={editingId ? "Nueva clave (opcional)" : "Clave"}
                type="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                required={!editingId}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.is_active}
                    onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  />
                }
                label="Usuario activo"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.is_superuser}
                    onChange={(e) => setForm((prev) => ({ ...prev, is_superuser: e.target.checked }))}
                  />
                }
                label="Administrador"
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
          <CardHeader title="Usuarios" subheader={`${users.length} registrados`} />
          <CardContent sx={{ flexGrow: 1, overflowX: "auto" }}>
            {users.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay usuarios registrados.
              </Typography>
            ) : (
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Activo</TableCell>
                    <TableCell>Admin</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>{user.is_active ? "Si" : "No"}</TableCell>
                      <TableCell>{user.is_superuser ? "Si" : "No"}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar">
                          <IconButton color="primary" onClick={() => handleEdit(user)}>
                            <EditRoundedIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton color="error" onClick={() => handleDelete(user)}>
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

export default UsersPage;
