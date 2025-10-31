# RoastFlow

Plataforma full-stack para administrar la trazabilidad del café desde el grano verde hasta la venta final. Centraliza catálogos, lotes, tostiones, ventas y gastos para ofrecer visibilidad total del negocio cafetero.

## Características principales
- Gestión de catálogo de fincas, variedades y usuarios.
- Registro de lotes de café verde y seguimiento de tostiones con cálculo de merma.
- Control de clientes, ventas y gastos con indicadores resumidos en un dashboard.
- API basada en FastAPI con autenticación JWT y creación automática de superusuario inicial.
- Frontend en React/Vite con Material UI y cliente Axios configurado para consumir la API.

## Stack tecnológico
- **Backend:** FastAPI, SQLModel, PostgreSQL, Uvicorn.
- **Frontend:** React 18, Vite, TypeScript, Material UI.
- **Infraestructura:** Docker, Docker Compose y Makefile para tareas frecuentes.

## Arquitectura general
- `backend/`: servicio REST que expone endpoints bajo `/api/v1`, maneja autenticación y persistencia.
- `frontend/`: cliente SPA que consume la API y gestiona el flujo operativo.
- `docker-compose.yml`: orquesta Postgres, backend, frontend y nginx para desarrollo local.

## Requisitos previos
- Docker y Docker Compose (o `docker compose` plugin).
- GNU Make (opcional pero recomendado para los atajos provistos).
- Node.js 18+ y Python 3.11+ si deseas ejecutar los servicios sin contenedores.

## Configuración de variables de entorno
1. Backend:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Ajusta las variables `DATABASE_URL`, `SECRET_KEY` y credenciales del superusuario.
2. Frontend:
   ```bash
   cp frontend/.env.example frontend/.env
   ```
   Define `VITE_API_URL` como `/api` para reutilizar el mismo dominio que expone el proxy inverso.

## Puesta en marcha con Docker
```bash
make build   # construye las imágenes
make up      # levanta Postgres, backend, frontend y nginx
```
Una vez iniciados los servicios, nginx expone todo en `http://localhost:3999`:
- Frontend: http://localhost:3999/
- API (docs): http://localhost:3999/api/docs

Para detener los servicios:
```bash
make down
```

Credenciales iniciales por defecto (configurables en `.env`):
- Correo: `admin@caturro.cafe`
- Clave: `admin123`

## Desarrollo sin Docker
### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
La API quedará disponible en `http://localhost:8000`.

### Frontend
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```
La SPA se servirá en `http://localhost:5173` y recargará automáticamente.

## Tareas del Makefile
- `make up`: inicia los contenedores en segundo plano.
- `make down`: detiene y limpia los contenedores.
- `make logs`: sigue los logs de backend y frontend.
- `make backend-shell`: abre una shell dentro del contenedor del backend.
- `make frontend-shell`: abre una shell en el contenedor del frontend.
- `make db-shell`: abre `psql` conectado a la base de datos Postgres.

## Estructura del proyecto
```text
.
├── backend
│   ├── app
│   │   ├── api
│   │   ├── core
│   │   ├── models
│   │   └── schemas
│   ├── Dockerfile
│   └── requirements.txt
├── frontend
│   ├── src
│   ├── public
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── Makefile
└── README.md
```

## Próximos pasos sugeridos
- Agregar pruebas automatizadas para backend y frontend.
- Configurar despliegues (CI/CD) y generación de artefactos.
- Documentar los endpoints de la API utilizando OpenAPI o apidoc adicional.
