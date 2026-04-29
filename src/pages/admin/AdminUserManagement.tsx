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
import { UI_MESSAGES } from "@/constants/messages";

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
      .catch((err) => toast.error(err || UI_MESSAGES.ADMIN_USER.LOAD_FAILED));
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
      toast.success(UI_MESSAGES.ADMIN_USER.ADD_SUCCESS);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error || UI_MESSAGES.ADMIN_USER.ADD_FAILED);
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
      toast.success(UI_MESSAGES.ADMIN_USER.UPDATE_SUCCESS);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error || UI_MESSAGES.ADMIN_USER.UPDATE_FAILED);
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
      toast.success(UI_MESSAGES.ADMIN_USER.TOGGLE_SUCCESS(userToToggle.isBlocked));
      setConfirmDialogOpen(false);
      setUserToToggle(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error || UI_MESSAGES.ADMIN_USER.STATUS_UPDATE_FAILED);
      toast.error(message);
    }
  };

  const columns: Column<User>[] = [
    {
      key: "name",
      header: UI_MESSAGES.TABLE.NAME,
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
      header: UI_MESSAGES.TABLE.EMAIL,
      sortable: true,
    },
    {
      key: "role",
      header: UI_MESSAGES.TABLE.ROLE,
      render: (item) => <span className="capitalize">{item.role || "-"}</span>,
    },
    {
      key: "organization",
      header: UI_MESSAGES.TABLE.ORGANIZATION,
      render: (item) => item.companyName || item.organization || "-",
    },
    {
      key: "status",
      header: UI_MESSAGES.TABLE.STATUS,
      render: (item) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.isBlocked ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
          {item.isBlocked ? UI_MESSAGES.COMMON.BLOCKED : UI_MESSAGES.KPI.ACTIVE}
        </span>
      ),
    },
    {
      key: "actions",
      header: UI_MESSAGES.TABLE.ACTIONS,
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditClick(item)}
          >
            <Pencil className="h-3 w-3 mr-1" />
            {UI_MESSAGES.COMMON.EDIT}
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
                {UI_MESSAGES.COMMON.UNBLOCK}
              </>
            ) : (
              <>
                <Lock className="h-3 w-3 mr-1" />
                {UI_MESSAGES.COMMON.BLOCK}
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
      pageTitle={UI_MESSAGES.TITLES.USER_MANAGEMENT}
      pageActions={
        <div className="flex gap-2">
          <Button className="gap-2" onClick={() => setAddUserOpen(true)}>
            <Plus className="h-4 w-4" />
            {UI_MESSAGES.TITLES.ADD_USER}
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
                <p className="text-sm text-muted-foreground">{UI_MESSAGES.ADMIN_USER.TOTAL_USERS}</p>
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
                <p className="text-sm text-muted-foreground">{UI_MESSAGES.ADMIN_USER.TERMINAL_USERS}</p>
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
                <p className="text-sm text-muted-foreground">{UI_MESSAGES.ADMIN_USER.EXTERNAL_USERS}</p>
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
                <p className="text-sm text-muted-foreground">{UI_MESSAGES.ADMIN_USER.ROLES_DEFINED}</p>
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
        searchPlaceholder={UI_MESSAGES.ADMIN_USER.SEARCH_USERS}
      />

      {/* Add User Dialog */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{UI_MESSAGES.TITLES.ADD_USER}</DialogTitle>
            <DialogDescription>
              {UI_MESSAGES.ADMIN_USER.CREATE_USER_DESC}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{UI_MESSAGES.TABLE.FULL_NAME}</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                placeholder={UI_MESSAGES.COMMON.PLACEHOLDERS.DRIVER_NAME}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{UI_MESSAGES.TABLE.EMAIL}</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                placeholder={UI_MESSAGES.AUTH.EMAIL_PLACEHOLDER}
              />
            </div>

            <div className="space-y-2">
              <Label>{UI_MESSAGES.TABLE.ROLE}</Label>
              <Select
                value={newUser.role}
                onValueChange={(value: UserRole) =>
                  setNewUser({ ...newUser, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={UI_MESSAGES.PDA.MISSING_INFO} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{UI_MESSAGES.ADMIN_USER.ROLES.ADMIN}</SelectItem>
                  <SelectItem value="operator">{UI_MESSAGES.ADMIN_USER.ROLES.OPERATOR}</SelectItem>
                  <SelectItem value="customer">{UI_MESSAGES.ADMIN_USER.ROLES.CUSTOMER}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">{UI_MESSAGES.TABLE.ORGANIZATION_OPT}</Label>
              <Input
                id="organization"
                value={newUser.organization}
                onChange={(e) =>
                  setNewUser({ ...newUser, organization: e.target.value })
                }
                placeholder={UI_MESSAGES.ADMIN_USER.ORG_PLACEHOLDER}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserOpen(false)}>
              {UI_MESSAGES.COMMON.CANCEL}
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={!newUser.name || !newUser.email}
            >
              {UI_MESSAGES.TITLES.ADD_USER}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{UI_MESSAGES.TITLES.EDIT_USER}</DialogTitle>
            <DialogDescription>
              {UI_MESSAGES.ADMIN_USER.EDIT_USER_DESC}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{UI_MESSAGES.TABLE.FULL_NAME}</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{UI_MESSAGES.TABLE.ROLE}</Label>
                <Select
                  value={editFormData.role}
                  onValueChange={(value: UserRole) =>
                    setEditFormData({ ...editFormData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={UI_MESSAGES.PDA.MISSING_INFO} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{UI_MESSAGES.ADMIN_USER.ROLES.ADMIN}</SelectItem>
                    <SelectItem value="operator">{UI_MESSAGES.ADMIN_USER.ROLES.OPERATOR}</SelectItem>
                    <SelectItem value="customer">{UI_MESSAGES.ADMIN_USER.ROLES.CUSTOMER}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-org">{UI_MESSAGES.TABLE.ORGANIZATION}</Label>
                <Input
                  id="edit-org"
                  value={editFormData.organization}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, organization: e.target.value })
                  }
                  placeholder={UI_MESSAGES.ADMIN_USER.ORG_PLACEHOLDER}
                />
              </div>
              <div className="space-y-2">
                <Label>{UI_MESSAGES.TABLE.EMAIL}</Label>
                <Input value={selectedUser.email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground italic">{UI_MESSAGES.ADMIN_USER.EMAIL_IMMUTABLE}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserOpen(false)}>
              {UI_MESSAGES.COMMON.CANCEL}
            </Button>
            <Button onClick={handleUpdateUser} disabled={!editFormData.name}>
              {UI_MESSAGES.COMMON.SAVE_CHANGES}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Block/Unblock */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {userToToggle?.isBlocked ? UI_MESSAGES.COMMON.UNBLOCK : UI_MESSAGES.COMMON.BLOCK} {UI_MESSAGES.TABLE.USER}
            </DialogTitle>
            <DialogDescription>
              {userToToggle?.isBlocked ? UI_MESSAGES.ADMIN_USER.UNBLOCK_CONFIRM(userToToggle?.name || "") : UI_MESSAGES.ADMIN_USER.BLOCK_CONFIRM(userToToggle?.name || "")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              {UI_MESSAGES.COMMON.CANCEL}
            </Button>
            <Button
              variant={userToToggle?.isBlocked ? "default" : "destructive"}
              onClick={confirmToggleStatus}
            >
              {userToToggle?.isBlocked ? UI_MESSAGES.COMMON.UNBLOCK : UI_MESSAGES.COMMON.BLOCK}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
