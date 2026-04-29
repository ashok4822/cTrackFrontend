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
import { UI_MESSAGES } from "@/constants/messages";
import {
  User,
  Mail,
  Phone,
  Shield,
  Key,
  Save,
  Upload,
  Loader2,
  Eye,
  EyeOff,
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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      toast.success(UI_MESSAGES.PROFILE.IMAGE_UPDATE_SUCCESS);
    } catch (error) {
      toast.error(error as string);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await dispatch(updateProfile({ name, phone })).unwrap();
      toast.success(UI_MESSAGES.PROFILE.UPDATE_SUCCESS);
    } catch (error) {
      toast.error(error as string);
    }
  };

  const handlePasswordChange = async () => {
    try {
      await dispatch(
        updatePassword({ currentPassword, newPassword, confirmPassword }),
      ).unwrap();
      toast.success(UI_MESSAGES.PROFILE.PASSWORD_UPDATE_SUCCESS);
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
    return UI_MESSAGES.TITLES.OPERATOR.slice(0, 2).toUpperCase();
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
      <DashboardLayout navItems={operatorNavItems} pageTitle={UI_MESSAGES.TITLES.PROFILE}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={operatorNavItems} pageTitle={UI_MESSAGES.TITLES.PROFILE}>
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
                <h2 className="text-2xl font-bold">{profile?.name || UI_MESSAGES.TITLES.OPERATOR}</h2>
                <p className="text-muted-foreground capitalize">{profile?.role || UI_MESSAGES.TITLES.OPERATOR}</p>
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
            <TabsTrigger value="personal">{UI_MESSAGES.PROFILE.PERSONAL_INFO_TAB}</TabsTrigger>
            <TabsTrigger value="security">{UI_MESSAGES.PROFILE.SECURITY_TAB}</TabsTrigger>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {UI_MESSAGES.PROFILE.PERSONAL_INFO}
                </CardTitle>
                <CardDescription>{UI_MESSAGES.PROFILE.UPDATE_DETAILS}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">{UI_MESSAGES.PROFILE.NAME}</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={UI_MESSAGES.PROFILE.YOUR_NAME}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{UI_MESSAGES.PROFILE.EMAIL}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || user?.email || ""}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{UI_MESSAGES.PROFILE.PHONE}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={UI_MESSAGES.PROFILE.PHONE_NUMBER}
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
                  {UI_MESSAGES.PROFILE.SAVE_CHANGES}
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
                  {UI_MESSAGES.PROFILE.SECURITY_SETTINGS}
                </CardTitle>
                <CardDescription>{UI_MESSAGES.PROFILE.MANAGE_SECURITY}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">{UI_MESSAGES.PROFILE.CHANGE_PASSWORD}</h4>
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">{UI_MESSAGES.PROFILE.CURRENT_PASSWORD}</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">{UI_MESSAGES.PROFILE.NEW_PASSWORD}</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        {UI_MESSAGES.PROFILE.CONFIRM_NEW_PASSWORD}
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
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
                      {UI_MESSAGES.PROFILE.UPDATE_PASSWORD}
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
