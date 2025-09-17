import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...');

    // Hash password for test accounts
    const passwordHash = await bcrypt.hash('password', 10);

    // 1. Create tenants
    console.log('📦 Creating tenants...');
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .upsert([
        {
          name: 'Acme Corporation',
          slug: 'acme',
          subscription_plan: 'free'
        },
        {
          name: 'Globex Corporation',
          slug: 'globex',
          subscription_plan: 'free'
        }
      ], {
        onConflict: 'slug',
        ignoreDuplicates: false
      })
      .select();

    if (tenantsError) {
      throw tenantsError;
    }

    console.log(`✅ Created ${tenants.length} tenants`);

    // Get tenant IDs for user creation
    const acmeTenant = tenants.find(t => t.slug === 'acme');
    const globexTenant = tenants.find(t => t.slug === 'globex');

    if (!acmeTenant || !globexTenant) {
      throw new Error('Failed to create tenants');
    }

    // 2. Create users
    console.log('👥 Creating users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .upsert([
        // Acme users
        {
          tenant_id: acmeTenant.id,
          email: 'admin@acme.test',
          password_hash: passwordHash,
          role: 'admin',
          first_name: 'Acme',
          last_name: 'Admin'
        },
        {
          tenant_id: acmeTenant.id,
          email: 'user@acme.test',
          password_hash: passwordHash,
          role: 'member',
          first_name: 'Acme',
          last_name: 'User'
        },
        // Globex users
        {
          tenant_id: globexTenant.id,
          email: 'admin@globex.test',
          password_hash: passwordHash,
          role: 'admin',
          first_name: 'Globex',
          last_name: 'Admin'
        },
        {
          tenant_id: globexTenant.id,
          email: 'user@globex.test',
          password_hash: passwordHash,
          role: 'member',
          first_name: 'Globex',
          last_name: 'User'
        }
      ], {
        onConflict: 'email',
        ignoreDuplicates: false
      })
      .select();

    if (usersError) {
      throw usersError;
    }

    console.log(`✅ Created ${users.length} users`);

    // 3. Create sample notes
    console.log('📝 Creating sample notes...');
    const acmeUser = users.find(u => u.email === 'user@acme.test');
    const globexUser = users.find(u => u.email === 'user@globex.test');

    const sampleNotes = [
      // Acme notes
      {
        tenant_id: acmeTenant.id,
        user_id: acmeUser?.id,
        title: 'Welcome to Acme Notes',
        content: `# Welcome to Your Multi-Tenant Workspace

This is your first note in the Acme workspace. Here are some features:

## Key Features
- **Multi-tenant isolation**: Your data is completely separate from other organizations
- **Subscription management**: Free plan includes 3 notes, Pro plan offers unlimited notes
- **Real-time editing**: Changes are automatically saved as you type
- **Role-based access**: Admins can upgrade subscriptions and manage users

## Getting Started
1. Create new notes using the "New Note" button
2. Edit notes by clicking on them
3. Delete notes using the trash icon
4. Upgrade to Pro for unlimited notes (Admin only)

Happy note-taking! 🚀`
      },
      {
        tenant_id: acmeTenant.id,
        user_id: acmeUser?.id,
        title: 'Project Planning',
        content: `# Q1 2024 Project Planning

## Objectives
- Launch new product features
- Improve user engagement by 25%
- Expand to 2 new markets

## Timeline
- January: Research and development
- February: Testing and validation  
- March: Launch and marketing

## Resources Needed
- Development team: 3 engineers
- Marketing budget: $50,000
- Timeline: 3 months`
      },
      // Globex notes
      {
        tenant_id: globexTenant.id,
        user_id: globexUser?.id,
        title: 'Meeting Notes - Strategy Session',
        content: `# Strategy Meeting - December 2024

## Attendees
- John Smith (CEO)
- Sarah Johnson (CTO)
- Mike Wilson (Head of Sales)

## Agenda Items
1. Market analysis review
2. Competitive positioning
3. Resource allocation for Q1

## Key Decisions
- Increase R&D budget by 15%
- Focus on enterprise customers
- Launch new marketing campaign in January

## Action Items
- [ ] Prepare market research report (Sarah)
- [ ] Draft budget proposal (Mike)
- [ ] Schedule follow-up meeting (John)`
      },
      {
        tenant_id: globexTenant.id,
        user_id: globexUser?.id,
        title: 'Technical Requirements',
        content: `# System Requirements Document

## Overview
This document outlines the technical requirements for our new platform.

## Functional Requirements
- User authentication and authorization
- Real-time data synchronization
- Multi-tenant architecture
- RESTful API design

## Non-Functional Requirements
- 99.9% uptime
- Sub-second response times
- GDPR compliance
- SOC 2 Type II certification

## Technology Stack
- Frontend: React/Next.js
- Backend: Node.js/Express
- Database: PostgreSQL
- Cloud: AWS/Azure`
      }
    ];

    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .insert(sampleNotes)
      .select();

    if (notesError) {
      throw notesError;
    }

    console.log(`✅ Created ${notes.length} sample notes`);

    // 4. Clean up expired sessions (if any)
    console.log('🧹 Cleaning up expired sessions...');
    const { error: cleanupError } = await supabase
      .from('user_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (cleanupError) {
      console.warn('⚠️ Warning: Failed to cleanup expired sessions:', cleanupError);
    }

    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('  admin@acme.test / password (Admin - Acme)');
    console.log('  user@acme.test / password (Member - Acme)');
    console.log('  admin@globex.test / password (Admin - Globex)');
    console.log('  user@globex.test / password (Member - Globex)');
    console.log('\n🚀 Ready to start the application!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding function
if (require.main === module) {
  seedDatabase().then(() => {
    process.exit(0);
  });
}

export { seedDatabase };