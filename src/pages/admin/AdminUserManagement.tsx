import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { adminNavItems } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User, UserRole } from "@/types";
import { Users, Plus, Shield, Pencil, Lock, Unlock } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAllUsers, toggleUserBlock, adminCreateUser, adminUpdateUser } from "@/store/slices/adminSlice";
import { toast } from "sonner";

export default function AdminUserManagement() {
  const dispatch = useAppDispatch();
  const { users, isLoading } = useAppSelector((state) => state.admin);

  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState<User | null>(null);

  // New user form state
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "operator" as UserRole,
    organization: "",
  });

  // Edit user form state
  const [editFormData, setEditFormData] = useState({
    name: "",
    role: "operator" as UserRole,
    organization: "",
  });

  useEffect(() => {
    dispatch(fetchAllUsers())
      .unwrap()
      .catch((err) => toast.error(err || "Failed to load users"));
  }, [dispatch]);

  const terminalUsers = users.filter((u) => u.role === "operator");
  const externalUsers = users.filter((u) => u.role === "customer" || u.role === "admin"); // Adjusted based on roles

  const handleAddUser = async () => {
    try {
      await dispatch(adminCreateUser(newUser)).unwrap();
      setAddUserOpen(false);
      setNewUser({
        name: "",
        email: "",
        role: "operator",
        organization: "",
      });
      toast.success("User added successfully");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error || "Failed to add user");
      toast.error(message);
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      role: user.role,
      organization: user.companyName || user.organization || "",
    });
    setEditUserOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      await dispatch(adminUpdateUser({
        userId: selectedUser.id,
        userData: editFormData
      })).unwrap();
      setEditUserOpen(false);
      toast.success("User updated successfully");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error || "Failed to update user");
      toast.error(message);
    }
  };

  const handleToggleBlock = (user: User) => {
    setUserToToggle(user);
    setConfirmDialogOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!userToToggle) return;
    try {
      await dispatch(toggleUserBlock(userToToggle.id)).unwrap();
      toast.success(`User ${userToToggle.isBlocked ? "unblocked" : "blocked"} successfully`);
      setConfirmDialogOpen(false);
      setUserToToggle(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error || "Failed to update user status");
      toast.error(message);
    }
  };

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <span className="text-sm font-medium text-primary">
              {item.name.charAt(0)}
            </span>
          </div>
          <span className="font-medium text-foreground">{item.name}</span>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
    },
    {
      key: "role",
      header: "Role",
      render: (item) => <span className="capitalize">{item.role || "-"}</span>,
    },
    {
      key: "organization",
      header: "Organization",
      render: (item) => item.companyName || item.organization || "-",
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.isBlocked ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
          {item.isBlocked ? 'Blocked' : 'Active'}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditClick(item)}
          >
            <Pencil className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleBlock(item)}
            className={item.isBlocked ? "text-success hover:text-success" : "text-destructive hover:text-destructive"}
          >
            {item.isBlocked ? (
              <>
                <Unlock className="h-3 w-3 mr-1" />
                Unblock
              </>
            ) : (
              <>
                <Lock className="h-3 w-3 mr-1" />
                Block
              </>
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout
      navItems={adminNavItems}
      pageTitle="User & Role Management"
      pageActions={
        <div className="flex gap-2">
          <Button className="gap-2" onClick={() => setAddUserOpen(true)}>
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      }
    >
      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {users.length}
                </p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Users className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {terminalUsers.length}
                </p>
                <p className="text-sm text-muted-foreground">Terminal Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Users className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {externalUsers.length}
                </p>
                <p className="text-sm text-muted-foreground">External Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                <Shield className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">3</p>
                <p className="text-sm text-muted-foreground">Roles Defined</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Table */}
      <DataTable
        data={users}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search users..."
      />

      {/* Add User Dialog */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with role assignment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                placeholder="Enter email address"
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(value: UserRole) =>
                  setNewUser({ ...newUser, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">Organization (Optional)</Label>
              <Input
                id="organization"
                value={newUser.organization}
                onChange={(e) =>
                  setNewUser({ ...newUser, organization: e.target.value })
                }
                placeholder="Enter organization name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={!newUser.name || !newUser.email}
            >
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and access level.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editFormData.role}
                  onValueChange={(value: UserRole) =>
                    setEditFormData({ ...editFormData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="operator">Operator</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-org">Organization</Label>
                <Input
                  id="edit-org"
                  value={editFormData.organization}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, organization: e.target.value })
                  }
                  placeholder="Enter organization name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={selectedUser.email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground italic">Email cannot be changed.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={!editFormData.name}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Block/Unblock */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {userToToggle?.isBlocked ? "Unblock User" : "Block User"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {userToToggle?.isBlocked ? "unblock" : "block"}{" "}
              <span className="font-semibold text-foreground">{userToToggle?.name}</span>?{" "}
              {userToToggle?.isBlocked
                ? "This will restore their access to the system."
                : "This will immediately revoke their access to the system."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={userToToggle?.isBlocked ? "default" : "destructive"}
              onClick={confirmToggleStatus}
            >
              {userToToggle?.isBlocked ? "Confirm Unblock" : "Confirm Block"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
