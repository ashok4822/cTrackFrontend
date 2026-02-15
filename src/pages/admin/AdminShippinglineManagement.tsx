import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { adminNavItems } from "@/config/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Anchor, Loader2, Calendar, Settings } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchShippingLines, createShippingLine, updateShippingLine } from "@/store/slices/shippingLineSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { ShippingLine } from "@/types";

const AdminShippinglineManagement = () => {
  const dispatch = useAppDispatch();
  const { lines, isLoading } = useAppSelector((state) => state.shippingLine);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [selectedLine, setSelectedLine] = useState<ShippingLine | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "" });

  useEffect(() => {
    dispatch(fetchShippingLines());
  }, [dispatch]);

  const handleOpenAdd = () => {
    setDialogMode("add");
    setSelectedLine(null);
    setFormData({ name: "", code: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (line: ShippingLine) => {
    setDialogMode("edit");
    setSelectedLine(line);
    setFormData({
      name: line.shipping_line_name,
      code: line.shipping_line_code,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      if (dialogMode === "edit" && selectedLine) {
        await dispatch(updateShippingLine({
          id: selectedLine.id,
          name: formData.name,
          code: formData.code,
        })).unwrap();
        toast.success("Shipping line updated successfully");
      } else {
        await dispatch(createShippingLine(formData)).unwrap();
        toast.success("Shipping line added successfully");
      }
      setIsDialogOpen(false);
      setFormData({ name: "", code: "" });
    } catch (error) {
      toast.error(error as string);
    }
  };

  return (
    <DashboardLayout
      navItems={adminNavItems}
      pageTitle="Shipping Line Management"
      pageActions={
        <Button onClick={handleOpenAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Shipping Line
        </Button>
      }
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && lines.length === 0 ? (
          <div className="col-span-full flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : lines.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No shipping lines found. Click "Add Shipping Line" to create one.
          </div>
        ) : (
          lines.map((line) => (
            <Card key={line.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold">{line.shipping_line_name}</CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit(line)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Anchor className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Code</span>
                    <span className="font-mono text-sm font-semibold text-primary">{line.shipping_line_code}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Added on {line.createdAt ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(line.createdAt)) : "N/A"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "Add New Shipping Line" : "Edit Shipping Line"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Shipping Line Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Maersk Line"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Shipping Line Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. MAEU"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialogMode === "add" ? "Create Shipping Line" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminShippinglineManagement;
