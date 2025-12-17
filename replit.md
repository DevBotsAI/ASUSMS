# АСУ-Оповещение (SMS Notification System)

## Overview

АСУ-Оповещение is an enterprise SMS notification management system for the Ministry of Energy (Министерство энергетики). The system enables operators to manage staff groups (штабы), participants, and send mass or individual SMS notifications with scheduling capabilities and delivery status tracking.

Key features:
- Staff group management with participant organization
- Individual and mass SMS sending via SMS-PROSTO API
- Scheduled SMS with automatic sending
- Delivery status tracking and event logging
- Excel import for bulk participant additions
- Message templates per staff group

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: Shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a component-based architecture with:
- Pages in `client/src/pages/` for route-level components
- Reusable UI primitives in `client/src/components/ui/`
- Feature components in `client/src/components/`
- Shared hooks in `client/src/hooks/`

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Local username/password with bcrypt (Passport.js LocalStrategy)
- **Session Management**: express-session with PostgreSQL store (connect-pg-simple)
- **Task Scheduling**: node-cron for scheduled SMS sending

API routes follow RESTful conventions:
- `/api/staff-groups` - Staff group CRUD
- `/api/participants` - Participant management
- `/api/notifications` - SMS sending and status
- `/api/event-logs` - Activity logging
- `/api/auth/*` - Authentication endpoints

### Data Models
Core entities defined in `shared/schema.ts`:
- **users** - Authenticated operators (local auth with bcrypt)
- **staffGroups** - Organizational groups (штабы)
- **participants** - Group members with phone numbers
- **notifications** - SMS messages with status tracking
- **messageTemplates** - Reusable message templates per group
- **eventLogs** - Audit trail of all actions
- **sessions** - Authentication sessions

### SMS Integration
The system integrates with SMS-PROSTO API (`api.sms-prosto.ru`) for:
- Sending SMS messages
- Checking delivery status
- Status mapping to internal notification states

A background scheduler runs every minute to:
- Send scheduled notifications
- Poll and update delivery statuses

## External Dependencies

### Third-Party Services
- **SMS-PROSTO API** - SMS gateway for message delivery (requires `SMS_API_KEY` and `SMS_SENDER` environment variables)

### Database
- **PostgreSQL** - Primary data store (requires `DATABASE_URL` environment variable)
- Schema migrations managed via Drizzle Kit (`npx drizzle-kit generate` + `npx tsx server/migrate.ts`)
- Migration files stored in `migrations/` folder

### Deployment
- **Docker**: Multi-stage Dockerfile with automatic migrations on startup
- **Standalone**: Node.js 20+ with manual migration execution
- See `DEPLOYMENT.md` for detailed instructions

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `@tanstack/react-query` - Server state management
- `axios` - HTTP client for SMS API
- `node-cron` - Background task scheduling
- `xlsx` - Excel file parsing for participant imports
- `passport` / `passport-local` / `bcryptjs` - Local authentication
- `zod` - Schema validation (shared between frontend and backend)