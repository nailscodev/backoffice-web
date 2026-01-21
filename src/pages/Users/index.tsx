import React from 'react';
import UserList from '../../Components/Users/UserList';
import RoleScreenAssignment from '../../Components/Roles/RoleScreenAssignment';

const UsersPage = () => {
  return (
    <>
      <UserList />
      <div style={{ marginTop: 40 }}>
        <RoleScreenAssignment />
      </div>
    </>
  );
};

export default UsersPage;
