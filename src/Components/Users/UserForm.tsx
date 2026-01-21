import React from 'react';
import { useState } from 'react';
import { Form, FormGroup, Label, Input, Button, FormFeedback } from 'reactstrap';

const UserForm = ({ user, onClose }: any) => {
  const [formState, setFormState] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
  });
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const newErrors: any = {};
    if (!formState.name) newErrors.name = 'El nombre es requerido';
    if (!formState.email) newErrors.email = 'El email es requerido';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formState.email)) newErrors.email = 'Email inválido';
    if (!user && !formState.password) newErrors.password = 'La contraseña es requerida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    // TODO: API call here
    onClose();
  };

  return (
    <Form onSubmit={handleSubmit}>
      <FormGroup>
        <Label for="name">Nombre</Label>
        <Input
          id="name"
          name="name"
          value={formState.name}
          onChange={handleChange}
          invalid={!!errors.name}
        />
        {errors.name && <FormFeedback>{errors.name}</FormFeedback>}
      </FormGroup>
      <FormGroup>
        <Label for="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formState.email}
          onChange={handleChange}
          invalid={!!errors.email}
        />
        {errors.email && <FormFeedback>{errors.email}</FormFeedback>}
      </FormGroup>
      <FormGroup>
        <Label for="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formState.password}
          onChange={handleChange}
          invalid={!!errors.password}
          placeholder={user ? '(Dejar en blanco para no cambiar)' : ''}
        />
        {errors.password && <FormFeedback>{errors.password}</FormFeedback>}
      </FormGroup>
      <Button color="primary" type="submit">Guardar</Button>
      <Button color="secondary" onClick={onClose} style={{ marginLeft: 8 }} type="button">Cancelar</Button>
    </Form>
  );
};

export default UserForm;
