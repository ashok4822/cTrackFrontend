import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getProfile,
  updateProfile,
  updatePassword,
  updateProfileImage,
} from "@/store/slices/profileSlice";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { operatorNavItems } from "@/config/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Shield,
  Key,
  Save,
  Upload,
  Loader2
} from "lucide-react";

export default function OperatorProfile() {
  const dispatch = useAppDispatch();
  const { profile, isLoading } = useAppSelector((state) => state.profile);
  const { user } = useAppSelector((state) => state.auth);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [prevProfile, setPrevProfile] = useState(profile);

  // Sync state during rendering to avoid cascading renders
  if (profile !== prevProfile) {
    setPrevProfile(profile);
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
    }
  }

  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await dispatch(updateProfileImage(file)).unwrap();
      toast.success("Profile image updated successfully");
    } catch (error) {
      toast.error(error as string);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await dispatch(updateProfile({ name, phone })).unwrap();
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error as string);
    }
  };

  const handlePasswordChange = async () => {
    try {
      await dispatch(
        updatePassword({ currentPassword, newPassword, confirmPassword }),
      ).unwrap();
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error as string);
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "OP";
  };

  const getImageUrl = (path?: string) => {
    if (!path) return "/placeholder.svg";
    if (path.startsWith("http")) return path;

    let baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
    baseUrl = baseUrl.replace(/\/api$/, "");

    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${normalizedPath}`;
  };

  if (isLoading && !profile) {
    return (
      <DashboardLayout navItems={operatorNavItems} pageTitle="Profile">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={operatorNavItems} pageTitle="Profile">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={getImageUrl(profile?.profileImage)} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(profile?.name, profile?.email || user?.email)}
                  </AvatarFallback>
                </Avatar>
                <Label
                  htmlFor="profile-image"
                  className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
                >
                  <Upload className="h-6 w-6" />
                  <Input
                    id="profile-image"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </Label>
              </div>
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-2xl font-bold">{profile?.name || "Operator"}</h2>
                <p className="text-muted-foreground capitalize">{profile?.role || "Terminal Operator"}</p>
                <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" /> {profile?.email || user?.email}
                  </span>
                  {profile?.phone && (
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" /> {profile.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs defaultValue="personal">
          <TabsList className="mb-6">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || user?.email || ""}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone Number"
                    />
                  </div>
                </div>
                <Separator />
                <Button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Change Password</h4>
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handlePasswordChange}
                      disabled={isLoading}
                      className="gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Key className="h-4 w-4" />
                      )}
                      Update Password
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
