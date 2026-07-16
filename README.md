# ERP Distribuidora Pollo Rey

Sistema MVP comercial para facturacion, inventario, contabilidad, reportes y productividad.

## Backend

```powershell
cd backend
..\venv\Scripts\python.exe manage.py migrate
..\venv\Scripts\python.exe manage.py seed_demo
..\venv\Scripts\python.exe manage.py runserver
```

Usuario demo:

- Usuario: `admin`
- Contrasena: `PolloRey2026`

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

Para compilar produccion:

```powershell
npm run build
```

## Flujo Comercial

1. Configurar empresa y CAI en `Configuracion`.
2. Crear productos, almacenes y movimientos en `Inventario`.
3. Crear cliente y factura en `Facturacion`.
4. Registrar pago o anular factura desde el detalle.
5. Revisar contabilidad, reportes y productividad.
