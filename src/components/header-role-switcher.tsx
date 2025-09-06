// V17.1.2-p2 — header role switcher (replaces Debugger)
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getRole, getCurrentUserRole, subscribe, setRole, type Role } from '@/lib/role-store';

export function HeaderRoleSwitcher() {
  const [role, setCurrentRole] = React.useState<Role>(getRole());
  
  React.useEffect(() => subscribe(setCurrentRole), []);
  
  const handleRoleChange = (newRole: string) => {
    setRole(newRole as Role);
  };
  
  const currentUserRole = getCurrentUserRole();
  
  return (
    <div className="flex items-center gap-3">
      <Badge variant="outline" className="text-xs">
        QA Mode
      </Badge>
      <div className="flex items-center gap-2">
        <Label htmlFor="role-select" className="text-sm font-medium">
          Role:
        </Label>
        <Select value={role} onValueChange={handleRoleChange}>
          <SelectTrigger id="role-select" className="w-40">
            <SelectValue />
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
      </div>
    </div>
  );
}