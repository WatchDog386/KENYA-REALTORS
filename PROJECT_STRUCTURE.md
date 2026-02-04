# Project Structure

## Root Level Files
- `package.json` - NPM dependencies and scripts
- `package-lock.json` - Locked dependency versions
- `.env` - Environment variables
- `.env.example` - Example environment template
- `.gitignore` - Git ignore rules
- `.npmrc` - NPM configuration
- `README.md` - Project documentation
- `LICENSE.txt` - License information
- `index.html` - Entry HTML file
- `bun.lockb` - Bun package lock file

## Folders

### `/src` - Source Code
Main application code divided into:
- `components/` - React components organized by feature
  - `portal/` - Portal-specific components
  - `ui/` - Reusable UI components
  - `admin/` - Admin interface components
- `pages/` - Page components
- `services/` - API and business logic services
- `hooks/` - Custom React hooks
- `contexts/` - React context providers
- `types/` - TypeScript type definitions
- `utils/` - Utility functions
- `lib/` - Library functions and helpers
- `config/` - Frontend configuration
- `integrations/` - Third-party integrations
- `docs/` - Internal documentation

### `/config` - Configuration Files
All configuration files for the project:
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` - TypeScript configs
- `vite.config.ts` - Vite build config
- `tailwind.config.ts` - Tailwind CSS config
- `postcss.config.js` - PostCSS config
- `eslint.config.js` - ESLint config
- `components.json` - shadcn components config
- `capacitor.config.ts` - Capacitor mobile config
- `netlify.toml` - Netlify deployment config
- `railway.json` - Railway deployment config
- `render.yaml` - Render deployment config

### `/database` - Database Files
SQL migrations and database scripts:
- `20260204_*` - Database migrations (by date)
- SQL fix and setup scripts
- All database-related queries and procedures

### `/scripts` - Scripts
Executable scripts for setup and maintenance:
- `*.sh` - Linux/Mac shell scripts
- `*.bat` - Windows batch scripts
- Setup scripts for various environments

### `/supabase` - Supabase Configuration
Supabase-specific configuration:
- `migrations/` - SQL migrations
- Configuration files

### `/public` - Static Assets
Public static files:
- Images
- Icons
- Static resources

### `/src/assests` - Application Assets
Application-specific assets:
- Images used in UI
- Icons
- Static files for components

### `/dist` - Build Output
Compiled/built application (generated, not in source control)

### `/node_modules` - Dependencies
NPM packages and dependencies (generated, not in source control)

---

## File Organization Best Practices

### Components
- Feature-based: Group related components together
- Each feature folder has its own components
- Reusable UI components in `components/ui/`

### Services
- `userSyncService.ts` - User synchronization
- `emailService.ts` - Email functionality
- `propertyService.ts` - Property management
- `supabase.ts` - Supabase client

### Types
- `user.ts` - User type definitions
- `property.ts` - Property type definitions
- `tenant.ts` - Tenant type definitions

### Database Scripts Location
- Migrations: `/database/`
- All SQL scripts: `/database/`
- Keep database versioned and organized

### Deployment Configs
- All deployment configs in `/config/`
- Easy to find and manage
- Separate by platform (netlify, railway, render)

---

## Clean Project Features

✅ No documentation files in root (cleaner root directory)
✅ All scripts organized in `/scripts/`
✅ All SQL in `/database/`
✅ All configs in `/config/`
✅ Clear folder hierarchy
✅ Easy to navigate and maintain
✅ Professional appearance
