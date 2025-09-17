# RoastSync

Aplicacion full-stack para controlar la trazabilidad del cafe desde la compra del cafe verde hasta la venta del cafe tostado.

## Stack

- **Backend**: FastAPI + SQLModel + PostgreSQL
- **Frontend**: React + Vite + Material UI
- **Infraestructura**: Docker, Docker Compose y Makefile

## Como ejecutar

1. Copia las variables de entorno por defecto si deseas ajustarlas:
   ```bash
   cp backend/.env backend/.env.local  # opcional
   ```
2. Construye los contenedores:
   ```bash
   make build
   ```
3. Levanta los servicios de base de datos, API y frontend:
   ```bash
   make up
   ```
4. La API quedara disponible en `http://localhost:8000` y la interfaz web en `http://localhost:5173`.

Credenciales iniciales (configurables via variables de entorno):
- correo: `admin@caturro.cafe`
- clave: `admin123`

## Makefile util

- `make up`: inicia la aplicacion en modo desarrollo con recarga automatica.
- `make down`: detiene y elimina los contenedores.
- `make logs`: sigue los logs de frontend y backend.
- `make backend-shell`: entra al contenedor del backend.
- `make db-shell`: abre una consola de `psql` en la base de datos.

## Flujo principal

- **Catalogo**: administra fincas y variedades.
- **Lotes**: registra compras de cafe verde.
- **Tostiones**: registra tostiones calculando automaticamente la merma.
- **Ventas**: registra clientes y ventas asociadas.
- **Gastos**: registra gastos adicionales.
- **Dashboard**: resume inventario, ventas y utilidad neta.
# RoastFlow
