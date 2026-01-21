
import React, { useEffect, useState } from 'react';
import { menuData } from '../../Layouts/LayoutMenuData';


const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'manager', label: 'Gerente' },
  { value: 'staff', label: 'Personal' },
];

function flattenMenu(menu: any[]): { id: string, label: string }[] {
  const result: { id: string, label: string }[] = [];
  menu.forEach(item => {
    if (item.id && item.label) {
      result.push({ id: item.id, label: item.label });
    }
    if (item.subItems) {
      result.push(...flattenMenu(item.subItems));
    }
    if (item.childItems) {
      result.push(...flattenMenu(item.childItems));
    }
  });
  return result;
}

const RoleScreenAssignment = () => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [assignedScreens, setAssignedScreens] = useState<string[]>([]);
  const screens = flattenMenu(menuData);

  useEffect(() => {
    if (selectedRole) {
      // TODO: fetch assigned screens for selectedRole from API
      setAssignedScreens([]);
    }
  }, [selectedRole]);

  const handleScreenChange = (screenId: string) => {
    setAssignedScreens(prev =>
      prev.includes(screenId)
        ? prev.filter(id => id !== screenId)
        : [...prev, screenId]
    );
  };

  const handleSave = () => {
    // TODO: save assignedScreens for selectedRole via API
    alert(`Asignación guardada para el rol ${selectedRole}:\n${assignedScreens.join(', ')}`);
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <h3>Asignar Pantallas a Roles</h3>
      <label htmlFor="role-select">Selecciona un rol:</label>
      <select
        id="role-select"
        value={selectedRole}
        onChange={e => setSelectedRole(e.target.value)}
        style={{ width: '100%', marginBottom: 16, padding: 8 }}
      >
        <option value="">-- Selecciona un rol --</option>
        {ROLES.map(role => (
          <option key={role.value} value={role.value}>{role.label}</option>
        ))}
      </select>
      {selectedRole && (
        <>
          <div style={{ margin: '16px 0' }}>
            <strong>Pantallas disponibles:</strong>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {screens.map(screen => (
                <li key={screen.id} style={{ marginBottom: 8 }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={assignedScreens.includes(screen.id)}
                      onChange={() => handleScreenChange(screen.id)}
                    />{' '}
                    {screen.label}
                  </label>
                </li>
              ))}
            </ul>
          </div>
          <button onClick={handleSave} style={{ padding: '8px 16px', background: '#1677ff', color: '#fff', border: 'none', borderRadius: 4 }}>
            Guardar
          </button>
        </>
      )}
    </div>
  );
};

export default RoleScreenAssignment;
