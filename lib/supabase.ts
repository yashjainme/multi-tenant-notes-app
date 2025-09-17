import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client for browser usage (anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We handle JWT ourselves
  },
});

// Admin client for server-side operations (service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Database query helpers
export class DatabaseService {
  private client = supabaseAdmin;

  // Tenant operations
  async getTenantBySlug(slug: string) {
    const { data, error } = await this.client
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data;
  }

  async getTenantById(id: string) {
    const { data, error } = await this.client
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async upgradeTenantSubscription(tenantId: string) {
    const { data, error } = await this.client
      .from('tenants')
      .update({ subscription_plan: 'pro' })
      .eq('id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // User operations
  async getUserByEmail(email: string) {
    const { data, error } = await this.client
      .from('users')
      .select(`
        *,
        tenant:tenants(*)
      `)
      .eq('email', email)
      .single();

    if (error) throw error;
    return data;
  }

  async getUserById(id: string) {
    const { data, error } = await this.client
      .from('users')
      .select(`
        *,
        tenant:tenants(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Notes operations
  async getNotesByTenant(tenantId: string, limit?: number) {
    let query = this.client
      .from('notes')
      .select(`
        *,
        user:users!inner(id, first_name, last_name, email)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async getNoteById(id: string, tenantId: string) {
    const { data, error } = await this.client
      .from('notes')
      .select(`
        *,
        user:users!inner(id, first_name, last_name, email)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw error;
    return data;
  }

  async createNote(note: {
    tenant_id: string;
    user_id: string;
    title: string;
    content?: string;
  }) {
    const { data, error } = await this.client
      .from('notes')
      .insert(note)
      .select(`
        *,
        user:users!inner(id, first_name, last_name, email)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateNote(
    id: string,
    tenantId: string,
    updates: {
      title?: string;
      content?: string;
    }
  ) {
    const { data, error } = await this.client
      .from('notes')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select(`
        *,
        user:users!inner(id, first_name, last_name, email)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteNote(id: string, tenantId: string) {
    const { error } = await this.client
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw error;
  }

  async getTenantNoteCount(tenantId: string) {
    const { count, error } = await this.client
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return count || 0;
  }

  // Session management
  async createUserSession(userId: string, tokenHash: string, expiresAt: Date) {
    const { data, error } = await this.client
      .from('user_sessions')
      .insert({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteUserSession(tokenHash: string) {
    const { error } = await this.client
      .from('user_sessions')
      .delete()
      .eq('token_hash', tokenHash);

    if (error) throw error;
  }

  async cleanupExpiredSessions() {
    const { error } = await this.client
      .from('user_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) throw error;
  }

  // Subscription checks
  async canTenantCreateNote(tenantId: string): Promise<boolean> {
    const tenant = await this.getTenantById(tenantId);
    
    if (tenant.subscription_plan === 'pro') {
      return true;
    }

    const noteCount = await this.getTenantNoteCount(tenantId);
    return noteCount < 3;
  }
}

export const db = new DatabaseService();