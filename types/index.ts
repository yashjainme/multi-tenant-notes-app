// Database entity types
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  subscription_plan: 'free' | 'pro';
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  password_hash?: string; // Optional for client-side usage
  role: 'admin' | 'member';
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  content?: string;
  created_at: string;
  updated_at: string;
}

export interface SidebarContentProps {
  notes: Note[];
  notesCount: number;
  notesLimit: string;
  subscriptionStatus: string;
  canCreateMore: boolean;
  isCreating: boolean;
  error: string | null;
  handleCreateNote: () => void;
  handleNoteSelect: (note: Note | null) => void; // Change this line
  currentNote: Note | null;
  isAdmin: boolean;
}

export interface UserSession {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
}

// API request/response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: UserWithTenant;
  token?: string;
  error?: string;
}

export interface CreateNoteRequest {
  title: string;
  content?: string;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}


// Extended types for client usage
export interface UserWithTenant extends Omit<User, 'password_hash'> {
  tenant: Tenant;
}

export interface NoteWithUser extends Note {
  user: Pick<User, 'id' | 'first_name' | 'last_name' | 'email'>;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface NoteFormData {
  title: string;
  content: string;
}

// Context types
export interface AuthContextType {
  user: UserWithTenant | null;
  tenant: Tenant | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export interface NotesContextType {
  notes: Note[];
  loading: boolean;
  error: string | null;
  currentNote: Note | null;
  canCreateMore: boolean;
  fetchNotes: () => Promise<void>;
  createNote: (data: CreateNoteRequest) => Promise<Note | null>;
  updateNote: (id: string, data: UpdateNoteRequest) => Promise<Note | null>;
  deleteNote: (id: string) => Promise<boolean>;
  selectNote: (note: Note | null) => void;
  refreshNoteCount: () => Promise<void>;
}

// Utility types
export type UserRole = User['role'];
export type SubscriptionPlan = Tenant['subscription_plan'];

// Component prop types
export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface InputProps {
  label?: string;
  error?: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface TextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  rows?: number;
  minRows?: number;
  maxRows?: number;
  error?: string;
  label?: string;
  className?: string;
}

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  onClick?: () => void;
}

// Error types
export class AppError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', statusCode: number = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class TenantIsolationError extends AppError {
  constructor(message: string = 'Tenant access violation') {
    super(message, 'TENANT_ISOLATION_ERROR', 403);
    this.name = 'TenantIsolationError';
  }
}

export class SubscriptionLimitError extends AppError {
  constructor(message: string = 'Subscription limit reached') {
    super(message, 'SUBSCRIPTION_LIMIT_ERROR', 402);
    this.name = 'SubscriptionLimitError';
  }
}

// JWT payload type
export interface JWTPayload {
  userId: string;
  tenantId: string;
  role: UserRole;
  email: string;
  iat?: number;
  exp?: number;
}