import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Collapse,
  FormControlLabel,
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
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

import { createUser, deleteUser, fetchUsers, updateUser } from "../services/api";
import type { User } from "../types";
import { useAuth } from "../hooks/useAuth";
import ConfirmDialog from "../components/ConfirmDialog";
import FilterPanel from "../components/FilterPanel";

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
  const [filters, setFilters] = useState({ search: "", active: "all", role: "all" });
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formOpen, setFormOpen] = useState(true);

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

  const filteredUsers = useMemo(() => {
    const searchValue = filters.search.toLowerCase();
    return users.filter((candidate) => {
      if (
        searchValue &&
        !candidate.email.toLowerCase().includes(searchValue) &&
        !(candidate.full_name ?? "").toLowerCase().includes(searchValue)
      ) {
        return false;
      }
      if (filters.active === "active" && !candidate.is_active) {
        return false;
      }
      if (filters.active === "inactive" && candidate.is_active) {
        return false;
      }
      if (filters.role === "admin" && !candidate.is_superuser) {
        return false;
      }
      if (filters.role === "standard" && candidate.is_superuser) {
        return false;
      }
      return true;
    });
  }, [filters, users]);

  const isFiltering = useMemo(
    () => filters.search.trim() !== "" || filters.active !== "all" || filters.role !== "all",
    [filters]
  );

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

  const handleFilterChange = (field: keyof typeof filters) => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setFilters((prev) => ({ ...prev, [field]: value.toString() }));
  };

  const handleDeleteRequest = (target: User) => {
    setDeleteTarget(target);
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
      await deleteUser(deleteTarget.id);
      await loadUsers();
    } catch (error) {
      console.error("Failed to delete user", error);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <Stack spacing={4}>
      <Card>
        <CardHeader
          title={editingId ? "Editar usuario" : "Crear usuario"}
          action={
            <Button size="small" onClick={() => setFormOpen((prev) => !prev)}>
              {formOpen ? "Ocultar" : "Mostrar"}
            </Button>
          }
        />
        <Collapse in={formOpen} timeout="auto" unmountOnExit>
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
        </Collapse>
      </Card>
      <Card sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <CardHeader
          title="Usuarios"
          subheader={`${filteredUsers.length} de ${users.length} registrados`}
        />
        <CardContent sx={{ flexGrow: 1, overflowX: "auto" }}>
            <FilterPanel
              isDirty={isFiltering}
              onClear={() => setFilters({ search: "", active: "all", role: "all" })}
            >
              <TextField
                label="Buscar"
                value={filters.search}
                onChange={handleFilterChange("search")}
                placeholder="Email o nombre"
              />
              <TextField
                select
                label="Estado"
                value={filters.active}
                onChange={handleFilterChange("active")}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="active">Activos</MenuItem>
                <MenuItem value="inactive">Inactivos</MenuItem>
              </TextField>
              <TextField
                select
                label="Rol"
                value={filters.role}
                onChange={handleFilterChange("role")}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="admin">Administradores</MenuItem>
                <MenuItem value="standard">Operativos</MenuItem>
              </TextField>
            </FilterPanel>
            {filteredUsers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {isFiltering
                  ? "No hay usuarios que coincidan con los filtros."
                  : "No hay usuarios registrados."}
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
                  {filteredUsers.map((user) => (
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
                          <IconButton color="error" onClick={() => handleDeleteRequest(user)}>
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
        title="Eliminar usuario"
        description={
          deleteTarget
            ? `¿Deseas eliminar al usuario ${deleteTarget.email}? Esta acción no se puede deshacer.`
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

export default UsersPage;
