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
import { Receipt, DollarSign, Edit, Plus, Package, Clock, Loader2 } from "lucide-react";
import { adminNavItems } from "@/config/navigation";
import { billingService, type Activity, type Charge, type ChargeHistory } from "@/services/billingService";
import { toast } from "sonner";

const AdminActivitiesCharges = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [history, setHistory] = useState<ChargeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCharge, setEditingCharge] = useState<Charge | null>(null);
  const [newRate, setNewRate] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdateRateOpen, setIsUpdateRateOpen] = useState(false);
  const [isNewActivityOpen, setIsNewActivityOpen] = useState(false);
  const [isEditActivityOpen, setIsEditActivityOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({
    code: "",
    name: "",
    description: "",
    category: "handling",
    unitType: "per-container",
  });
  const [isAddRateOpen, setIsAddRateOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [newCharge, setNewCharge] = useState<Partial<Charge>>({
    containerSize: "20ft",
    containerType: "all",
    rate: 0,
    currency: "INR",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [activitiesData, chargesData, historyData] = await Promise.all([
        billingService.fetchActivities(),
        billingService.fetchCharges(),
        billingService.fetchChargeHistory(),
      ]);
      setActivities(activitiesData);
      setCharges(chargesData);
      setHistory(historyData);
    } catch (error: unknown) {
      console.error("Failed to fetch billing data:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to load activities and charges: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRate = async () => {
    if (!editingCharge?.id || !newRate) return;

    try {
      setIsUpdating(true);
      await billingService.updateChargeRate(editingCharge.id, parseFloat(newRate), effectiveDate);
      toast.success("Charge rate updated successfully");
      setEditingCharge(null);
      setIsUpdateRateOpen(false);
      fetchData();
    } catch (_error) {
      toast.error("Failed to update charge rate");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleActivity = async (activity: Activity) => {
    try {
      await billingService.updateActivity(activity.id!, { active: !activity.active });
      toast.success(`Activity ${!activity.active ? "activated" : "deactivated"} successfully`);
      fetchData();
    } catch (_error) {
      toast.error("Failed to update activity status");
    }
  };

  const handleCreateActivity = async () => {
    if (!newActivity.code || !newActivity.name || !newActivity.category || !newActivity.unitType) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsCreating(true);
      await billingService.addActivity(newActivity);
      toast.success("New activity created successfully");
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
      const message = (error as any)?.response?.data?.message || (error instanceof Error ? error.message : "Failed to create activity");
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddRate = async () => {
    if (!selectedActivity?.id || !newCharge.rate) {
      toast.error("Please enter a valid rate");
      return;
    }

    try {
      setIsCreating(true);
      await billingService.addCharge({
        ...newCharge,
        activityId: selectedActivity.id,
      });
      toast.success("New charge rate added successfully");
      setIsAddRateOpen(false);
      setNewCharge({
        containerSize: "20ft",
        containerType: "all",
        rate: 0,
        currency: "INR",
      });
      fetchData();
    } catch (error: unknown) {
      const message = (error as any)?.response?.data?.message || (error instanceof Error ? error.message : "Failed to add charge rate");
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditActivity = async () => {
    if (!editingActivity?.id || !editingActivity.name || !editingActivity.category || !editingActivity.unitType) {
      toast.error("Please fill in all required fields");
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
      toast.success("Activity updated successfully");
      setIsEditActivityOpen(false);
      setEditingActivity(null);
      fetchData();
    } catch (error: unknown) {
      const message = (error as any)?.response?.data?.message || (error instanceof Error ? error.message : "Failed to update activity");
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
      header: "Code",
      sortable: true,
      render: (item) => (
        <span className="font-mono font-medium text-foreground">
          {item.code}
        </span>
      ),
    },
    {
      key: "name",
      header: "Activity Name",
      sortable: true,
    },
    {
      key: "description",
      header: "Description",
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {item.description}
        </span>
      ),
    },
    {
      key: "chargeRates",
      header: "Charge Rates",
      render: (item) => {
        const activityCharges = charges.filter((c) => c.activityId === item.id);
        if (activityCharges.length === 0)
          return (
            <span className="text-sm text-muted-foreground italic">
              No rates set
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
      header: "Category",
      sortable: true,
      render: (item) => (
        <Badge
          variant="outline"
          className={`capitalize ${getCategoryColor(item.category)}`}
        >
          {item.category}
        </Badge>
      ),
    },
    {
      key: "unitType",
      header: "Unit Type",
      render: (item) => (
        <span className="text-sm capitalize">
          {item.unitType.replace("-", " ")}
        </span>
      ),
    },
    {
      key: "active",
      header: "Status",
      render: (item) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={item.active}
            onCheckedChange={() => handleToggleActivity(item)}
          />
          <span className="text-sm">{item.active ? "Active" : "Inactive"}</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedActivity(item);
              setIsAddRateOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Rate
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingActivity({ ...item });
              setIsEditActivityOpen(true);
            }}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
      ),
    },
  ];

  const chargeColumns: Column<Charge>[] = [
    {
      key: "activityName",
      header: "Activity",
      sortable: true,
    },
    {
      key: "containerSize",
      header: "Size",
      sortable: true,
      render: (item) => (
        <Badge variant="outline" className="capitalize">
          {item.containerSize === "all" ? "All Sizes" : item.containerSize}
        </Badge>
      ),
    },
    {
      key: "containerType",
      header: "Type",
      sortable: true,
      render: (item) => (
        <span className="capitalize">
          {item.containerType === "all" ? "All Types" : item.containerType}
        </span>
      ),
    },
    {
      key: "rate",
      header: "Rate",
      sortable: true,
      render: (item) => (
        <span className="font-mono font-medium text-foreground">
          {item.currency} {item.rate.toFixed(2)}
        </span>
      ),
    },
    {
      key: "effectiveFrom",
      header: "Effective From",
      sortable: true,
      render: (item) => (
        <span className="text-sm">
          {new Date(item.effectiveFrom).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "active",
      header: "Status",
      render: (item) => (
        <Badge variant={item.active ? "default" : "secondary"}>
          {item.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setEditingCharge(item);
            setNewRate(item.rate.toString());
            setEffectiveDate(new Date().toISOString().split("T")[0]);
            setIsUpdateRateOpen(true);
          }}
        >
          <Edit className="h-4 w-4 mr-1" />
          Update Rate
        </Button>
      ),
    },
  ];

  const historyColumns: Column<ChargeHistory>[] = [
    {
      key: "activityName",
      header: "Activity",
      sortable: true,
    },
    {
      key: "containerSize",
      header: "Size",
      sortable: true,
      render: (item) => (
        <Badge variant="outline" className="capitalize">
          {item.containerSize === "all" ? "All Sizes" : item.containerSize}
        </Badge>
      ),
    },
    {
      key: "oldRate",
      header: "Old Rate",
      render: (item) => (
        <span className="text-muted-foreground line-through">
          {item.currency} {item.oldRate.toFixed(2)}
        </span>
      ),
    },
    {
      key: "newRate",
      header: "New Rate",
      render: (item) => (
        <span className="font-bold text-green-600">
          {item.currency} {item.newRate.toFixed(2)}
        </span>
      ),
    },
    {
      key: "changedAt",
      header: "Changed On",
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
              Activities & Charges
            </h1>
            <p className="text-muted-foreground">
              Manage billable activities and their charge rates
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isNewActivityOpen} onOpenChange={setIsNewActivityOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Activity
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Activity</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Activity Code *</Label>
                      <Input
                        id="code"
                        placeholder="e.g. LIFT"
                        value={newActivity.code}
                        onChange={(e) =>
                          setNewActivity({ ...newActivity, code: e.target.value.toUpperCase() })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Activity Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g. Container Lift"
                        value={newActivity.name}
                        onChange={(e) =>
                          setNewActivity({ ...newActivity, name: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Enter a brief description"
                      value={newActivity.description}
                      onChange={(e) =>
                        setNewActivity({ ...newActivity, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={newActivity.category}
                        onValueChange={(value) =>
                          setNewActivity({ ...newActivity, category: value })
                        }
                      >
                        <SelectTrigger id="category">
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
                      <Label htmlFor="unitType">Unit Type *</Label>
                      <Select
                        value={newActivity.unitType}
                        onValueChange={(value) =>
                          setNewActivity({ ...newActivity, unitType: value })
                        }
                      >
                        <SelectTrigger id="unitType">
                          <SelectValue placeholder="Select unit type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per-container">Per Container</SelectItem>
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
                  <Button variant="outline" onClick={() => setIsNewActivityOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateActivity} disabled={isCreating}>
                    {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Activity
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
                    Total Activities
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
                    Active Activities
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalCharges}</p>
                  <p className="text-sm text-muted-foreground">Charge Rates</p>
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
                  <p className="text-sm text-muted-foreground">Active Rates</p>
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
                <TabsTrigger value="activities">Activities</TabsTrigger>
                <TabsTrigger value="charges">Charge Rates</TabsTrigger>
                <TabsTrigger value="history">Rate History</TabsTrigger>
              </TabsList>
              <TabsContent value="activities">
                <DataTable
                  data={activities as any}
                  columns={activityColumns as any}
                  searchable
                  searchPlaceholder="Search activities..."
                />
              </TabsContent>
              <TabsContent value="charges">
                <DataTable
                  data={charges as any}
                  columns={chargeColumns as any}
                  searchable
                  searchPlaceholder="Search charge rates..."
                />
              </TabsContent>
              <TabsContent value="history">
                <DataTable
                  data={history as any}
                  columns={historyColumns as any}
                  searchable
                  searchPlaceholder="Search history..."
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Update Rate Dialog */}
        <Dialog open={isUpdateRateOpen} onOpenChange={setIsUpdateRateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Charge Rate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Activity</Label>
                  <p className="font-medium">{editingCharge?.activityName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Container Size
                  </Label>
                  <p className="capitalize">
                    {editingCharge?.containerSize === "all"
                      ? "All Sizes"
                      : editingCharge?.containerSize}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentRate">
                  Current Rate ({editingCharge?.currency})
                </Label>
                <Input id="currentRate" value={editingCharge?.rate.toFixed(2) || "0.00"} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newRate">New Rate ({editingCharge?.currency})</Label>
                <Input
                  id="newRate"
                  type="number"
                  step="0.01"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  placeholder="Enter new rate"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="updateEffectiveDate">Effective From</Label>
                <Input
                  id="updateEffectiveDate"
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUpdateRateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateRate} disabled={isUpdating}>
                {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Rate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Rate Dialog */}
        <Dialog open={isAddRateOpen} onOpenChange={setIsAddRateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Charge Rate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-muted-foreground">Activity</Label>
                <p className="font-medium">{selectedActivity?.name} ({selectedActivity?.code})</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size">Container Size</Label>
                  <Select
                    value={newCharge.containerSize}
                    onValueChange={(value) => setNewCharge({ ...newCharge, containerSize: value })}
                  >
                    <SelectTrigger id="size">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20ft">20ft</SelectItem>
                      <SelectItem value="40ft">40ft</SelectItem>
                      <SelectItem value="all">All Sizes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Container Type</Label>
                  <Select
                    value={newCharge.containerType}
                    onValueChange={(value) => setNewCharge({ ...newCharge, containerType: value })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="reefer">Reefer</SelectItem>
                      <SelectItem value="tank">Tank</SelectItem>
                      <SelectItem value="all">All Types</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate">Rate (INR)</Label>
                <Input
                  id="rate"
                  type="number"
                  value={newCharge.rate}
                  onChange={(e) => setNewCharge({ ...newCharge, rate: parseFloat(e.target.value) })}
                  placeholder="Enter rate"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddRateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddRate} disabled={isCreating}>
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Rate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Activity Dialog */}
        <Dialog open={isEditActivityOpen} onOpenChange={setIsEditActivityOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Activity</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-code">Activity Code</Label>
                  <Input
                    id="edit-code"
                    value={editingActivity?.code}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-[10px] text-muted-foreground italic">Code cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Activity Name *</Label>
                  <Input
                    id="edit-name"
                    placeholder="e.g. Container Lift"
                    value={editingActivity?.name || ""}
                    onChange={(e) =>
                      setEditingActivity(prev => prev ? { ...prev, name: e.target.value } : null)
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  placeholder="Enter a brief description"
                  value={editingActivity?.description || ""}
                  onChange={(e) =>
                    setEditingActivity(prev => prev ? { ...prev, description: e.target.value } : null)
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category *</Label>
                  <Select
                    value={editingActivity?.category}
                    onValueChange={(value) =>
                      setEditingActivity(prev => prev ? { ...prev, category: value } : null)
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
                  <Label htmlFor="edit-unitType">Unit Type *</Label>
                  <Select
                    value={editingActivity?.unitType}
                    onValueChange={(value) =>
                      setEditingActivity(prev => prev ? { ...prev, unitType: value } : null)
                    }
                  >
                    <SelectTrigger id="edit-unitType">
                      <SelectValue placeholder="Select unit type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per-container">Per Container</SelectItem>
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
              <Button variant="outline" onClick={() => setIsEditActivityOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditActivity} disabled={isCreating}>
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminActivitiesCharges;
