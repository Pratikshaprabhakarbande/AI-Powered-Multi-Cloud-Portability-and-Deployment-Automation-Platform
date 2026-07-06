/**
 * Shared enums and constants used across schemas, services, and middleware.
 * Centralizing these guarantees DB enums and business logic never drift apart.
 */

// ---- Roles & RBAC ----
export const ROLES = Object.freeze({
  ADMIN: 'Admin',
  CLOUD_ENGINEER: 'Cloud Engineer',
  DEVOPS_ENGINEER: 'DevOps Engineer',
  VIEWER: 'Viewer'
});
export const ROLE_VALUES = Object.values(ROLES);

// Permission tiers (used by RBAC middleware in Phase 5)
export const ROLE_RANK = Object.freeze({
  [ROLES.VIEWER]: 1,
  [ROLES.DEVOPS_ENGINEER]: 2,
  [ROLES.CLOUD_ENGINEER]: 3,
  [ROLES.ADMIN]: 4
});

// ---- Cloud providers ----
export const PROVIDERS = Object.freeze({
  AWS: 'aws',
  AZURE: 'azure',
  GCP: 'gcp'
});
export const PROVIDER_VALUES = Object.values(PROVIDERS);

// ---- Deployment ----
export const DEPLOYMENT_TYPES = Object.freeze({
  TERRAFORM: 'terraform',
  DOCKER: 'docker',
  KUBERNETES: 'kubernetes',
  MANUAL: 'manual'
});
export const DEPLOYMENT_TYPE_VALUES = Object.values(DEPLOYMENT_TYPES);

export const DEPLOYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  SUCCESS: 'success',
  FAILED: 'failed',
  ROLLED_BACK: 'rolled_back',
  DESTROYED: 'destroyed'
});
export const DEPLOYMENT_STATUS_VALUES = Object.values(DEPLOYMENT_STATUS);

// ---- Cloud resource kinds ----
export const RESOURCE_TYPES = Object.freeze({
  COMPUTE: 'compute',
  STORAGE: 'storage',
  DATABASE: 'database',
  NETWORK: 'network',
  CONTAINER: 'container',
  KUBERNETES: 'kubernetes',
  SERVERLESS: 'serverless',
  IAM: 'iam',
  OTHER: 'other'
});
export const RESOURCE_TYPE_VALUES = Object.values(RESOURCE_TYPES);

export const RESOURCE_STATUS = Object.freeze({
  RUNNING: 'running',
  STOPPED: 'stopped',
  PENDING: 'pending',
  TERMINATED: 'terminated',
  UNKNOWN: 'unknown'
});
export const RESOURCE_STATUS_VALUES = Object.values(RESOURCE_STATUS);

// ---- Severity / risk ----
export const SEVERITY = Object.freeze({
  INFO: 'info',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
});
export const SEVERITY_VALUES = Object.values(SEVERITY);

// ---- Compliance ----
export const COMPLIANCE_FRAMEWORKS = Object.freeze({
  CIS: 'CIS',
  NIST: 'NIST',
  ISO_27001: 'ISO_27001',
  SOC2: 'SOC2',
  GDPR: 'GDPR',
  HIPAA: 'HIPAA'
});
export const COMPLIANCE_FRAMEWORK_VALUES = Object.values(COMPLIANCE_FRAMEWORKS);

export const CHECK_STATUS = Object.freeze({
  PASS: 'pass',
  FAIL: 'fail',
  WARN: 'warn',
  NOT_APPLICABLE: 'not_applicable'
});
export const CHECK_STATUS_VALUES = Object.values(CHECK_STATUS);

// ---- Incidents ----
export const INCIDENT_STATUS = Object.freeze({
  OPEN: 'open',
  INVESTIGATING: 'investigating',
  MITIGATED: 'mitigated',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
});
export const INCIDENT_STATUS_VALUES = Object.values(INCIDENT_STATUS);

// ---- Migration ----
export const MIGRATION_STATUS = Object.freeze({
  DRAFT: 'draft',
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
});
export const MIGRATION_STATUS_VALUES = Object.values(MIGRATION_STATUS);

// ---- AI recommendations ----
export const RECOMMENDATION_TYPES = Object.freeze({
  ARCHITECTURE: 'architecture',
  COST_OPTIMIZATION: 'cost_optimization',
  SECURITY: 'security',
  SCALABILITY: 'scalability',
  PORTABILITY: 'portability',
  INCIDENT: 'incident'
});
export const RECOMMENDATION_TYPE_VALUES = Object.values(RECOMMENDATION_TYPES);

export const AI_SOURCES = Object.freeze({
  BEDROCK: 'bedrock',
  MOCK: 'mock'
});
export const AI_SOURCE_VALUES = Object.values(AI_SOURCES);

// ---- Notifications ----
export const NOTIFICATION_TYPES = Object.freeze({
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
});
export const NOTIFICATION_TYPE_VALUES = Object.values(NOTIFICATION_TYPES);

// ---- Audit actions ----
export const AUDIT_ACTIONS = Object.freeze({
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  DEPLOY: 'deploy',
  ROLLBACK: 'rollback',
  SCAN: 'scan',
  ENABLE_2FA: 'enable_2fa',
  DISABLE_2FA: 'disable_2fa',
  SESSION_REVOKED: 'session_revoked'
});
export const AUDIT_ACTION_VALUES = Object.values(AUDIT_ACTIONS);

// ---- Currency ----
export const CURRENCIES = Object.freeze(['USD', 'EUR', 'INR', 'GBP']);

// ---- Pagination defaults ----
export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
});
