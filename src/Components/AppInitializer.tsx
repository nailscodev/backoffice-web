import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import useAppInitialization from '../hooks/useAppInitialization';
import { getLoggedinUser } from '../helpers/api_helper';

interface AppInitializerProps {
  children: React.ReactNode;
}

/**
 * Componente que inicializa la aplicación y maneja la redirección automática
 * Debe envolver toda la aplicación para garantizar la correcta inicialização
 */
const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  useAppInitialization();
  
  const navigate = useNavigate();
  const location = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Obtener el estado del usuario desde Redux
  const user = useSelector((state: any) => state.Login?.user);
  
  useEffect(() => {
    const checkAuthAndInitialize = async () => {
      try {
        // Verificar si hay datos de sesión
        const userProfile = getLoggedinUser();
        
        // Rutas públicas que no requieren autenticación
        const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
        const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route));
        
        console.log('🔍 Verificando autenticación:', {
          userProfile: !!userProfile,
          currentPath: location.pathname,
          isPublicRoute,
          reduxUser: !!user?.token
        });
        
        // Si no hay sesión y no estamos en una ruta pública, redirigir al login
        if (!userProfile && !isPublicRoute) {
          console.log('🚪 Sin sesión activa, redirigiendo al login');
          navigate('/login', { replace: true });
          return;
        }
        
        // Si hay sesión y estamos en login, redirigir al dashboard
        if (userProfile && location.pathname === '/login') {
          console.log('✅ Sesión activa en login, redirigiendo al dashboard');
          navigate('/dashboard', { replace: true });
          return;
        }
        
        setIsInitialized(true);
        
      } catch (error) {
        console.error('❌ Error durante verificación de auth:', error);
        setIsInitialized(true);
      }
    };

    // Delay mínimo para permitir la hidratación del Redux store
    const initTimeout = setTimeout(checkAuthAndInitialize, 100);
    
    return () => clearTimeout(initTimeout);
  }, [navigate, location.pathname, user]);
  
  // Mostrar loading mientras se inicializa
  if (!isInitialized) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

export default AppInitializer;