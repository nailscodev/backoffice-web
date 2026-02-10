import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getUserPermissions } from '../helpers/backend_helper';

interface UserPermissions {
  screens: string[];
}

interface LoginResponse {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  token: string;
  permissions?: UserPermissions;
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get user from Redux store
  const user = useSelector((state: any) => state.Login?.user);

  useEffect(() => {
    let userPermissions: string[] = [];
    
    // First try to get permissions from Redux store (most up-to-date)
    if (user?.permissions?.screens) {
      userPermissions = user.permissions.screens;
    } else {
      // Fallback: Get permissions from sessionStorage (consistent with auth storage)
      const storedAuth = sessionStorage.getItem('authUser');
      if (storedAuth) {
        try {
          const authData: any = JSON.parse(storedAuth);
          if (authData.user?.permissions?.screens) {
            userPermissions = authData.user.permissions.screens;
          }
        } catch (error) {
          console.error('Error parsing stored auth data:', error);
        }
      }
    }
    
    setPermissions(userPermissions);
    setLoading(false);
  }, [user]);

  const hasPermission = (screenId: string): boolean => {
    return permissions.includes(screenId);
  };

  const filterMenuItems = <T extends { id?: string; subItems?: T[] }>(items: T[]): T[] => {
    return items.filter(item => {
      // If item has no id, it's probably a header - keep it
      if (!item.id) return true;
      
      // Check if user has permission for this screen
      if (!hasPermission(item.id)) return false;
      
      // If item has subItems, filter them recursively
      if (item.subItems && item.subItems.length > 0) {
        const filteredSubItems = filterMenuItems(item.subItems);
        // Only keep the parent if it has at least one accessible child
        if (filteredSubItems.length === 0) return false;
        // Update the item with filtered subItems
        item.subItems = filteredSubItems;
      }
      
      return true;
    });
  };

  const updatePermissions = (newPermissions: string[]) => {
    setPermissions(newPermissions);
    // Update sessionStorage (consistent with auth storage)
    const storedAuth = sessionStorage.getItem('authUser');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        if (authData.user) {
          authData.user.permissions = { screens: newPermissions };
        } else {
          authData.user = { permissions: { screens: newPermissions } };
        }
        sessionStorage.setItem('authUser', JSON.stringify(authData));
      } catch (error) {
        console.error('Error updating stored auth data:', error);
      }
    }
  };

  const refreshPermissions = async () => {
    try {
      setLoading(true);
      const response = await getUserPermissions();
      if (response && response.data && response.data.screens) {
        updatePermissions(response.data.screens);
      }
    } catch (error) {
      console.error('Error refreshing permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    permissions,
    loading,
    hasPermission,
    filterMenuItems,
    updatePermissions,
    refreshPermissions,
  };
};

export default usePermissions;