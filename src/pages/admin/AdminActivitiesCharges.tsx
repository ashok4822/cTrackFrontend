import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Receipt,
  IndianRupee,
  Edit,
  Plus,
  Package,
  Clock,
  Loader2,
} from "lucide-react";
import { adminNavItems } from "@/config/navigation";
import {
  billingService,
  type Activity,
  type Charge,
  type ChargeHistory,
  type CargoCategory,
} from "@/services/billingService";

interface ApiError {
  response?: { data?: { message?: string } };
  message?: string;
}

import { UI_MESSAGES } from "@/constants/messages";
import { toast } from "sonner";

const getErrorMessage = (error: unknown, fallback: string): string => {
  const e = error as ApiError;
  return e?.response?.data?.message ?? e?.message ?? fallback;
};

const AdminActivitiesCharges = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [history, setHistory] = useState<ChargeHistory[]>([]);
  const [cargoCategories, setCargoCategories] = useState<CargoCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCharge, setEditingCharge] = useState<Charge | null>(null);
  const [newRate, setNewRate] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdateRateOpen, setIsUpdateRateOpen] = useState(false);
  const [isNewActivityOpen, setIsNewActivityOpen] = useState(false);
  const [isEditActivityOpen, setIsEditActivityOpen] = useState(false);
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingCategory, setEditingCategory] = useState<CargoCategory | null>(
    null,
  );
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({
    code: "",
    name: "",
    description: "",
    category: "handling",
    unitType: "per-container",
  });
  const [newCategory, setNewCategory] = useState<Partial<CargoCategory>>({
    name: "",
    description: "",
    chargePerTon: 0,
  });
  const [isActiveCharge, setIsActiveCharge] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [activitiesData, chargesData, historyData, categoriesData] =
        await Promise.all([
          billingService.fetchActivities(),
          billingService.fetchCharges(),
          billingService.fetchChargeHistory(),
          billingService.fetchCargoCategories(),
        ]);
      setActivities(activitiesData);
      setCharges(chargesData);
      setHistory(historyData);
      setCargoCategories(categoriesData);
    } catch (error: unknown) {
      console.error(UI_MESSAGES.ACTIVITY.FETCH_FAILED, error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : UI_MESSAGES.COMMON.UNKNOWN_ERROR;
      toast.error(`${UI_MESSAGES.ACTIVITY.FETCH_FAILED}: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRate = async () => {
    if (!editingCharge?.id || !newRate) return;

    try {
      setIsUpdating(true);
      await billingService.updateChargeRate(
        editingCharge.id,
        parseFloat(newRate),
        effectiveDate,
        isActiveCharge,
      );
      toast.success(UI_MESSAGES.CHARGE.UPDATE_SUCCESS);
      setEditingCharge(null);
      setIsUpdateRateOpen(false);
      fetchData();
    } catch {
      toast.error(UI_MESSAGES.CHARGE.UPDATE_FAILED);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleActivity = async (activity: Activity) => {
    try {
      await billingService.updateActivity(activity.id!, {
        active: !activity.active,
      });
      toast.success(UI_MESSAGES.ACTIVITY.TOGGLE_SUCCESS(!activity.active));
      fetchData();
    } catch {
      toast.error(UI_MESSAGES.ACTIVITY.UPDATE_FAILED);
    }
  };

  const handleCreateActivity = async () => {
    if (
      !newActivity.code ||
      !newActivity.name ||
      !newActivity.category ||
      !newActivity.unitType
    ) {
      toast.error(UI_MESSAGES.PDA.FILL_REQUIRED_FIELDS);
      return;
    }

    try {
      setIsCreating(true);
      await billingService.addActivity(newActivity);
      toast.success(UI_MESSAGES.ACTIVITY.CREATE_SUCCESS);
      setIsNewActivityOpen(false);
      setNewActivity({
        code: "",
        name: "",
        description: "",
        category: "handling",
        unitType: "per-container",
      });
      fetchData();
    } catch (error: unknown) {
      const message = getErrorMessage(
        error,
        UI_MESSAGES.ACTIVITY.CREATE_FAILED,
      );
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };



  const handleCreateCategory = async () => {
    if (!newCategory.name) {
      toast.error(UI_MESSAGES.PDA.FILL_REQUIRED_FIELDS);
      return;
    }

    try {
      setIsCreating(true);
      await billingService.addCargoCategory({
        name: newCategory.name,
        description: newCategory.description,
        chargePerTon: Number(newCategory.chargePerTon) || 0,
      });
      toast.success(UI_MESSAGES.CATEGORY.CREATE_SUCCESS);
      setIsNewCategoryOpen(false);
      setNewCategory({ name: "", description: "", chargePerTon: 0 });
      fetchData();
    } catch (error: unknown) {
      const message = getErrorMessage(
        error,
        UI_MESSAGES.CATEGORY.CREATE_FAILED,
      );
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory?.id || !editingCategory.name) {
      toast.error(UI_MESSAGES.PDA.FILL_REQUIRED_FIELDS);
      return;
    }

    try {
      setIsCreating(true);
      await billingService.updateCargoCategory(editingCategory.id, {
        name: editingCategory.name,
        description: editingCategory.description,
        active: editingCategory.active,
        chargePerTon: Number(editingCategory.chargePerTon) || 0,
      });
      toast.success(UI_MESSAGES.CATEGORY.UPDATE_SUCCESS);
      setIsEditCategoryOpen(false);
      setEditingCategory(null);
      fetchData();
    } catch (error: unknown) {
      const message = getErrorMessage(
        error,
        UI_MESSAGES.CATEGORY.UPDATE_FAILED,
      );
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditActivity = async () => {
    if (
      !editingActivity?.id ||
      !editingActivity.name ||
      !editingActivity.category ||
      !editingActivity.unitType
    ) {
      toast.error(UI_MESSAGES.PDA.FILL_REQUIRED_FIELDS);
      return;
    }

    try {
      setIsCreating(true);
      await billingService.updateActivity(editingActivity.id, {
        name: editingActivity.name,
        description: editingActivity.description,
        category: editingActivity.category,
        unitType: editingActivity.unitType,
      });
      toast.success(UI_MESSAGES.ACTIVITY.UPDATE_SUCCESS);
      setIsEditActivityOpen(false);
      setEditingActivity(null);
      fetchData();
    } catch (error: unknown) {
      const message = getErrorMessage(
        error,
        UI_MESSAGES.ACTIVITY.UPDATE_FAILED,
      );
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const activeActivities = activities.filter((a) => a.active).length;
  const totalCharges = charges.length;
  const activeCharges = charges.filter((c) => c.active).length;

  const getCategoryColor = (category: Activity["category"]) => {
    switch (category) {
      case "handling":
        return "bg-blue-500/10 text-blue-600";
      case "storage":
        return "bg-green-500/10 text-green-600";
      case "stuffing":
        return "bg-purple-500/10 text-purple-600";
      case "transport":
        return "bg-orange-500/10 text-orange-600";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const activityColumns: Column<Activity>[] = [
    {
      key: "code",
      header: UI_MESSAGES.TABLE.ACTIVITY_CODE,
      sortable: true,
      render: (item) => (
        <span className="font-mono font-medium text-foreground">
          {item.code}
        </span>
      ),
    },
    {
      key: "name",
      header: UI_MESSAGES.TABLE.ACTIVITY_NAME,
      sortable: true,
    },
    {
      key: "description",
      header: UI_MESSAGES.TABLE.DESCRIPTION,
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {item.description}
        </span>
      ),
    },
    {
      key: "chargeRates",
      header: UI_MESSAGES.TABLE.CHARGE_RATES,
      render: (item) => {
        const activityCharges = charges.filter((c) => c.activityId === item.id);
        if (activityCharges.length === 0)
          return (
            <span className="text-sm text-muted-foreground italic">
              {UI_MESSAGES.COMMON.NO_DATA}
            </span>
          );

        return (
          <div className="flex flex-wrap gap-1">
            {activityCharges.map((charge) => (
              <Badge
                key={charge.id}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-5"
              >
                {charge.containerSize !== "all"
                  ? `${charge.containerSize} `
                  : ""}
                {charge.currency} {charge.rate}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: "category",
      header: UI_MESSAGES.TABLE.CATEGORY,
      sortable: true,
      render: (item) => (
        <Badge
          variant="outline"
          className={`capitalize ${getCategoryColor(item.category)}`}
        >
          {UI_MESSAGES.ACTIVITY.CATEGORIES[
            item.category.toUpperCase() as keyof typeof UI_MESSAGES.ACTIVITY.CATEGORIES
          ] || item.category}
        </Badge>
      ),
    },
    {
      key: "unitType",
      header: UI_MESSAGES.TABLE.UNIT_TYPE,
      render: (item) => (
        <span className="text-sm capitalize">
          {UI_MESSAGES.ACTIVITY.UNIT_TYPES[
            item.unitType
              .replace(/-/g, "_")
              .toUpperCase() as keyof typeof UI_MESSAGES.ACTIVITY.UNIT_TYPES
          ] || item.unitType.replace("-", " ")}
        </span>
      ),
    },
    {
      key: "active",
      header: UI_MESSAGES.TABLE.STATUS,
      render: (item) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={item.active}
            onCheckedChange={() => handleToggleActivity(item)}
          />
          <span className="text-sm">
            {item.active ? UI_MESSAGES.KPI.ACTIVE : UI_MESSAGES.COMMON.INACTIVE}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: UI_MESSAGES.TABLE.ACTIONS,
      render: (item) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingActivity({ ...item });
              setIsEditActivityOpen(true);
            }}
          >
            <Edit className="h-4 w-4 mr-1" />
            {UI_MESSAGES.COMMON.EDIT}
          </Button>
        </div>
      ),
    },
  ];

  const chargeColumns: Column<Charge>[] = [
    {
      key: "activityName",
      header: UI_MESSAGES.TABLE.ACTIVITY,
      sortable: true,
    },
    {
      key: "containerSize",
      header: UI_MESSAGES.COMMON.SIZE,
      sortable: true,
      render: (item) => (
        <Badge variant="outline" className="capitalize">
          {item.containerSize === "all"
            ? UI_MESSAGES.TABLE.ALL_SIZES
            : item.containerSize}
        </Badge>
      ),
    },
    {
      key: "containerType",
      header: UI_MESSAGES.TABLE.TYPE,
      sortable: true,
      render: (item) => (
        <span className="capitalize">
          {item.containerType === "all"
            ? UI_MESSAGES.TABLE.ALL_TYPES
            : item.containerType}
        </span>
      ),
    },
    {
      key: "rate",
      header: UI_MESSAGES.TABLE.AMOUNT,
      sortable: true,
      render: (item) => (
        <span className="font-mono font-medium text-foreground">
          {item.currency} {item.rate.toFixed(2)}
        </span>
      ),
    },
    {
      key: "effectiveFrom",
      header: UI_MESSAGES.TABLE.EFFECTIVE_FROM,
      sortable: true,
      render: (item) => (
        <span className="text-sm">
          {new Date(item.effectiveFrom).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "active",
      header: UI_MESSAGES.TABLE.STATUS,
      render: (item) => (
        <Badge variant={item.active ? "default" : "secondary"}>
          {item.active ? UI_MESSAGES.KPI.ACTIVE : UI_MESSAGES.COMMON.INACTIVE}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: UI_MESSAGES.TABLE.ACTIONS,
      render: (item) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setEditingCharge(item);
            setNewRate(item.rate.toString());
            setEffectiveDate(new Date().toISOString().split("T")[0]);
            setIsActiveCharge(item.active);
            setIsUpdateRateOpen(true);
          }}
        >
          <Edit className="h-4 w-4 mr-1" />
          {UI_MESSAGES.TABLE.UPDATE_STATUS}
        </Button>
      ),
    },
  ];

  const historyColumns: Column<ChargeHistory>[] = [
    {
      key: "activityName",
      header: UI_MESSAGES.TABLE.ACTIVITY,
      sortable: true,
    },
    {
      key: "containerSize",
      header: UI_MESSAGES.COMMON.SIZE,
      sortable: true,
      render: (item) => (
        <Badge variant="outline" className="capitalize">
          {item.containerSize === "all"
            ? UI_MESSAGES.TABLE.ALL_SIZES
            : item.containerSize}
        </Badge>
      ),
    },
    {
      key: "oldRate",
      header: UI_MESSAGES.TABLE.OLD_RATE,
      render: (item) => (
        <span className="text-muted-foreground line-through">
          {item.currency} {item.oldRate.toFixed(2)}
        </span>
      ),
    },
    {
      key: "newRate",
      header: UI_MESSAGES.TABLE.NEW_RATE,
      render: (item) => (
        <span className="font-bold text-green-600">
          {item.currency} {item.newRate.toFixed(2)}
        </span>
      ),
    },
    {
      key: "changedAt",
      header: UI_MESSAGES.TABLE.CHANGED_ON,
      sortable: true,
      render: (item) => (
        <span className="text-sm">
          {new Date(item.changedAt).toLocaleString()}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <DashboardLayout navItems={adminNavItems}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={adminNavItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {UI_MESSAGES.TITLES.ACTIVITIES_CHARGES}
            </h1>
            <p className="text-muted-foreground">
              {UI_MESSAGES.ACTIVITY.MISC_BILL_DESC}
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog
              open={isNewActivityOpen}
              onOpenChange={setIsNewActivityOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {UI_MESSAGES.TITLES.NEW_ACTIVITY}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{UI_MESSAGES.TITLES.NEW_ACTIVITY}</DialogTitle>
                  <DialogDescription>
                    {UI_MESSAGES.STUFFING.DESCRIPTION}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">
                        {UI_MESSAGES.TABLE.ACTIVITY_CODE} *
                      </Label>
                      <Input
                        id="code"
                        placeholder={
                          UI_MESSAGES.COMMON.PLACEHOLDERS.ACTIVITY_CODE_EG
                        }
                        value={newActivity.code}
                        onChange={(e) =>
                          setNewActivity({
                            ...newActivity,
                            code: e.target.value.toUpperCase(),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        {UI_MESSAGES.TABLE.ACTIVITY_NAME} *
                      </Label>
                      <Input
                        id="name"
                        placeholder={
                          UI_MESSAGES.COMMON.PLACEHOLDERS.ACTIVITY_NAME_EG
                        }
                        value={newActivity.name}
                        onChange={(e) =>
                          setNewActivity({
                            ...newActivity,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      {UI_MESSAGES.TABLE.DESCRIPTION}
                    </Label>
                    <Input
                      id="description"
                      placeholder={
                        UI_MESSAGES.COMMON.PLACEHOLDERS.DESCRIPTION_EG
                      }
                      value={newActivity.description}
                      onChange={(e) =>
                        setNewActivity({
                          ...newActivity,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">
                        {UI_MESSAGES.TABLE.CATEGORY} *
                      </Label>
                      <Select
                        value={newActivity.category}
                        onValueChange={(value) =>
                          setNewActivity({ ...newActivity, category: value })
                        }
                      >
                        <SelectTrigger id="category">
                          <SelectValue
                            placeholder={
                              UI_MESSAGES.STUFFING.CATEGORY_PLACEHOLDER
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="handling">
                            {UI_MESSAGES.ACTIVITY.CATEGORIES.HANDLING}
                          </SelectItem>
                          <SelectItem value="storage">
                            {UI_MESSAGES.ACTIVITY.CATEGORIES.STORAGE}
                          </SelectItem>
                          <SelectItem value="stuffing">
                            {UI_MESSAGES.ACTIVITY.CATEGORIES.STUFFING}
                          </SelectItem>
                          <SelectItem value="transport">
                            {UI_MESSAGES.ACTIVITY.CATEGORIES.TRANSPORT}
                          </SelectItem>
                          <SelectItem value="other">
                            {UI_MESSAGES.ACTIVITY.CATEGORIES.OTHER}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unitType">
                        {UI_MESSAGES.TABLE.UNIT_TYPE} *
                      </Label>
                      <Select
                        value={newActivity.unitType}
                        onValueChange={(value) =>
                          setNewActivity({ ...newActivity, unitType: value })
                        }
                      >
                        <SelectTrigger id="unitType">
                          <SelectValue
                            placeholder={
                              UI_MESSAGES.COMMON.PLACEHOLDERS.SELECT_UNIT
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per-container">
                            {UI_MESSAGES.ACTIVITY.UNIT_TYPES.PER_CONTAINER}
                          </SelectItem>
                          <SelectItem value="per-day">
                            {UI_MESSAGES.ACTIVITY.UNIT_TYPES.PER_DAY}
                          </SelectItem>
                          <SelectItem value="per-hour">
                            {UI_MESSAGES.ACTIVITY.UNIT_TYPES.PER_HOUR}
                          </SelectItem>
                          <SelectItem value="per-teu">
                            {UI_MESSAGES.ACTIVITY.UNIT_TYPES.PER_TEU}
                          </SelectItem>
                          <SelectItem value="fixed">
                            {UI_MESSAGES.ACTIVITY.UNIT_TYPES.FIXED}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsNewActivityOpen(false)}
                  >
                    {UI_MESSAGES.COMMON.CANCEL}
                  </Button>
                  <Button onClick={handleCreateActivity} disabled={isCreating}>
                    {isCreating && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {UI_MESSAGES.COMMON.SUBMIT}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activities.length}</p>
                  <p className="text-sm text-muted-foreground">
                    {UI_MESSAGES.TABLE.TOTAL_ACTIVITIES}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Receipt className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeActivities}</p>
                  <p className="text-sm text-muted-foreground">
                    {UI_MESSAGES.TABLE.ACTIVE_ACTIVITIES}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <IndianRupee className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalCharges}</p>
                  <p className="text-sm text-muted-foreground">
                    {UI_MESSAGES.TABLE.CHARGE_RATES}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeCharges}</p>
                  <p className="text-sm text-muted-foreground">
                    {UI_MESSAGES.TABLE.ACTIVE_RATES}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tables with Tabs */}
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="activities">
              <TabsList className="mb-4">
                <TabsTrigger value="activities">
                  {UI_MESSAGES.KPI.OPERATIONS}
                </TabsTrigger>
                <TabsTrigger value="charges">
                  {UI_MESSAGES.TABLE.CHARGE_RATES}
                </TabsTrigger>
                <TabsTrigger value="categories">
                  {UI_MESSAGES.TABLE.CARGO_CATEGORIES}
                </TabsTrigger>
                <TabsTrigger value="history">
                  {UI_MESSAGES.TABLE.RATE_HISTORY}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="activities">
                <DataTable
                  data={activities as (Activity & { id: string })[]}
                  columns={
                    activityColumns as Column<Activity & { id: string }>[]
                  }
                  searchable
                  searchPlaceholder={UI_MESSAGES.TABLE.SEARCH_ACTIVITIES}
                />
              </TabsContent>
              <TabsContent value="charges">
                <DataTable
                  data={charges as (Charge & { id: string })[]}
                  columns={chargeColumns as Column<Charge & { id: string }>[]}
                  searchable
                  searchPlaceholder={UI_MESSAGES.TABLE.SEARCH_CHARGE_RATES}
                />
              </TabsContent>
              <TabsContent value="categories">
                <div className="flex justify-end mb-4">
                  <Dialog
                    open={isNewCategoryOpen}
                    onOpenChange={setIsNewCategoryOpen}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        {UI_MESSAGES.TITLES.ADD_CATEGORY}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {UI_MESSAGES.TITLES.ADD_CATEGORY}
                        </DialogTitle>
                        <DialogDescription>
                          Create a new cargo category for specialized billing.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="catName">
                            {UI_MESSAGES.TABLE.CATEGORY_NAME} *
                          </Label>
                          <Input
                            id="catName"
                            placeholder={
                              UI_MESSAGES.COMMON.PLACEHOLDERS.CARGO_CATEGORY_EG
                            }
                            value={newCategory.name}
                            onChange={(e) =>
                              setNewCategory({
                                ...newCategory,
                                name: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="catDesc">
                            {UI_MESSAGES.TABLE.DESCRIPTION}
                          </Label>
                          <Input
                            id="catDesc"
                            placeholder={
                              UI_MESSAGES.COMMON.PLACEHOLDERS.DESCRIPTION_EG
                            }
                            value={newCategory.description}
                            onChange={(e) =>
                              setNewCategory({
                                ...newCategory,
                                description: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="catCharge">
                            {UI_MESSAGES.TABLE.CHARGE_PER_TON} *
                          </Label>
                          <Input
                            id="catCharge"
                            type="number"
                            placeholder={
                              UI_MESSAGES.COMMON.PLACEHOLDERS.ZERO_AMOUNT
                            }
                            value={newCategory.chargePerTon}
                            onChange={(e) =>
                              setNewCategory({
                                ...newCategory,
                                chargePerTon: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsNewCategoryOpen(false)}
                        >
                          {UI_MESSAGES.COMMON.CANCEL}
                        </Button>
                        <Button
                          onClick={handleCreateCategory}
                          disabled={isCreating}
                        >
                          {isCreating && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          {UI_MESSAGES.COMMON.SUBMIT}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <DataTable
                  data={cargoCategories as (CargoCategory & { id: string })[]}
                  columns={[
                    {
                      key: "name",
                      header: UI_MESSAGES.PROFILE.NAME,
                      sortable: true,
                    },
                    {
                      key: "description",
                      header: UI_MESSAGES.TABLE.DESCRIPTION,
                    },
                    {
                      key: "chargePerTon",
                      header: UI_MESSAGES.TABLE.CHARGE_PER_TON,
                      render: (item: CargoCategory) => (
                        <span className="font-medium">
                          ₹{item.chargePerTon?.toFixed(2) || "0.00"}
                        </span>
                      ),
                    },
                    {
                      key: "active",
                      header: UI_MESSAGES.TABLE.STATUS,
                      render: (item: CargoCategory) => (
                        <Badge variant={item.active ? "default" : "secondary"}>
                          {item.active
                            ? UI_MESSAGES.KPI.ACTIVE
                            : UI_MESSAGES.COMMON.INACTIVE}
                        </Badge>
                      ),
                    },
                    {
                      key: "actions",
                      header: UI_MESSAGES.TABLE.ACTIONS,
                      render: (item: CargoCategory) => (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingCategory({ ...item });
                            setIsEditCategoryOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          {UI_MESSAGES.COMMON.EDIT}
                        </Button>
                      ),
                    },
                  ]}
                  searchable
                  searchPlaceholder={UI_MESSAGES.TABLE.SEARCH_CATEGORIES}
                />

                {/* Edit Category Dialog */}
                <Dialog
                  open={isEditCategoryOpen}
                  onOpenChange={setIsEditCategoryOpen}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {UI_MESSAGES.TITLES.EDIT_CATEGORY}
                      </DialogTitle>
                      <DialogDescription>
                        Update the details of the selected cargo category.
                      </DialogDescription>
                    </DialogHeader>
                    {editingCategory && (
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="editCatName">
                            {UI_MESSAGES.TABLE.CATEGORY_NAME} *
                          </Label>
                          <Input
                            id="editCatName"
                            value={editingCategory.name}
                            onChange={(e) =>
                              setEditingCategory({
                                ...editingCategory,
                                name: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editCatDesc">
                            {UI_MESSAGES.TABLE.DESCRIPTION}
                          </Label>
                          <Input
                            id="editCatDesc"
                            value={editingCategory.description || ""}
                            onChange={(e) =>
                              setEditingCategory({
                                ...editingCategory,
                                description: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id="editCatActive"
                            checked={editingCategory.active}
                            onCheckedChange={(checked) =>
                              setEditingCategory({
                                ...editingCategory,
                                active: checked,
                              })
                            }
                          />
                          <Label htmlFor="editCatActive">
                            {UI_MESSAGES.TABLE.ACTIVE_LABEL}
                          </Label>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editCatCharge">
                            Charge per ton *
                          </Label>
                          <Input
                            id="editCatCharge"
                            type="number"
                            value={editingCategory.chargePerTon}
                            onChange={(e) =>
                              setEditingCategory({
                                ...editingCategory,
                                chargePerTon: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditCategoryOpen(false)}
                      >
                        {UI_MESSAGES.COMMON.CANCEL}
                      </Button>
                      <Button
                        onClick={handleEditCategory}
                        disabled={isCreating}
                      >
                        {isCreating && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        {UI_MESSAGES.COMMON.SAVE_CHANGES}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TabsContent>
              <TabsContent value="history">
                <DataTable
                  data={history as (ChargeHistory & { id: string })[]}
                  columns={
                    historyColumns as Column<ChargeHistory & { id: string }>[]
                  }
                  searchable
                  searchPlaceholder={UI_MESSAGES.TABLE.SEARCH_HISTORY}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Update Rate Dialog */}
        <Dialog open={isUpdateRateOpen} onOpenChange={setIsUpdateRateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{UI_MESSAGES.TITLES.UPDATE_CHARGE_RATE}</DialogTitle>
              <DialogDescription>
                Set a new rate for this activity and specify its effective date.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">
                    {UI_MESSAGES.TABLE.ACTIVITY}
                  </Label>
                  <p className="font-medium">{editingCharge?.activityName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    {UI_MESSAGES.TABLE.SIZE}
                  </Label>
                  <p className="capitalize">
                    {editingCharge?.containerSize === "all"
                      ? UI_MESSAGES.TABLE.ALL_SIZES
                      : editingCharge?.containerSize}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentRate">
                  {UI_MESSAGES.TABLE.CURRENT_RATE} ({editingCharge?.currency})
                </Label>
                <Input
                  id="currentRate"
                  value={editingCharge?.rate.toFixed(2) || "0.00"}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newRate">
                  {UI_MESSAGES.TABLE.NEW_RATE} ({editingCharge?.currency})
                </Label>
                <Input
                  id="newRate"
                  type="number"
                  step="0.01"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  placeholder={UI_MESSAGES.COMMON.PLACEHOLDERS.NEW_RATE}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="updateEffectiveDate">
                  {UI_MESSAGES.TABLE.EFFECTIVE_FROM}
                </Label>
                <Input
                  id="updateEffectiveDate"
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="activeCharge">
                  {UI_MESSAGES.TABLE.ACTIVE_LABEL}
                </Label>
                <Switch
                  id="activeCharge"
                  checked={isActiveCharge}
                  onCheckedChange={setIsActiveCharge}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsUpdateRateOpen(false)}
              >
                {UI_MESSAGES.COMMON.CANCEL}
              </Button>
              <Button onClick={handleUpdateRate} disabled={isUpdating}>
                {isUpdating && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {UI_MESSAGES.TABLE.UPDATE_STATUS}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>



        {/* Edit Activity Dialog */}
        <Dialog open={isEditActivityOpen} onOpenChange={setIsEditActivityOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{UI_MESSAGES.TITLES.EDIT_ACTIVITY}</DialogTitle>
              <DialogDescription>
                Modify the details of an existing billable activity.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-code">
                    {UI_MESSAGES.TABLE.ACTIVITY_CODE}
                  </Label>
                  <Input
                    id="edit-code"
                    value={editingActivity?.code}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    Code cannot be changed
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">
                    {UI_MESSAGES.TABLE.ACTIVITY_NAME} *
                  </Label>
                  <Input
                    id="edit-name"
                    placeholder={
                      UI_MESSAGES.COMMON.PLACEHOLDERS.ACTIVITY_NAME_EG
                    }
                    value={editingActivity?.name || ""}
                    onChange={(e) =>
                      setEditingActivity((prev) =>
                        prev ? { ...prev, name: e.target.value } : null,
                      )
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">
                  {UI_MESSAGES.TABLE.DESCRIPTION}
                </Label>
                <Input
                  id="edit-description"
                  placeholder={UI_MESSAGES.COMMON.PLACEHOLDERS.DESCRIPTION_EG}
                  value={editingActivity?.description || ""}
                  onChange={(e) =>
                    setEditingActivity((prev) =>
                      prev ? { ...prev, description: e.target.value } : null,
                    )
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">
                    {UI_MESSAGES.TABLE.CATEGORY} *
                  </Label>
                  <Select
                    value={editingActivity?.category}
                    onValueChange={(value) =>
                      setEditingActivity((prev) =>
                        prev ? { ...prev, category: value } : null,
                      )
                    }
                  >
                    <SelectTrigger id="edit-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="handling">Handling</SelectItem>
                      <SelectItem value="storage">Storage</SelectItem>
                      <SelectItem value="stuffing">Stuffing</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-unitType">
                    {UI_MESSAGES.TABLE.UNIT_TYPE} *
                  </Label>
                  <Select
                    value={editingActivity?.unitType}
                    onValueChange={(value) =>
                      setEditingActivity((prev) =>
                        prev ? { ...prev, unitType: value } : null,
                      )
                    }
                  >
                    <SelectTrigger id="edit-unitType">
                      <SelectValue placeholder="Select unit type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per-container">
                        Per Container
                      </SelectItem>
                      <SelectItem value="per-day">Per Day</SelectItem>
                      <SelectItem value="per-hour">Per Hour</SelectItem>
                      <SelectItem value="per-teu">Per TEU</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditActivityOpen(false)}
              >
                {UI_MESSAGES.COMMON.CANCEL}
              </Button>
              <Button onClick={handleEditActivity} disabled={isCreating}>
                {isCreating && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {UI_MESSAGES.COMMON.SAVE_CHANGES}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminActivitiesCharges;
