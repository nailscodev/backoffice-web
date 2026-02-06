import React from 'react';
import usePermissions from '../hooks/usePermissions';

interface ProtectedComponentProps {
  screenId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Componente que renderiza sus children solo si el usuario tiene permisos para ver la pantalla especificada
 */
export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({ 
  screenId, 
  children, 
  fallback = null 
}) => {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return <div>Loading permissions...</div>;
  }

  if (!hasPermission(screenId)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Hook personalizado para verificar permisos de forma más sencilla en componentes
 */
export const useScreenPermission = (screenId: string) => {
  const { hasPermission, loading } = usePermissions();
  
  return {
    canAccess: hasPermission(screenId),
    loading
  };
};

export default ProtectedComponent;