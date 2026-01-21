import React, { useEffect, useState } from 'react';
import { Button, Modal, Table } from 'reactstrap';
import UserForm from './UserForm';
import RoleAssignment from '../Roles/RoleAssignment';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showRoles, setShowRoles] = useState(false);

  useEffect(() => {
    // TODO: fetch users from API
    setUsers([]);
  }, []);

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setShowForm(true);
  };

  const handleAssignRoles = (user: any) => {
    setSelectedUser(user);
    setShowRoles(true);
  };

  return (
    <div>
      <Button color="primary" onClick={() => { setSelectedUser(null); setShowForm(true); }}>Nuevo Usuario</Button>
      <Table className="mt-3" bordered hover responsive>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Roles</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user: any) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.roles?.join(', ')}</td>
              <td>
                <Button size="sm" color="secondary" onClick={() => handleEdit(user)}>Editar</Button>{' '}
                <Button size="sm" color="info" onClick={() => handleAssignRoles(user)}>Roles</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Modal isOpen={showForm} toggle={() => setShowForm(false)}>
        <UserForm user={selectedUser} onClose={() => setShowForm(false)} />
      </Modal>
      <Modal isOpen={showRoles} toggle={() => setShowRoles(false)}>
        <RoleAssignment user={selectedUser} onClose={() => setShowRoles(false)} />
      </Modal>
    </div>
  );
};

export default UserList;
