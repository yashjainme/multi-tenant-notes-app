# Multi-Tenant Notes Application

A full-stack Next.js application for multi-tenant note-taking with JWT authentication, subscription management, and strict tenant isolation.

## 🏗️ Architecture Overview

### Multi-Tenancy Strategy
This application uses a **shared schema with tenant isolation** approach:
- Single database with shared tables
- Each table includes a `tenant_id` column for data isolation
- Application-level enforcement ensures strict tenant separation
- Benefits: Cost-effective, easier maintenance, better resource utilization

### Tech Stack
- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT-based
- **Deployment**: Vercel
- **State Management**: React Context + useState

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Vercel account (for deployment)

### Local Development Setup

1. **Clone and Install**
```bash
git clone <repository-url>
cd multi-tenant-notes
npm install
```

2. **Environment Setup**
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Database Setup**
Run the SQL migration script in Supabase SQL Editor:
```sql
-- See database/schema.sql
```

4. **Seed Test Data**
```bash
npm run seed
```

5. **Start Development Server**
```bash
npm run dev
```

Visit `http://localhost:3000`

## 🔐 Test Accounts

| Email | Password | Role | Tenant |
|-------|----------|------|--------|
| admin@acme.test | password | Admin | Acme |
| user@acme.test | password | Member | Acme |
| admin@globex.test | password | Admin | Globex |
| user@globex.test | password | Member | Globex |

## 📊 Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin/Member)
- Automatic token refresh
- Secure password hashing

### Multi-Tenant Isolation
- Strict tenant data separation
- Tenant-aware API endpoints
- Context-based tenant management

### Subscription Management
- Free Plan: 3 notes limit per tenant
- Pro Plan: Unlimited notes
- Admin-only subscription upgrades
- Real-time limit enforcement

### Notes Management
- Full CRUD operations
- Rich text editing
- Real-time updates
- Responsive design

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Notes
- `POST /api/notes` - Create note
- `GET /api/notes` - List tenant notes
- `GET /api/notes/[id]` - Get specific note
- `PUT /api/notes/[id]` - Update note
- `DELETE /api/notes/[id]` - Delete note

### Tenant Management
- `POST /api/tenants/[slug]/upgrade` - Upgrade subscription (Admin only)

### System
- `GET /api/health` - Health check

## 🗄️ Database Schema

### Tables
- `tenants` - Tenant information and subscription details
- `users` - User accounts with tenant association
- `notes` - User notes with tenant isolation
- `user_sessions` - JWT session management

### Key Relationships
- Users belong to exactly one tenant
- Notes are owned by users and isolated by tenant
- Subscription limits are enforced at tenant level

## 🎨 UI Design

### Design System
- Notion-inspired clean interface
- Tailwind CSS for consistent styling
- Responsive design (mobile-first)
- Dark/light theme support
- Smooth animations and transitions

### Components
- Reusable UI components
- Form validation and error handling
- Loading states and skeletons
- Toast notifications

## 🚀 Deployment

### Vercel Deployment
1. **Connect Repository**
   - Import project to Vercel
   - Connect to GitHub repository

2. **Environment Variables**
   Set the same variables from `.env.local` in Vercel dashboard

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Database Migration
Run migration scripts in Supabase dashboard before deployment.

## 🔒 Security Features

- JWT token validation
- Role-based access control
- SQL injection prevention
- CORS configuration
- Input validation and sanitization
- Rate limiting (production)

## 📚 Project Structure

```
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main application
│   └── globals.css        # Global styles
├── components/            # Reusable components
├── lib/                   # Utilities and configurations
├── database/              # SQL schemas and migrations
├── types/                 # TypeScript type definitions
└── middleware.ts          # Route protection
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.