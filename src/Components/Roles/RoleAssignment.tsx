import React, { useEffect, useState } from 'react';
import { Button, FormGroup, Label, Input } from 'reactstrap';
import { useTranslation } from 'react-i18next';

const RoleAssignment = ({ user, onClose }: any) => {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    user?.roles && Array.isArray(user.roles)
      ? user.roles
      : user?.role
        ? [user.role]
        : []
  );

  useEffect(() => {
    // Roles válidos en el backend
    setRoles(['owner', 'admin', 'staff']);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (e.target.checked) {
      setSelectedRoles([...selectedRoles, value]);
    } else {
      setSelectedRoles(selectedRoles.filter((role) => role !== value));
    }
  };

  const handleSave = () => {
    // TODO: save roles for user via API
    onClose();
  };

  return (
    <div style={{ padding: 32, minWidth: 320, maxWidth: 400 }}>
      <h3 className="mb-4 fs-4">{t('settings.users.assign_roles_to', { name: user?.name })}</h3>
      <FormGroup>
        {roles.map((role) => (
          <div key={role} className="form-check mb-3 d-flex align-items-center ps-2">
            <Input
              type="checkbox"
              id={`role-${role}`}
              value={role}
              checked={selectedRoles.includes(role)}
              onChange={handleChange}
              className="form-check-input me-2"
              style={{ width: 20, height: 20 }}
            />
            <Label for={`role-${role}`} className="form-check-label d-flex align-items-center" style={{ cursor: 'pointer', minHeight: 36 }}>
              {role === 'admin' && <span className="badge bg-primary me-2 px-2 py-1 fs-6" style={{ fontSize: 16 }}><i className="ri-shield-user-line me-1"></i>{t('settings.users.role.admin')}</span>}
              {role === 'owner' && <span className="badge bg-warning text-dark me-2 px-2 py-1 fs-6" style={{ fontSize: 16 }}><i className="ri-star-line me-1"></i>{t('settings.users.role.owner')}</span>}
              {role === 'staff' && <span className="badge bg-info text-dark me-2 px-2 py-1 fs-6" style={{ fontSize: 16 }}><i className="ri-user-3-line me-1"></i>{t('settings.users.role.staff')}</span>}
              <span style={{ fontSize: 15, color: '#555', fontWeight: 500 }}>
                {role === 'admin' && t('settings.users.role_desc.admin')}
                {role === 'owner' && t('settings.users.role_desc.owner')}
                {role === 'staff' && t('settings.users.role_desc.staff')}
              </span>
            </Label>
          </div>
        ))}
      </FormGroup>
      <div className="d-flex justify-content-end gap-2 mt-4">
        <Button color="primary" className="fs-6 px-3 py-2" onClick={handleSave}>{t('common.save')}</Button>
        <Button color="secondary" className="fs-6 px-3 py-2" onClick={onClose}>{t('common.cancel')}</Button>
      </div>
    </div>
  );
};

export default RoleAssignment;
