# JK Global Academy Fee ERP

A full-stack School Fee Management ERP web application for JK Global Academy, designed for Indian schools. It includes secure admin authentication, Aadhaar-based sibling detection, inline-editable tables, monthly fee tracking, discounts, PDF receipts, analytics, and Excel export support.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/websiteh063-hue/jk-global-academy-fee-erp)

## Tech Stack

- Frontend: React.js + Tailwind CSS + Vite
- Backend: Node.js + Express.js
- Database: MongoDB + Mongoose
- Authentication: JWT + bcrypt
- Charts: Recharts
- Export: xlsx + pdfkit

## Features

- JWT-based admin login and protected routes
- Dashboard with total students, fees collected, fee due, overdue alerts and monthly collection graph
- Advanced student management with father/mother Aadhaar, contact numbers, address, transport opt-in and auto roll number generation
- Aadhaar-based sibling auto detection with sibling tagging and sibling-aware discount support
- Inline editable student and fee structure tables for fast admin data entry
- Class-wise fee structure management with tuition, transport and exam fees
- Monthly student fee ledger with discount support, partial payments, transport-only logic and real-time pending calculation
- PDF fee receipt generation, printable slip view, transaction ID support for online payments and auto status detection
- Reports for class-wise collection, date-wise collection and pending fees
- Excel export for students, fee records and reports
- Validation, loading states and backend error handling
- Dummy seed data for quick local testing
- Single-service production deployment support via Render

## Project Structure

```text
.
|-- client
|   |-- src
|   `-- .env.example
|-- server
|   |-- src
|   `-- .env.example
|-- render.yaml
`-- README.md
```

## Setup Instructions

### 1. Clone and install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Configure environment variables

Create `server/.env` from `server/.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/school-fee-erp
JWT_SECRET=replace_with_a_secure_secret
JWT_EXPIRES_IN=1d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

Create `client/.env` from `client/.env.example`:

```env
VITE_API_BASE_URL=/api
```

For local split frontend/backend development, you can also use:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Seed dummy data

```bash
cd server
npm run seed
```

This creates:

- Admin user: `admin`
- Password: `admin123`
- Sample students, fee structures and fee records

### 4. Run the application

Backend:

```bash
cd server
npm run dev
```

Frontend:

```bash
cd client
npm run dev
```

Open the frontend at `http://localhost:5173`.

## Public Deployment

This repository supports both Vercel and Render deployments.

### Vercel setup

The repo root is the correct Vercel project root after the Vercel-specific restructure in this repository.

1. Import the GitHub repository into Vercel.
2. Keep the project root as `./`.
3. Vercel will build the React app from `client` and expose the backend through serverless functions under `/api`.
4. Set these environment variables in Vercel:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN=1d`
   - `ADMIN_USERNAME=admin`
   - `ADMIN_PASSWORD=admin123`
5. Deploy the project.

Notes:

- Frontend routes are served from the built Vite app.
- API routes continue to use the same `/api/...` paths.
- MongoDB should be hosted remotely, such as MongoDB Atlas, because Vercel functions are stateless.

### Render setup

1. Create a MongoDB Atlas database and copy the connection string.
2. In Render, create a new Blueprint or Web Service from this repository.
3. Render will detect `render.yaml`.
4. Set the missing secrets in Render:
   - `MONGODB_URI`
   - `JWT_SECRET`
5. Deploy the service.

The production Express server serves the built React app and the API together, so no separate frontend host is required.

## Main Modules

### Authentication

- `POST /api/auth/login`
- `GET /api/auth/me`

### Students

- `GET /api/students`
- `POST /api/students`
- `PUT /api/students/:id`
- `DELETE /api/students/:id`

### Fee Structures

- `GET /api/fee-structures`
- `POST /api/fee-structures`
- `PUT /api/fee-structures/:id`
- `DELETE /api/fee-structures/:id`

### Fee Collection

- `GET /api/fees`
- `GET /api/fees/:studentId`
- `POST /api/fees/preview/:studentId`
- `POST /api/fees/collect/:studentId`
- `GET /api/fees/receipt/:studentId/:receiptNumber`

### Reports

- `GET /api/reports/class-wise`
- `GET /api/reports/date-wise`
- `GET /api/reports/pending`

## Notes

- Use MongoDB locally or point `MONGODB_URI` to MongoDB Atlas.
- The UI uses Indian Rupee formatting (`₹`) throughout the app.
- Deleting a fee structure is blocked if students are assigned to that class, to prevent broken fee records.
- For `UPI` and `Bank Transfer` payments, transaction ID is mandatory before save.

## Testing Checklist

- Login with seeded admin credentials
- Create, inline edit and delete students
- Verify sibling tagging by matching father or mother Aadhaar
- Create and update fee structures
- Apply fixed and percentage discounts
- Collect partial fees and verify pending balance updates live
- Download PDF receipt and use print flow
- Verify dashboard cards and graphs update
- Export Excel files from students, fee collection and reports pages
