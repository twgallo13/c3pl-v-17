// V17.1.2-p4 — header role switcher for new layout
import React from 'react';
import { getRole, subscribe, setRole, type Role } from '@/lib/role-store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function HeaderRoleSwitcher() {
  const [role, setCurrentRole] = React.useState<Role>(getRole());
  
  React.useEffect(() => {
    return subscribe(setCurrentRole);
  }, []);

  const handleRoleChange = (newRole: string) => {
    setRole(newRole as Role);
  };

  return (
    <Select value={role} onValueChange={handleRoleChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Vendor">Vendor</SelectItem>
        <SelectItem value="AccountManager">Account Manager</SelectItem>
        <SelectItem value="CustomerService">Customer Service</SelectItem>
        <SelectItem value="Operations">Operations</SelectItem>
        <SelectItem value="Finance">Finance</SelectItem>
        <SelectItem value="Admin">Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}