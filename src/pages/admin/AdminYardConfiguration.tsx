import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { adminNavItems } from "@/config/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Settings, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { YardBlock } from "@/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchYardBlocks, createYardBlock, updateYardBlock } from "@/store/slices/yardSlice";

export default function AdminYardConfiguration() {
  const dispatch = useAppDispatch();
  const { blocks, isLoading } = useAppSelector((state) => state.yard);

  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("edit");
  const [selectedBlock, setSelectedBlock] = useState<YardBlock | null>(null);
  const [configForm, setConfigForm] = useState({
    name: "",
    capacity: 0,
  });

  useEffect(() => {
    dispatch(fetchYardBlocks());
  }, [dispatch]);

  const handleOpenAdd = () => {
    setDialogMode("add");
    setSelectedBlock(null);
    setConfigForm({
      name: "",
      capacity: 100,
    });
    setConfigDialogOpen(true);
  };

  const handleOpenConfig = (block: YardBlock) => {
    setDialogMode("edit");
    setSelectedBlock(block);
    setConfigForm({
      name: block.name,
      capacity: block.capacity,
    });
    setConfigDialogOpen(true);
  };

  const handleSaveConfig = async () => {
    try {
      if (dialogMode === "edit" && selectedBlock) {
        await dispatch(
          updateYardBlock({
            id: selectedBlock.id,
            name: configForm.name,
            capacity: configForm.capacity,
          }),
        ).unwrap();
        toast.success(`${configForm.name} updated successfully`);
      } else {
        await dispatch(
          createYardBlock({
            name: configForm.name,
            capacity: configForm.capacity,
          }),
        ).unwrap();
        toast.success(`${configForm.name} created successfully`);
      }

      setConfigDialogOpen(false);
    } catch (error) {
      toast.error(error as string);
    }
  };

  const totalCapacity = blocks.reduce(
    (acc: number, b: YardBlock) => acc + b.capacity,
    0,
  );
  const totalOccupied = blocks.reduce(
    (acc: number, b: YardBlock) => acc + b.occupied,
    0,
  );
  const utilization =
    totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  return (
    <DashboardLayout
      navItems={adminNavItems}
      pageTitle="Yard Configuration"
      pageActions={
        <Button className="gap-2" onClick={handleOpenAdd}>
          <Plus className="h-4 w-4" />
          Add Block
        </Button>
      }
    >
      {/* Yard Overview */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {blocks.length}
                </p>
                <p className="text-sm text-muted-foreground">Total Blocks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <MapPin className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {totalCapacity}
                </p>
                <p className="text-sm text-muted-foreground">Total Capacity</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <MapPin className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {totalOccupied}
                </p>
                <p className="text-sm text-muted-foreground">Total Occupied</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
                <MapPin className="h-5 w-5 text-sky-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {utilization}%
                </p>
                <p className="text-sm text-muted-foreground">Utilization</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Yard Blocks Grid */}
      {isLoading && blocks.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blocks.map((block: YardBlock) => {
            const percentage =
              block.capacity > 0
                ? Math.round((block.occupied / block.capacity) * 100)
                : 0;
            return (
              <Card
                key={block.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">{block.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenConfig(block)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Utilization Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          Utilization
                        </span>
                        <span
                          className={`text-sm font-medium ${percentage > 80
                            ? "text-destructive"
                            : percentage > 60
                              ? "text-amber-500"
                              : "text-emerald-500"
                            }`}
                        >
                          {percentage}%
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${percentage > 80
                            ? "bg-destructive"
                            : percentage > 60
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                            }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Block Details */}
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Capacity</p>
                        <p className="font-medium text-foreground">
                          {block.capacity}
                        </p>
                      </div>
                    </div>

                    {/* Occupancy */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm text-muted-foreground">
                        {block.occupied} / {block.capacity} slots used
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Block Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogMode === "add" ? <Plus className="h-5 w-5" /> : <Settings className="h-5 w-5" />}
              {dialogMode === "add" ? "Add New Block" : `Configure Block: ${selectedBlock?.name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="blockName">Block Name</Label>
              <Input
                id="blockName"
                value={configForm.name}
                onChange={(e) =>
                  setConfigForm({ ...configForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (Total Containers)</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                value={configForm.capacity}
                onChange={(e) =>
                  setConfigForm({
                    ...configForm,
                    capacity: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={() => setConfigDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveConfig} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialogMode === "add" ? "Add Block" : "Save Configuration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
