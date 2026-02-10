import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../slices/auth/login/reducer';
import { getLoggedinUser, setAuthorization } from '../helpers/api_helper';

/**
 * Hook para inicializar la aplicación y hidratar el store de Redux
 * con los datos de autenticación persistidos al recargar la página
 */
export const useAppInitialization = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const initializeApp = () => {
      try {
        // Obtener datos de autenticación del sessionStorage
        const userProfile = getLoggedinUser();
        
        console.log('🔄 Inicializando aplicación con datos de sesión:', userProfile);
        
        if (userProfile && userProfile.token) {
          // Configurar autorización para las llamadas API
          setAuthorization(userProfile.token);
          
          // Hidratar el store de Redux con los datos del usuario
          const userData = {
            token: userProfile.token,
            ...(userProfile.user || {}),
            // Preservar permisos si existen
            permissions: userProfile.user?.permissions || { screens: [] }
          };
          
          console.log('✅ Hydrating Redux store with user data:', userData);
          dispatch(loginSuccess(userData));
        } else {
          console.log('❌ No hay datos de sesión válidos, usuario no autenticado');
        }
      } catch (error) {
        console.error('❌ Error durante la inicialización de la aplicación:', error);
      }
    };

    initializeApp();
  }, [dispatch]);
};

export default useAppInitialization;