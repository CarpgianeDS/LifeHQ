import React, { createContext, useContext, useMemo, useState } from 'react';
import type { HouseholdMember, PendingInvite } from '../types/models';
import type { Role } from '../data/roles';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface HouseholdContextValue {
  members: HouseholdMember[];
  pendingInvites: PendingInvite[];
  sendInvite: (email: string, role: Role) => boolean;
  resendInvite: (id: string) => void;
  cancelInvite: (id: string) => void;
  setMemberRole: (id: string, role: Role) => void;
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<HouseholdMember[]>([
    { id: 'm1', name: 'Alex', email: 'alex@example.com', role: 'owner' },
  ]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);

  const sendInvite = (rawEmail: string, role: Role): boolean => {
    const email = rawEmail.trim();
    if (!EMAIL_RE.test(email)) return false;

    const id = uniqueId('inv');
    setPendingInvites((prev) => [...prev, { id, email, role, status: 'sending' }]);

    setTimeout(() => {
      setPendingInvites((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'pending' } : i)),
      );
      setTimeout(() => {
        setPendingInvites((prevInvites) => {
          const invite = prevInvites.find((i) => i.id === id);
          if (!invite) return prevInvites;

          const name = invite.email.split('@')[0];
          const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
          setMembers((prevMembers) => {
            const demoted =
              invite.role === 'owner'
                ? prevMembers.map((m) => (m.role === 'owner' ? { ...m, role: 'admin' as Role } : m))
                : prevMembers;
            return [...demoted, { id: uniqueId('m'), name: capitalized, email: invite.email, role: invite.role }];
          });

          return prevInvites.filter((i) => i.id !== id);
        });
      }, 3200);
    }, 900);

    return true;
  };

  const resendInvite = (id: string) => {
    setPendingInvites((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'sending' } : i)),
    );
    setTimeout(() => {
      setPendingInvites((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'pending' } : i)),
      );
    }, 900);
  };

  const cancelInvite = (id: string) => {
    setPendingInvites((prev) => prev.filter((i) => i.id !== id));
  };

  const setMemberRole = (id: string, role: Role) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === id) return { ...m, role };
        if (role === 'owner' && m.role === 'owner') return { ...m, role: 'admin' };
        return m;
      }),
    );
  };

  const value = useMemo(
    () => ({ members, pendingInvites, sendInvite, resendInvite, cancelInvite, setMemberRole }),
    [members, pendingInvites],
  );

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}

export function useHousehold() {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error('useHousehold must be used within a HouseholdProvider');
  return ctx;
}
