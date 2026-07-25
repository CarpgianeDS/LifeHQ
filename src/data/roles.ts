export type Role = 'owner' | 'admin' | 'viewer';

export const roleOrder: Role[] = ['owner', 'admin', 'viewer'];

interface RoleMeta {
  label: string;
  color: string;
  bg: string;
}

export function roleMeta(role: Role): RoleMeta {
  if (role === 'owner') return { label: 'Owner', color: '#B5651D', bg: '#F3E3D2' };
  if (role === 'admin') return { label: 'Admin', color: '#3B5B7D', bg: '#E4EBF2' };
  return { label: 'Viewer', color: '#6B6560', bg: '#F1EEE8' };
}
