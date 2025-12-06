# SeguroPro - Insurance Broker CRM System (Multi-Tenant SaaS)

## Overview

SeguroPro is a comprehensive multi-tenant SaaS platform for insurance brokerages. The application enables detailed client management for both individuals (Pessoa Física) and companies (Pessoa Jurídica), with advanced features including:

- **Multi-tenant Architecture**: Each brokerage operates in isolated tenant with subscription plans
- Complete client profiling with socio-economic data
- Asset/patrimony tracking (vehicles, properties, equipment, collections, boats)
- Automated opportunity scoring system for different insurance products
- Interaction history and proposal pipeline management
- Dashboard with KPIs and business intelligence
- LGPD compliance features for data consent management
- **Master Data Management**: Centralized product and insurer catalog managed by SaaS Admin

The system helps insurance brokers identify sales opportunities, manage client relationships, and track the complete lifecycle from lead to policy renewal.

## Multi-Tenant SaaS Architecture

### Subscription Tiers
- **Starter**: 1 user, 1,000 clients - Free tier for solo brokers
- **Professional**: 5 users, 5,000 clients - Small brokerages
- **Enterprise**: 10 users, 20,000 clients - Large brokerages

### Resource Usage Tracking (5 Metrics)
Each subscription plan defines limits for five resource types:
1. **Users** (maxUsuarios) - Number of active tenant users
2. **Clients** (maxClientes) - Number of registered clients (PF + PJ)
3. **Policies** (maxApolices) - Number of insurance policies (nullable = unlimited)
4. **AI Tokens** (maxTokensIa) - Monthly AI token consumption (nullable = unlimited)
5. **Connections** (maxConexoesEvolution) - WhatsApp/Evolution API connections (nullable = unlimited)

**Tracking Tables:**
- `tenant_policies` - Tracks tenant insurance policies
- `tenant_ai_token_usage` - Monthly AI token consumption with monthYear aggregation
- `tenant_channel_connections` - WhatsApp/Evolution connections with active/inactive status

**Quota Enforcement:**
- Storage layer: `canAddPolicy`, `canConsumeTokens`, `canAddConnection` methods
- Route level: Helper functions `checkPolicyLimit`, `checkTokenLimit`, `checkConnectionLimit`
- All resource creation endpoints validate limits before allowing mutations
- Nullable limits (null) = unlimited access for that resource

**UI Indicators:**
- Progress bars with color coding: green (<50%), yellow (50-80%), orange (80-100%), red (>100%)
- Unlimited limits display ∞ symbol with softened progress bars (muted colors)
- SaaS Admin Dashboard shows platform-wide usage summary with tenant filter dropdown
- Tenant management shows per-tenant resource consumption
- Tenant Admin page displays all 5 resources with plan pricing and upgrade dialog

**Null/Unlimited Limit Handling:**
- Backend uses `?? null` (nullish coalescing) to preserve null limits, NOT `||` which coerces to fallback
- Frontend `isUnlimited()` helper detects null/undefined limits
- `getProgressColor()` returns muted colors for unlimited resources
- `getProgressWidth()` returns minimum width (30% with usage, 5% without) for unlimited
- Alert status returns "unlimited" for null limits, displayed as "Ilimitado" badge

### User Roles
- **saas_admin**: Platform administrator - manages master data, plans, and all tenants
- **tenant_admin**: Brokerage administrator - manages users and tenant settings
- **corretor**: Broker - standard user with client management access
- **cliente**: End customer - client portal access with self-service features

### Client Portal (Portal do Cliente)
The client portal provides a clean, dedicated interface for end customers to manage their information:

**Menu Structure:**
- **Meus Dados**: Socioeconomic data form with editable personal, professional, financial info
- **Minhas Proteções**: View active insurance policies
- **Gaps de Proteção**: Protection gap analysis based on business rules scoring
- **Minhas Apólices**: Full policy management with ability to add new policies and link to assets

**Technical Implementation:**
- Separate `ClienteSidebar` component for clean portal navigation
- Portal-specific API endpoints under `/api/portal/*`
- `isClientPortalUser` middleware restricts access to cliente role only
- Links pessoa_fisica/pessoa_juridica records via `client_portal_access` table

### Master Data (SaaS Admin Only)
- **tipos_seguro_master**: 25 generic insurance product types (Automóvel, Residencial, Vida, etc.)
- **seguradoras_master**: 20 Brazilian insurance companies (MAPFRE, Porto Seguro, Bradesco, etc.)
- **seguradora_produtos**: N:N relationship between insurers and products (214 relationships)

### Route Protection
- `isSaasAdmin`: Protects /api/admin/* routes - only saas_admin role
- `isTenantAdmin`: Protects tenant management routes - saas_admin or tenant_admin
- `isCorretorOrAdmin`: Protects mutation routes - blocks cliente role
- `requireTenant`: Ensures user has tenant association
- `isEmailAuthenticated`: Validates email-based session and populates user context (userRole, currentUser, tenantId)

### SaaS Admin Features (Isolated UI at /saas-admin)
The SaaS Admin has a completely isolated experience with its own:
- **Router**: Dedicated routing system in App.tsx
- **Sidebar**: Custom SaasAdminSidebar component with specialized navigation
- **Layout**: Full-screen admin layout separated from tenant users

**Admin Pages**:
- `/saas-admin` - Dashboard with platform statistics (tenants, users, seguradoras, tipos)
- `/saas-admin/tenants` - Tenant (corretora) management with activation toggle
- `/saas-admin/users` - All platform users management filtered by tenant
- `/saas-admin/plans` - Subscription plans management (Starter, Professional, Enterprise)
- `/saas-admin/seguradoras` - Insurance companies master catalog
- `/saas-admin/tipos-seguro` - Insurance product types master catalog
- `/saas-admin/vinculacoes` - Insurer-product associations management
- `/saas-admin/config/smtp` - SMTP email server configuration
- `/saas-admin/config/chatgpt` - ChatGPT API integration settings
- `/saas-admin/config/evolution` - Evolution API (WhatsApp) configuration

**Tenant Blocking**: When a tenant is marked inactive (isActive=false), corretor and tenant_admin users from that tenant are blocked at login with message "Sistema indisponível". saas_admin and cliente roles are not affected.

### Global Configurations (Single Instance Per Type)
- **saasSmtpConfig**: SMTP server settings (host, port, secure, user, password, sender)
- **saasChatgptConfig**: OpenAI API configuration (apiKey, model, temperature, maxTokens)
- **saasEvolutionConfig**: WhatsApp API settings (apiUrl, apiKey, instance)

### Tenant-Level Configurations
Each tenant (brokerage) can configure their own integrations, separate from SaaS-level settings:

**SMTP Email Configuration (`tenantSmtpConfig` table)**:
- Tenant-specific email server for client communications
- Fields: nome, host, port, secure, usuario, senha, remetenteEmail, remetenteNome, ativo
- Endpoints: `GET/POST/DELETE /api/tenant/config/smtp`, `POST /api/tenant/config/smtp/test`
- Protected by `isTenantAdmin` middleware
- UI: `/admin/config/smtp` page with form and test email dialog

**WhatsApp/Evolution Connections (`tenantChannelConnections` table)**:
- Multiple WhatsApp instances per tenant (limited by plan)
- Fields: instanceName, phoneNumber, status, channelType
- Limit validation via `canAddConnection` storage method
- Endpoints: `GET/POST/PATCH/DELETE /api/tenant/config/evolution/:id`
- UI: `/admin/config/evolution` page with connection cards and status toggle

**Tenant Admin Configuration Tab**:
- New "Configurações" tab in tenant-admin page (`/admin`)
- Cards linking to SMTP and Evolution config pages
- Shows current connection usage vs. plan limit

### Password Management

**Provisional Password Generation (Admin)**:
- Tenant admins can generate provisional passwords for users within their tenant
- SaaS admins can generate provisional passwords for any user
- Provisional passwords are 8-character alphanumeric strings (uppercase)
- Endpoint: `POST /api/tenant/users/:userId/reset-password`
- Tenant isolation enforced: tenant_admin can only reset passwords for users with matching tenantId
- UI: Key icon button in tenant-admin users table with dialog to display and copy password

**Self-Service Password Change**:
- All authenticated users can change their own password
- Requires current password verification before allowing update
- New password validation: minimum 8 characters, must include uppercase, lowercase, and numbers
- Endpoint: `POST /api/account/change-password`
- UI: "Minha Conta" page (`/conta`) with Segurança tab

**Account Management**:
- Users can view and update their profile (name) via `/conta`
- Email and role are read-only
- Endpoints: `GET /api/account`, `PATCH /api/account`

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component System**: 
- Radix UI primitives for accessibility and headless components
- shadcn/ui component library with "new-york" style preset
- Tailwind CSS for styling with custom design tokens
- Design system follows hybrid approach combining Fluent Design (Microsoft) principles for productivity workflows with Material Design data visualization patterns

**State Management**:
- TanStack Query (React Query) for server state management and data fetching
- React Hook Form with Zod validation for form state
- Custom hooks for authentication (`useAuth`) and UI patterns

**Routing**: 
- Wouter for lightweight client-side routing
- Protected routes requiring authentication via Replit Auth

**Key Design Decisions**:
- Multi-step wizard forms for complex client registration (PF and PJ)
- Responsive grid layouts (12-column for dashboard, adaptive columns for forms)
- Theme support (light/dark mode) with system preference detection
- Typography: Inter for UI, Roboto Mono for data/metrics
- Scoring visualization using circular progress indicators and bar charts

### Backend Architecture

**Runtime**: Node.js with Express server

**Database ORM**: 
- Drizzle ORM for type-safe database operations
- Schema-first approach with TypeScript types derived from database schema
- Shared schema definitions between client and server (`@shared/schema`)

**API Design**:
- RESTful API endpoints under `/api` namespace
- Request/response validation using Zod schemas
- Session-based authentication with server-side session storage
- Rate limiting and security middleware

**Key Architectural Patterns**:
- Storage abstraction layer (`IStorage` interface) for database operations
- Separation of concerns: routes, storage, authentication, and static serving
- Development mode includes HMR (Hot Module Replacement) via Vite middleware
- Production build bundles server code with esbuild for optimized cold starts

**Database Schema Design**:
- Separate tables for `pessoasFisicas` (individuals) and `pessoasJuridicas` (companies)
- Normalized relationships for dependents, partners (sócios), employees (funcionários)
- Shared `patrimonios` table for asset tracking (supports both PF and PJ)
- `oportunidades` table for sales pipeline with status tracking
- `interacoes` table for interaction history (calls, emails, visits, proposals)
- `enderecos` table for addresses with type classification
- PostgreSQL enums for controlled vocabularies (estado civil, company size, asset types)

### External Dependencies

**Authentication**: 
- Replit Auth with OpenID Connect (OIDC)
- Passport.js strategy for session management
- connect-pg-simple for PostgreSQL session store

**Database**:
- Neon serverless PostgreSQL (configured via `@neondatabase/serverless`)
- WebSocket support for serverless connections
- Connection pooling for performance

**UI Libraries**:
- Radix UI component primitives (@radix-ui/*)
- Recharts for data visualization (charts, graphs)
- date-fns for date manipulation
- Lucide React for iconography

**Form Management**:
- React Hook Form for form state
- @hookform/resolvers for Zod integration
- zod and drizzle-zod for schema validation

**Development Tools**:
- Vite plugins: runtime error overlay, cartographer, dev banner (Replit-specific)
- TypeScript with strict mode enabled
- ESBuild for production server bundling

**Session Management**:
- express-session with PostgreSQL store
- Session TTL of 1 week
- Secure cookies (httpOnly, secure flags)

**Build Strategy**:
- Client: Vite builds to `dist/public` 
- Server: esbuild bundles to `dist/index.cjs` with allowlisted dependencies
- Externalized dependencies to reduce bundle size while bundling critical paths
- Separate dev and production configurations

## Docker & Deployment

### Docker Files
The project includes complete Docker configuration for deployment:

**Core Files:**
- `Dockerfile` - Multi-stage build optimized for production
- `docker-compose.yml` - Docker Swarm stack with Traefik + PostgreSQL
- `docker-compose.simple.yml` - Simplified stack without Traefik
- `.dockerignore` - Optimizes build by excluding unnecessary files
- `deploy.sh` - Automated deployment script for VPS
- `.env.example` - Example environment variables

**GitHub Actions:**
- `.github/workflows/docker.yml` - Automated Docker image build and push to GHCR

### Health Check Endpoint
- **Endpoint**: `GET /api/health`
- **Purpose**: Docker/Kubernetes health monitoring
- **Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345.67,
  "database": "connected",
  "version": "1.0.0"
}
```

### Deployment Options

**1. Docker Swarm + Portainer (Recommended)**
```bash
# Create secrets in Portainer first, then:
docker stack deploy -c docker-compose.yml opportunizze
```

**2. VPS with PM2**
```bash
git clone https://github.com/acelmec/Opportunizze.git
cd Opportunizze
npm install && npm run build
pm2 start dist/index.cjs --name opportunizze
```

**3. Simple Docker Compose**
```bash
docker-compose -f docker-compose.simple.yml up -d
```

### Environment Variables Required
| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| SESSION_SECRET | Session encryption key (32+ chars) |
| NODE_ENV | `production` or `development` |
| PORT | Application port (default: 5000) |

### Domain Configuration
- **Production Domain**: `opportunizze.amsolucoes.net.br`
- **SSL**: Let's Encrypt via Traefik or Certbot

### GitHub Repository
- **URL**: https://github.com/acelmec/Opportunizze
- **Container Registry**: ghcr.io/acelmec/opportunizze