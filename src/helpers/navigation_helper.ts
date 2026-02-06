// Definición de las rutas en el orden que aparecen en el menú
// Basado en LayoutMenuData.tsx
export const MENU_ROUTES_ORDERED = [
  { id: 'admin-dashboard', path: '/dashboard' },
  { id: 'admin-ingresos', path: '/apps-invoices-list' }, // Primera subpantalla
  { id: 'admin-reservas', path: '/apps-ecommerce-orders' }, // Primera subpantalla  
  { id: 'admin-servicios', path: '/servicios' },
  { id: 'admin-staff', path: '/pages-team' },
  { id: 'admin-clientes', path: '/apps-ecommerce-customers' },
  { id: 'admin-reportes', path: '/reportes' }, // Aunque esté disabled, incluimos la ruta
  { id: 'admin-config', path: '/config' },
];

/**
 * Determina la primera ruta disponible para el usuario basándose en sus permisos
 * @param userPermissions - Array de screen IDs que el usuario puede ver
 * @returns La primera ruta disponible o '/dashboard' como fallback
 */
export const getFirstAvailableRoute = (userPermissions: string[]): string => {
  // Buscar la primera ruta disponible en el orden del menú
  for (const route of MENU_ROUTES_ORDERED) {
    if (userPermissions.includes(route.id)) {
      return route.path;
    }
  }
  
  // Fallback al dashboard si no se encuentra ninguna ruta
  // (no debería pasar en condiciones normales)
  return '/dashboard';
};