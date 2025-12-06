# SeguroPro - Insurance Broker CRM System

## Overview

SeguroPro is a comprehensive multi-tenant SaaS platform designed for insurance brokerages. The system enables detailed client management for both individuals (Pessoa Física/PF) and companies (Pessoa Jurídica/PJ), with sophisticated opportunity scoring, patrimony tracking, and business intelligence features. The platform helps insurance brokers identify sales opportunities, manage client relationships, and track the complete lifecycle from lead to policy renewal while maintaining LGPD compliance.

Key capabilities include:
- Multi-tenant architecture with subscription-based access control
- Comprehensive client profiling with socio-economic data collection
- Asset/patrimony tracking (vehicles, properties, equipment, collections, boats)
- Automated opportunity scoring system for different insurance products
- Interaction history and proposal pipeline management
- Dashboard with KPIs and business intelligence visualizations
- Master data management for products and insurers (SaaS Admin controlled)
- Client portal for self-service access
- CNPJ integration for automated company data enrichment

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Multi-Tenant SaaS Model

**Tenant Isolation**: Each insurance brokerage (tenant) operates in a completely isolated environment with dedicated data spaces. The `tenantId` field provides row-level security across all client-related tables.

**Role-Based Access Control**: Three primary user roles with hierarchical permissions:
- `saas_admin`: Platform administrator with full system access
- `tenant_admin`: Brokerage administrator managing users and configuration
- `corretor`: Insurance broker with client and opportunity management access
- Portal users: Clients with read-only access to their own data

**Subscription Tier Management**: Three subscription plans control feature access and resource limits:
- Starter (Free): 1 user, 1,000 clients
- Professional: 5 users, 5,000 clients  
- Enterprise: 10 users, 20,000 clients

**Resource Quota Tracking**: Five tracked resources with hard limits enforced at both storage and route layers:
1. Users (maxUsuarios)
2. Clients (maxClientes) 
3. Policies (maxApolices) - nullable for unlimited
4. AI Tokens (maxTokensIa) - monthly consumption tracking
5. Evolution API Connections (maxConexoesEvolution) - WhatsApp integrations

Quota enforcement occurs through helper functions (`canAddPolicy`, `checkTokenLimit`) before allowing resource creation, with UI progress indicators showing consumption levels.

### Frontend Architecture

**Technology Stack**: React with TypeScript, Wouter for routing, TanStack Query for state management

**Design System**: Hybrid approach combining Fluent Design productivity patterns with Material Design data visualization, using shadcn/ui components with Tailwind CSS. Typography uses Inter for UI elements and Roboto Mono for data/metrics display.

**Component Structure**: 
- Page-level components in `/client/src/pages`
- Reusable UI components in `/client/src/components`
- Custom hooks in `/client/src/hooks` for auth and mobile detection
- Theme provider supporting light/dark modes with system preference detection

**State Management**: TanStack Query handles server state with query keys matching API endpoints, providing automatic caching, refetching, and optimistic updates. No global state management needed due to query-based architecture.

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js

**Authentication**: Dual authentication system:
- Email/password authentication using Passport.js with bcrypt password hashing
- Session management via express-session with PostgreSQL session store
- JWT tokens for API authentication with 24-hour expiry
- Cookie-based session persistence with httpOnly security flags

**API Design**: RESTful endpoints organized by resource type with middleware chains for authentication, tenant context injection, and role-based authorization. All tenant-scoped requests validate `tenantId` before data access.

**Middleware Chain**:
1. Cookie parser for session cookies
2. Session middleware (connect-pg-simple)
3. Passport authentication
4. `withTenantContext` - injects user's tenant and role into request
5. `requireTenant` - validates tenant membership
6. `requireRole` - enforces role-based permissions

**Business Logic Layer**: Storage abstraction (`server/storage.ts`) provides clean interface for database operations with tenant filtering built-in. All queries automatically scope to requesting user's tenant.

### Database Architecture

**ORM**: Drizzle ORM with Neon serverless PostgreSQL adapter, using WebSocket connections for serverless environments

**Schema Organization**: Comprehensive relational model with 25+ tables organized into logical groups:

**Multi-Tenancy Tables**:
- `tenants` - Brokerage organizations
- `users` - System users with tenant association
- `subscription_plans` - Available subscription tiers
- `user_roles` - Role assignments

**Client Management**:
- `pessoas_fisicas` - Individual clients (PF)
- `pessoas_juridicas` - Corporate clients (PJ)  
- `enderecos` - Address information (polymorphic)
- `dependentes` - PF family members
- `socios` - PJ partners/shareholders
- `funcionarios` - PJ employees

**Business Operations**:
- `patrimonios` - Asset tracking (polymorphic for PF/PJ)
- `oportunidades` - Sales opportunities
- `interacoes` - Interaction history
- `convites` - Client portal invitations
- `tenant_policies` - Insurance policy tracking

**Master Data (SaaS Admin Managed)**:
- `seguradoras_master` - Insurance companies catalog
- `tipos_seguro_master` - Insurance product types
- `seguradora_produtos` - Product-insurer relationships
- `business_rule_templates` - Scoring rule definitions

**Tenant Configuration**:
- `smtp_configs` - Email integration per tenant
- `whatsapp_configs` - WhatsApp/Evolution API per tenant
- `tenant_seguradora_contatos` - Tenant-specific insurer contacts

**Resource Tracking**:
- `tenant_ai_token_usage` - Monthly AI consumption aggregated by monthYear
- `tenant_channel_connections` - WhatsApp connection status

**Data Relationships**: Extensive use of foreign keys with cascade rules for referential integrity. Polymorphic relationships use `pessoaFisicaId` and `pessoaJuridicaId` nullable fields with check constraints ensuring exactly one is populated.

### External Integrations

**CNPJ Consultation Service** (`server/services/cnpj.ts`): Automated company data enrichment from Brazilian government registry, mapping CNPJ response data to `pessoas_juridicas`, `enderecos`, and `socios` tables. Handles porte (company size) translation and QSA (qualified partners) extraction.

**Email Service** (`server/services/email.ts`): Nodemailer-based email sending using tenant-configured SMTP settings. Supports both invitation emails to clients and test emails for configuration validation. Template-based HTML emails with responsive design.

**WhatsApp Service** (`server/services/whatsapp.ts`): Evolution API integration for sending WhatsApp messages, including invitation links to client portal. Handles Brazilian phone number formatting (55 country code) and message templating.

### Security Patterns

**Authentication Flow**: Session-based authentication with secure cookie storage. JWT tokens used for stateless API authentication in parallel. Password hashing using bcrypt with 12 salt rounds.

**Authorization Model**: Middleware-based authorization checking user role and tenant membership before allowing access to resources. Helper functions (`isSaasAdmin`, `isTenantAdmin`, `isCorretorOrAdmin`) provide role checking utilities.

**LGPD Compliance**: Consent tracking fields (`consentimentoUsoImagem`, `consentimentoLGPD`) on client records. Data access logging through interaction history. Tenant-scoped data isolation prevents cross-tenant data leakage.

**Session Security**: 
- HttpOnly cookies prevent XSS attacks
- Secure flag in production (HTTPS only)
- 7-day session TTL with automatic cleanup
- PostgreSQL-backed session store for distributed deployment

## External Dependencies

### Core Infrastructure

**Database**: Neon serverless PostgreSQL with WebSocket connection pooling (`@neondatabase/serverless`, `ws`). Drizzle ORM for schema definition and query building.

**Authentication**: Passport.js with local strategy, express-session with connect-pg-simple for PostgreSQL session storage, bcrypt for password hashing, jsonwebtoken for API tokens.

**API Framework**: Express.js with cookie-parser, CORS support, rate limiting via express-rate-limit.

### Frontend Libraries

**UI Framework**: React 18+ with TypeScript, Wouter for client-side routing, TanStack Query v5 for server state management.

**Component Library**: Radix UI primitives (20+ components including Dialog, Dropdown, Select, Toast, etc.) with shadcn/ui styling patterns, Tailwind CSS for utility-first styling, class-variance-authority for component variants.

**Data Visualization**: Recharts for dashboard charts (bar charts, pie charts, line graphs with responsive containers).

**Form Management**: React Hook Form with Zod resolver for validation, Zod for schema validation with TypeScript inference.

### External Services

**CNPJ Lookup**: Integration with Brazilian government CNPJ registry API for automated company data enrichment (implementation in `server/services/cnpj.ts`).

**Email Delivery**: Nodemailer with SMTP transport, supports tenant-specific SMTP configuration with secure credential storage.

**WhatsApp Messaging**: Evolution API integration for WhatsApp messaging, phone number formatting utilities for Brazilian numbers.

### Development Tools

**Build System**: Vite for frontend bundling with React plugin, esbuild for server-side bundling in production, tsx for development server with hot reload.

**Type Safety**: TypeScript throughout with strict mode enabled, shared types via `@shared` alias for frontend/backend consistency.

**Database Migrations**: Drizzle Kit for schema migrations with PostgreSQL dialect, migration files in `/migrations` directory.

**Code Quality**: ESLint configuration, Prettier formatting (implied by project structure), TypeScript compiler checks via `npm run check`.