import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

export enum UserRole {
    ADMIN = 'Admin',
    MANAGER = 'Manager',
    ACCOUNTANT = 'Accountant',
    STOREKEEPER = 'Storekeeper',
    WORKER = 'Worker',
    VIEWER = 'Viewer',
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
    const pathname = usePathname();

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
            setRole(null);
            setRoleId(null);
            return;
        }
        try {
            const parsed = jwtDecode<DecodedToken>(token);
            const r = parsed?.role;
            if (typeof r === 'object' && r !== null) {
                setRole(r.name as UserRole);
                setRoleId(r.id as number | null);
            } else {
                setRole(r as UserRole);
                setRoleId(null);
            }
        } catch {
            setRole(null);
            setRoleId(null);
        }
        // Re-read auth after client-side navigation (login sets the token post-mount,
        // so a mounted layout would otherwise keep the pre-login null token).
    }, [pathname]);

    const hasRole = (requiredRoles: UserRole[]) => {
        if (!role) return false;
        if (requiredRoles.includes(role)) return true;
        if (roleId !== null) {
            const roleMap: Record<string, number> = {
                [UserRole.ADMIN]: 1,
                [UserRole.MANAGER]: 3,
                [UserRole.ACCOUNTANT]: 4,
                [UserRole.STOREKEEPER]: 5,
                [UserRole.WORKER]: 6,
                [UserRole.VIEWER]: 7,
            };
            const requiredIds = requiredRoles.map(r => roleMap[r]).filter(Boolean);
            if (requiredIds.includes(roleId)) return true;
        }
        return false;
    };

    const isAdmin = role === UserRole.ADMIN || roleId === 1 || String(role).toLowerCase() === 'admin';
    const isManager = isAdmin || role === UserRole.MANAGER || roleId === 3;
    const isAccountant = isManager || role === UserRole.ACCOUNTANT || roleId === 4;
    const isStorekeeper = role === UserRole.STOREKEEPER || roleId === 5;
    const isViewer = role === UserRole.VIEWER || roleId === 7;
    const isWorker = role === UserRole.WORKER || roleId === 6;

    return { role, roleId, hasRole, isAdmin, isManager, isAccountant, isStorekeeper, isWorker, isViewer };
}
