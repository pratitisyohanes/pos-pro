# KandangMart POS

Point of Sales for a layer farm supplier: battery cages, feeders, drinkers, feed and poultry health products.
It is the second project of the Full Stack Web Development final project and works together with the
service booking app in `../fin-pro` (site surveys, cage installation, repairs, vaccination).

- **Customers** browse products, add them to a cart and place a self-order, then pay at the counter.
- **Admins** run the cashier screen, settle a confirmed service booking on the same receipt, manage products and stock, and read sales reports.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite 6, Tailwind CSS 3, React Router 6 |
| State | TanStack Query 5 (server data), Zustand 5 (session and cart) |
| Forms | React Hook Form + Zod |
| Backend | Node.js 20, Express 4 |
| Database | PostgreSQL 16/17 (`pos_db`), Sequelize 6 + sequelize-cli |
| Auth | JWT issued by booking-api (fin-pro), verified here with the shared secret |
| Docs | OpenAPI 3 + Swagger UI at `/api/docs` |
| Testing | Jest + Supertest |

## Architecture

```
Browser ── pos.pratitis.net (Nginx) ──┬── /        React build (frontend/dist)
                                      ├── /api/*   pos-api      :5001 ── pos_db
                                      └── /auth/*  booking-api  :5000 ── booking_db
pos-api ── http://127.0.0.1:5000/api/v1/internal/* (X-Internal-Key) ── booking-api
```

- Accounts live only in booking-api. The POS login page calls `/auth/login`, which is proxied to booking-api.
- pos-api calls booking-api internal routes to look up a booking and to mark it paid with the POS invoice number.
- Each service owns its database; user and booking ids are stored without cross-database foreign keys.

## Getting Started

booking-api from `../fin-pro/backend` must be running on port 5000 first (login comes from there).

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env     # copy JWT_ACCESS_SECRET and INTERNAL_API_KEY from fin-pro/backend/.env
createdb -U postgres pos_db
npm run db:migrate
npm run db:seed          # demo products and sales (resets POS tables)
npm run dev              # http://localhost:5001, docs at /api/docs

# 2. Frontend (second terminal)
cd frontend
npm install
cp .env.example .env
npm run dev              # http://localhost:5174
```

Demo accounts (from the fin-pro seeder): `admin@booking.com / Admin12345`, `budi@example.com / User12345`.

## Project Structure

```
pos-pro/
├── backend/
│   ├── src/
│   │   ├── clients/       bookingClient.js, calls booking-api internal routes
│   │   ├── config/        env validation, sequelize-cli config
│   │   ├── database/      migrations and seeders
│   │   ├── docs/          OpenAPI specification
│   │   ├── middlewares/   authenticate (verify only), authorize, validate, rate limit, errors
│   │   ├── models/        ProductCategory, Product, Transaction, TransactionItem, StockMovement
│   │   ├── modules/       categories, products, transactions, bookings, reports
│   │   │   └── <module>/  *.routes.js → *.controller.js → *.service.js (+ *.schema.js, *.rules.js)
│   │   ├── routes/        /api/v1 router
│   │   └── utils/         pagination, dateRange, csv, invoiceNo, ...
│   └── tests/
├── frontend/
│   └── src/  api · components · hooks · layouts · pages (public, user, admin) · routes · schemas · store · utils
├── deploy/nginx/pos.pratitis.net.conf
└── .github/workflows/deploy.yml
```

## Entity Relationship

```
ProductCategory 1──N Product 1──N StockMovement
Transaction 1──N TransactionItem N──1 Product
TransactionItem (BOOKING) ··· booking in booking-api (by id and code)
Transaction.customerId / cashierId ··· user in booking-api
```

## Key Business Rules

- Checkout locks product rows (`FOR UPDATE`, ordered by id) so two cashiers cannot sell the last unit twice; the database also has `CHECK (stock >= 0)`.
- Every stock change writes a `stock_movements` row (SALE, CANCEL, RESTOCK, ADJUST).
- Prices are always read from the database, never from the request.
- Transaction status flow: `PENDING → PAID` or `PENDING → CANCELLED`. Cashier sales are created as `PAID`; self-orders start as `PENDING` and reserve stock.
- A booking can be added to a cashier sale only when it is CONFIRMED or COMPLETED and unpaid. booking-api is called last, inside the database transaction, so any earlier error rolls back without touching the booking. The call is idempotent by invoice number.
- A booking can be settled by only one POS sale (unique index on `transaction_items.booking_id`).
- All dates are in WIB (UTC+7).
