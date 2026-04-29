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
import { UI_MESSAGES } from "@/constants/messages";
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
      toast.error(UI_MESSAGES.SHIPPING.FILL_ALL_FIELDS);
      return;
    }

    try {
      if (dialogMode === "edit" && selectedLine) {
        await dispatch(updateShippingLine({
          id: selectedLine.id,
          name: formData.name,
          code: formData.code,
        })).unwrap();
        toast.success(UI_MESSAGES.SHIPPING.UPDATE_SUCCESS);
      } else {
        await dispatch(createShippingLine(formData)).unwrap();
        toast.success(UI_MESSAGES.SHIPPING.ADD_SUCCESS);
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
      pageTitle={UI_MESSAGES.TITLES.SHIPPING_LINE_MANAGEMENT}
      pageActions={
        <Button onClick={handleOpenAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          {UI_MESSAGES.SHIPPING.ADD_TITLE}
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
            {UI_MESSAGES.SHIPPING.NO_LINES_FOUND}
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
                    <span className="text-sm text-muted-foreground">{UI_MESSAGES.TABLE.CODE}</span>
                    <span className="font-mono text-sm font-semibold text-primary">{line.shipping_line_code}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{UI_MESSAGES.COMMON.ADDED_ON} {line.createdAt ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(line.createdAt)) : UI_MESSAGES.COMMON.NA}</span>
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
            <DialogTitle>{dialogMode === "add" ? UI_MESSAGES.SHIPPING.ADD_TITLE : UI_MESSAGES.SHIPPING.EDIT_TITLE}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{UI_MESSAGES.SHIPPING.NAME_LABEL}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={UI_MESSAGES.SHIPPING.NAME_PLACEHOLDER}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">{UI_MESSAGES.SHIPPING.CODE_LABEL}</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder={UI_MESSAGES.SHIPPING.CODE_PLACEHOLDER}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
              {UI_MESSAGES.COMMON.CANCEL}
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialogMode === "add" ? UI_MESSAGES.COMMON.SUBMIT : UI_MESSAGES.COMMON.SAVE_CHANGES}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminShippinglineManagement;
