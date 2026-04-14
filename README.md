# OS ODC Hub

A dashboard for managing and monitoring OutSystems ODC (OutSystems Developer Cloud) resources. It provides a unified view of assets, builds, deployments, dependencies, code quality, users, and configurations through the ODC Portal API.

## Tech Stack

- **Client:** React 19, Vite, React Router, TanStack Query, Lucide icons
- **Server:** Node.js, Express, TypeScript

## Prerequisites

- Node.js >= 18
- An OutSystems ODC Portal account with API Client credentials

## Setup

1. **Install dependencies:**

   ```bash
   npm run install:all
   ```

2. **Configure environment variables:**

   Copy the example file and fill in your ODC credentials:

   ```bash
   cp .env.example .env
   ```

   ```
   ODC_PORTAL_DOMAIN=yourorg.outsystems.dev
   ODC_CLIENT_ID=your-client-id
   ODC_CLIENT_SECRET=your-client-secret
   PORT=3001
   ```

   You can also configure these from the Settings page in the UI after starting the app.

## Running

### Development

Starts both the server (port 3001) and client dev server (port 5173) with hot reload:

```bash
npm run dev
```

Open http://localhost:5173 in your browser. API requests are proxied to the backend automatically.

### Production

```bash
npm run build
npm start
```

This builds the React client and serves everything from the Express server on port 3001.
