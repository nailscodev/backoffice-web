
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { menuData } from '../../Layouts/LayoutMenuData';
import { getRolePermissions, updateRolePermissions } from '../../helpers/backend_helper';

const ROLES = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Administrator' },  
  { value: 'staff', label: 'Staff' },
];

const RoleScreenAssignment = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('owner');
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({
    owner: [],
    admin: [],
    staff: []
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  function flattenMenu(menu: any[]): { id: string, label: string }[] {
    const result: { id: string, label: string }[] = [];
    
    menu.forEach(item => {
      // Only include items that are clickeable/navigatable (but include disabled ones too)
      const isClickeable = item.id && 
                           item.label && 
                           !item.isHeader && 
                           item.link && 
                           item.link !== "#" && 
                           item.link !== "/#";
      
      if (isClickeable) {
        result.push({ 
          id: item.id, 
          label: t(item.label) // Translate the label using the translation key
        });
      }
      
      // Recursively process subItems
      if (item.subItems) {
        result.push(...flattenMenu(item.subItems));
      }
      
      // Recursively process childItems
      if (item.childItems) {
        result.push(...flattenMenu(item.childItems));
      }
    });
    
    return result;
  }

  const screens = flattenMenu(menuData);

  // Load permissions for all roles on component mount
  useEffect(() => {
    loadAllPermissions();
  }, []);

  const loadAllPermissions = async () => {
    setLoading(true);
    try {
      const permissionsPromises = ROLES.map(async (role) => {
        try {
          const response = await getRolePermissions(role.value);
          return { role: role.value, screens: response?.data?.screens || [] };
        } catch (error) {
          console.warn(`No permissions found for role ${role.value}`);
          return { role: role.value, screens: [] };
        }
      });

      const results = await Promise.all(permissionsPromises);
      const newPermissions: Record<string, string[]> = {};
      
      results.forEach(result => {
        newPermissions[result.role] = result.screens;
      });

      setRolePermissions(newPermissions);
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScreenChange = (screenId: string) => {
    setRolePermissions(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].includes(screenId)
        ? prev[activeTab].filter(id => id !== screenId)
        : [...prev[activeTab], screenId]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateRolePermissions(activeTab, rolePermissions[activeTab]);
      toast.success(
        t('roles.assignment.success', {
          role: ROLES.find(r => r.value === activeTab)?.label,
          count: rolePermissions[activeTab].length,
        }),
        { autoClose: 3000 }
      );
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      toast.error(
        t('roles.assignment.error', {
          role: ROLES.find(r => r.value === activeTab)?.label,
          error: error.message || 'Unknown error'
        }),
        { autoClose: 4000 }
      );
    } finally {
      setSaving(false);
    }
  };

  const selectAll = () => {
    setRolePermissions(prev => ({
      ...prev,
      [activeTab]: screens.map(screen => screen.id)
    }));
  };

  const selectNone = () => {
    setRolePermissions(prev => ({
      ...prev,
      [activeTab]: []
    }));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header border-bottom">
              <h4 className="card-title mb-0">
                <i className="ri-shield-user-line me-2"></i>
                {t('roles.assignment.title')}
              </h4>
              <p className="text-muted mb-0 mt-1">
                {t('roles.assignment.description')}
              </p>
            </div>
            
            <div className="card-body">
              {/* Role Tabs */}
              <div className="mb-4">
                <ul className="nav nav-pills nav-justified">
                  {ROLES.map(role => (
                    <li key={role.value} className="nav-item">
                      <button
                        className={`nav-link ${activeTab === role.value ? 'active' : ''}`}
                        onClick={() => setActiveTab(role.value)}
                        style={{ 
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: '500'
                        }}
                      >
                        <i className={`ri-${role.value === 'owner' ? 'crown-line' : role.value === 'admin' ? 'admin-line' : 'user-line'} me-2`}></i>
                        {role.label}
                        <span className="badge bg-soft-primary text-primary ms-2">
                          {rolePermissions[role.value]?.length || 0}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Controls */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="mb-1">
                    <i className="ri-layout-grid-line me-2"></i>
                    {ROLES.find(r => r.value === activeTab)?.label} - {t('roles.assignment.available_screens')}
                  </h6>
                  <small className="text-muted">
                    {t('roles.assignment.select_instruction')}
                  </small>
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={selectAll}
                  >
                    <i className="ri-checkbox-multiple-line me-1"></i>
                    {t('roles.assignment.select_all')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={selectNone}
                  >
                    <i className="ri-checkbox-blank-line me-1"></i>
                    {t('roles.assignment.select_none')}
                  </button>
                </div>
              </div>
              
              {/* Screens Grid */}
              <div className="card border">
                <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <div className="row g-2">
                    {screens.map(screen => (
                      <div key={screen.id} className="col-md-6 col-lg-4">
                        <div 
                          className={`card h-100 border ${rolePermissions[activeTab]?.includes(screen.id) ? 'border-primary bg-light' : 'border-light'}`}
                          style={{ 
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => handleScreenChange(screen.id)}
                        >
                          <div className="card-body p-3">
                            <div className="d-flex align-items-start">
                              <div className="form-check me-3 mt-1">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={rolePermissions[activeTab]?.includes(screen.id) || false}
                                  onChange={() => handleScreenChange(screen.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div className="flex-grow-1">
                                <h6 className="card-title mb-1 fs-14">
                                  {screen.label}
                                </h6>
                                {/* <small className="text-muted font-monospace">
                                  {screen.id}
                                </small> */}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                <div className="text-muted">
                  <i className="ri-information-line me-1"></i>
                  {t('roles.assignment.screens_selected', {
                    selected: rolePermissions[activeTab]?.length || 0,
                    total: screens.length
                  })}
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={handleSave} 
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="ri-save-line me-2"></i>
                      {t('roles.assignment.save')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleScreenAssignment;