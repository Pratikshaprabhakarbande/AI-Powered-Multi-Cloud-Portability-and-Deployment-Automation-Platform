/**
 * Sidebar navigation config (role-based).
 *
 * Each item: { label, to, icon, roles? }
 *  - roles: if present, only those roles see the item (default: all roles).
 */
import { ROLES, ALL_ROLES } from './roles.js';

const NON_VIEWER = [ROLES.ADMIN, ROLES.CLOUD_ENGINEER, ROLES.DEVOPS_ENGINEER];

export const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: 'dashboard', roles: ALL_ROLES },
      { label: 'Deploy', to: '/deploy', icon: 'rocket', roles: NON_VIEWER },
      { label: 'Deployments', to: '/deployments', icon: 'deployments', roles: ALL_ROLES }
    ]
  },
  {
    title: 'Operations',
    items: [
      { label: 'Terraform', to: '/terraform', icon: 'rocket', roles: NON_VIEWER },
      { label: 'Kubernetes', to: '/kubernetes', icon: 'container', roles: NON_VIEWER },
      { label: 'Monitoring', to: '/monitoring', icon: 'chart', roles: ALL_ROLES }
    ]
  },
  {
    title: 'Governance',
    items: [
      { label: 'Security Center', to: '/security', icon: 'shield', roles: ALL_ROLES },
      { label: 'Compliance', to: '/compliance', icon: 'compliance', roles: ALL_ROLES },
      { label: 'FinOps', to: '/finops', icon: 'dollar', roles: ALL_ROLES }
    ]
  },
  {
    title: 'Intelligence',
    items: [
      { label: 'AI Cloud Advisor', to: '/ai-architect', icon: 'sparkles', roles: NON_VIEWER },
      { label: 'Migration Advisor', to: '/migration', icon: 'migration', roles: NON_VIEWER }
    ]
  },
  {
    title: 'Account',
    items: [
      { label: 'Settings', to: '/settings', icon: 'cog', roles: ALL_ROLES },
      { label: 'User Management', to: '/admin/users', icon: 'users', roles: [ROLES.ADMIN] }
    ]
  }
];

/** Filter the nav tree for a given role. */
export function navForRole(role) {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || item.roles.includes(role))
  })).filter((section) => section.items.length > 0);
}
