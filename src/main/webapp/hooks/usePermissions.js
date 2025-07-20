import { useState, useEffect, useMemo } from 'react';
import { getPermissions } from '../Utils/localStorage';
export const usePermissions = () => {
  const [permissionSet, setPermissionSet] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const perms = await getPermissions();

        setPermissionSet(new Set(Array.isArray(perms) ? perms : []));
      } catch (error) {
        console.error('Error loading permissions:', error);
        setPermissionSet(new Set());
      } finally {
        setLoading(false);
      }
    };
    loadPermissions();
  }, []);

  const checkPermissions = useMemo(
    () => ({
      hasPermission: permission => permissionSet.has(permission),
      hasAnyPermission: (...permissions) =>
        permissions.some(p => permissionSet.has(p)),
    }),
    [permissionSet]
  );

  return { ...checkPermissions, loading };
};
