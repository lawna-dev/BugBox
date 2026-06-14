# BugBox

A lightweight issue tracker for small software teams, built as a portfolio full-stack app.

* **Frontend:** React + TypeScript + Vite + Tailwind
* **Backend:** C# ASP.NET Core Minimal API + EF Core + SQLite + JWT

## Features

Tickets, Kanban, Projects, Team, Reports and Dashboard.
Includes role-based authorization and seeded demo data.

## Run the backend

```bash
cd backend/BugBox.Api
dotnet restore
dotnet run --urls http://localhost:5080
```

The API starts at:

```txt
http://localhost:5080
```

Swagger UI is available at:

```txt
http://localhost:5080/swagger
```

On first run, the backend creates and seeds a local SQLite database:

```txt
bugbox.db
```

## Run the frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file inside the `frontend` folder:

```env
VITE_API_BASE_URL=http://localhost:5080
```

Then start the frontend:

```bash
npm run dev
```

Open the app at:

```txt
http://localhost:5173
```

## Demo accounts

Password for all demo accounts:

```txt
Password123!
```

| Email                                                           | Role         |
| --------------------------------------------------------------- | ------------ |
| [admin@northwind.dev](mailto:admin@northwind.dev)               | Admin        |
| [mia.garcia@northwind.dev](mailto:mia.garcia@northwind.dev)     | TechLead     |
| [lucas.brown@northwind.dev](mailto:lucas.brown@northwind.dev)   | ProductOwner |
| [sophia.lee@northwind.dev](mailto:sophia.lee@northwind.dev)     | QA           |
| [emma.johnson@northwind.dev](mailto:emma.johnson@northwind.dev) | Developer    |
| [noah.martin@northwind.dev](mailto:noah.martin@northwind.dev)   | Developer    |

## Run backend tests

```bash
cd backend/BugBox.Api.Tests
dotnet test
```

## Project structure

```txt
BugBox/
├── backend/
│   ├── BugBox.Api/           # ASP.NET Core Minimal API
│   └── BugBox.Api.Tests/     # xUnit tests
├── frontend/                 # React app
└── README.md
```

## Future improvements

* Drag-and-drop on the Kanban board
* File attachments on tickets
* Real-time updates via SignalR
* Email notifications
* SSO / OIDC login
