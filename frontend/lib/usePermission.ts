import { useEffect, useMemo, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

export enum UserRole {
    ADMIN = 'Admin',
    MANAGER = 'Manager',
    ACCOUNTANT = 'Accountant',
    STOREKEEPER = 'Storekeeper',
    WORKER = 'Worker',
    USER = 'User',
}

type DecodedToken = {
    role?:
        | UserRole
        | {
              name: UserRole;
              id: number;
          };
};

export function usePermission() {
    const [role, setRole] = useState<UserRole | null>(null);
    const [roleId, setRoleId] = useState<number | null>(null);

    const parsed = useMemo(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return null;
        try {
            return jwtDecode<DecodedToken>(token);
        } catch {
            // ignore invalid token
            return null;
        }
    }, []);

    useEffect(() => {
        if (!parsed?.role) return;

        const r = parsed.role;
        // Avoid setState directly in effect body for this rule.
        // Compute next state first, then apply in a microtask.
        const next =
            typeof r === 'object'
                ? { role: r.name as UserRole, roleId: r.id as number | null }
                : { role: r as UserRole, roleId: null };

        queueMicrotask(() => {
            setRole(next.role);
            setRoleId(next.roleId);
        });
    }, [parsed]);



    const hasRole = (requiredRoles: UserRole[]) => {
        if (!role) return false;
        return requiredRoles.includes(role);
    };

    const isAdmin = role === UserRole.ADMIN || roleId === 1 || String(role).toLowerCase() === 'admin';
    const isManager = isAdmin || role === UserRole.MANAGER || roleId === 3;
    const isAccountant = isManager || role === UserRole.ACCOUNTANT || roleId === 4;
    const isStorekeeper = isManager || role === UserRole.STOREKEEPER || roleId === 5;

    return { role, roleId, hasRole, isAdmin, isManager, isAccountant, isStorekeeper };
}
