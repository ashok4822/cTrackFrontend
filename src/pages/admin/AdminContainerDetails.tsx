import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { adminNavItems } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchContainerById,
  updateContainer,
  clearCurrentContainer,
  fetchContainerHistory,
} from "@/store/slices/containerSlice";
import { fetchShippingLines } from "@/store/slices/shippingLineSlice";
import { fetchBlocks } from "@/store/slices/yardSlice";
import type {
  Container,
  ContainerSize,
  ContainerType,
  MovementType,
  ContainerStatus,
} from "@/types";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Box,
  //   MapPin,
  Truck,
  //   Calendar,
  AlertTriangle,
  Clock,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { UI_MESSAGES } from "@/constants/messages";

export default function ContainerDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    currentContainer: container,
    currentHistory: history,
    isLoading,
    error,
  } = useAppSelector((state) => state.container);
  const { lines: shippingLines } = useAppSelector(
    (state) => state.shippingLine,
  );
  const { blocks: yardBlocks } = useAppSelector((state) => state.yard);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Container>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchContainerById(id));
      dispatch(fetchContainerHistory(id));
      dispatch(fetchShippingLines());
      dispatch(fetchBlocks());
    }
    return () => {
      dispatch(clearCurrentContainer());
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (container) {
      setEditData(container);
    }
  }, [container]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  if (isLoading && !container) {
    return (
      <DashboardLayout
        navItems={adminNavItems}
        pageTitle={UI_MESSAGES.TITLES.LOADING}
      >
        <div className="flex items-center justify-center py-12">
          <p>{UI_MESSAGES.CONTAINER_DETAILS.LOADING_DESC}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!container && !isLoading) {
    return (
      <DashboardLayout navItems={adminNavItems} pageTitle={UI_MESSAGES.CONTAINER_DETAILS.NOT_FOUND}>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">{UI_MESSAGES.CONTAINER_DETAILS.NOT_FOUND}</h2>
          <p className="text-muted-foreground mb-4">
            {UI_MESSAGES.CONTAINER_DETAILS.NOT_FOUND_DESC}
          </p>
          <Button onClick={() => navigate("/admin/containers")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {UI_MESSAGES.CONTAINER_DETAILS.BACK_TO_CONTAINERS}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleEdit = () => {
    setIsEditing(true);
    if (container) setEditData(container);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (container) setEditData(container);
  };

  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      await dispatch(updateContainer({ id, data: editData })).unwrap();
      setIsEditing(false);
      toast.success(UI_MESSAGES.CONTAINER_DETAILS.UPDATE_SUCCESS);
    } catch (err: unknown) {
      const errorMessage =
        typeof err === "string" ? err : UI_MESSAGES.CONTAINER.UPDATE_FAILED;
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (!container) return null;

  return (
    <DashboardLayout
      navItems={adminNavItems}
      pageTitle={`${UI_MESSAGES.CONTAINER_DETAILS.TITLE}: ${container.containerNumber}`}
      pageActions={
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                {UI_MESSAGES.COMMON.CANCEL}
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? UI_MESSAGES.CONTAINER_DETAILS.SAVING : UI_MESSAGES.CONTAINER_DETAILS.SAVE_CHANGES}
              </Button>
            </>
          ) : (
            <Button onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              {UI_MESSAGES.CONTAINER_DETAILS.EDIT_CONTAINER}
            </Button>
          )}
        </div>
      }
    >
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/containers")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {UI_MESSAGES.CONTAINER_DETAILS.BACK_TO_LIST}
        </Button>
      </div>

      {/* Container Header Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                <Box className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {container.containerNumber}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{container.size}</Badge>
                  <Badge variant="outline" className="capitalize">
                    {container.type}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {container.empty ? UI_MESSAGES.KPI.EMPTY : UI_MESSAGES.KPI.LOADED}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {container.movementType}
                  </Badge>
                  <StatusBadge status={container.status} />
                </div>
              </div>
            </div>
            {container.damaged && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">{UI_MESSAGES.DESTUFFING.DAMAGED}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">{UI_MESSAGES.TITLES.DETAILS}</TabsTrigger>
          <TabsTrigger value="history">{UI_MESSAGES.CONTAINER_DETAILS.HISTORY}</TabsTrigger>
          {container.damaged && (
              <TabsTrigger value="damage">{UI_MESSAGES.TABLE.DAMAGE}</TabsTrigger>
          )}
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="h-5 w-5" />
                  {UI_MESSAGES.CONTAINER_DETAILS.INFO}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">
                      {UI_MESSAGES.CONTAINER_DETAILS.NUMBER_LABEL}
                    </Label>
                    <p className="font-medium">{container.containerNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{UI_MESSAGES.TABLE.SIZE}</Label>
                    {isEditing ? (
                      <Select
                        value={editData.size}
                        onValueChange={(value) =>
                          setEditData({
                            ...editData,
                            size: value as ContainerSize,
                          })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="20ft">20ft</SelectItem>
                          <SelectItem value="40ft">40ft</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">{container.size}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{UI_MESSAGES.TABLE.TYPE}</Label>
                    {isEditing ? (
                      <Select
                        value={editData.type}
                        onValueChange={(value) =>
                          setEditData({
                            ...editData,
                            type: value as ContainerType,
                          })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">{UI_MESSAGES.CONTAINER.STANDARD}</SelectItem>
                          <SelectItem value="reefer">{UI_MESSAGES.CONTAINER.REEFER}</SelectItem>
                          <SelectItem value="tank">{UI_MESSAGES.CONTAINER.TANK}</SelectItem>
                          <SelectItem value="open-top">{UI_MESSAGES.CONTAINER.OPEN_TOP}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium capitalize">{container.type}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{UI_MESSAGES.CONTAINER_DETAILS.LOAD_STATUS}</Label>
                    {isEditing ? (
                      <Select
                        value={editData.empty?.toString()}
                        onValueChange={(value) =>
                          setEditData({
                            ...editData,
                            empty: value === "true",
                          })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">{UI_MESSAGES.KPI.EMPTY}</SelectItem>
                          <SelectItem value="false">{UI_MESSAGES.KPI.LOADED}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">
                        {container.empty ? UI_MESSAGES.KPI.EMPTY : UI_MESSAGES.KPI.LOADED}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      {UI_MESSAGES.DESTUFFING.MOVEMENT_TYPE}
                    </Label>
                    {isEditing ? (
                      <Select
                        value={editData.movementType}
                        onValueChange={(value) =>
                          setEditData({
                            ...editData,
                            movementType: value as MovementType,
                          })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="import">{UI_MESSAGES.COMMON.IMPORT}</SelectItem>
                          <SelectItem value="export">{UI_MESSAGES.COMMON.EXPORT}</SelectItem>
                          <SelectItem value="domestic">{UI_MESSAGES.COMMON.DOMESTIC}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium capitalize">
                        {container.movementType}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{UI_MESSAGES.TABLE.STATUS}</Label>
                    {isEditing ? (
                      <Select
                        value={editData.status}
                        onValueChange={(value) =>
                          setEditData({
                            ...editData,
                            status: value as ContainerStatus,
                          })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{UI_MESSAGES.COMMON.STATUSES.PENDING}</SelectItem>
                          <SelectItem value="gate-in">{UI_MESSAGES.COMMON.STATUSES.GATE_IN}</SelectItem>
                          <SelectItem value="in-yard">{UI_MESSAGES.COMMON.STATUSES.IN_YARD}</SelectItem>
                          <SelectItem value="in-transit">{UI_MESSAGES.COMMON.STATUSES.IN_TRANSIT}</SelectItem>
                          <SelectItem value="at-port">{UI_MESSAGES.COMMON.STATUSES.AT_PORT}</SelectItem>
                          <SelectItem value="at-factory">{UI_MESSAGES.COMMON.STATUSES.AT_FACTORY}</SelectItem>
                          <SelectItem value="gate-out">{UI_MESSAGES.COMMON.STATUSES.GATE_OUT}</SelectItem>
                          <SelectItem value="damaged">{UI_MESSAGES.COMMON.STATUSES.DAMAGED}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <StatusBadge status={container.status} />
                    )}
                  </div>
                  {(isEditing
                    ? editData.status === "in-yard"
                    : container.status === "in-yard") && (
                      <div>
                        <Label className="text-muted-foreground">
                          {UI_MESSAGES.TABLE.BLOCK}
                        </Label>
                        {isEditing ? (
                          <Select
                            value={editData.yardLocation?.block || ""}
                            onValueChange={(value) =>
                              setEditData({
                                ...editData,
                                yardLocation: { block: value },
                              })
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder={UI_MESSAGES.TABLE.SELECT_BLOCK} />
                            </SelectTrigger>
                            <SelectContent>
                              {yardBlocks.map((block) => (
                                <SelectItem key={block.id} value={block.name}>
                                  {block.name} ({block.occupied}/{block.capacity})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="font-medium">
                            {container.yardLocation?.block || UI_MESSAGES.STUFFING.NOT_ASSIGNED}
                          </p>
                        )}
                      </div>
                    )}
                  <div>
                    <Label className="text-muted-foreground">{UI_MESSAGES.CONTAINER_DETAILS.DWELL_TIME}</Label>
                    <p className="font-medium">
                      {container.dwellTime
                        ? `${container.dwellTime} ${UI_MESSAGES.COMMON.DAYS}`
                        : UI_MESSAGES.COMMON.NA}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Label className="text-muted-foreground">{UI_MESSAGES.CONTAINER_DETAILS.BLACKLISTED}</Label>
                    {isEditing ? (
                      <input
                        type="checkbox"
                        checked={editData.blacklisted || false}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            blacklisted: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    ) : (
                      <Badge
                        variant={
                          container.blacklisted ? "destructive" : "outline"
                        }
                      >
                        {container.blacklisted ? UI_MESSAGES.COMMON.YES : UI_MESSAGES.COMMON.NO}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  {UI_MESSAGES.CONTAINER_DETAILS.SHIP_CUST}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">
                      {UI_MESSAGES.TABLE.SHIPPING_LINE}
                    </Label>
                    {isEditing ? (
                      <Select
                        value={editData.shippingLine}
                        onValueChange={(value) =>
                          setEditData({ ...editData, shippingLine: value })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {shippingLines.map((line) => (
                            <SelectItem
                              key={line.id}
                              value={line.shipping_line_name}
                            >
                              {line.shipping_line_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">{container.shippingLine}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{UI_MESSAGES.TABLE.CUSTOMER}</Label>
                    {isEditing ? (
                      <Input
                        className="mt-1"
                        value={editData.customer || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, customer: e.target.value })
                        }
                        placeholder={UI_MESSAGES.CONTAINER_DETAILS.ENTER_CUSTOMER}
                      />
                    ) : (
                      <p className="font-medium">{container.customer || "-"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{UI_MESSAGES.TABLE.WEIGHT_KG}</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        className="mt-1"
                        value={editData.weight || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            weight: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder={UI_MESSAGES.CONTAINER_DETAILS.ENTER_WEIGHT}
                      />
                    ) : (
                      <p className="font-medium">
                        {container.weight
                          ? `${container.weight.toLocaleString()} ${UI_MESSAGES.COMMON.KG}`
                          : "-"}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{UI_MESSAGES.CONTAINER_DETAILS.SEAL_NUMBER}</Label>
                    {isEditing ? (
                      <Input
                        className="mt-1"
                        value={editData.sealNumber || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            sealNumber: e.target.value,
                          })
                        }
                        placeholder={UI_MESSAGES.CONTAINER_DETAILS.ENTER_SEAL}
                      />
                    ) : (
                      <p className="font-medium">
                        {container.sealNumber || "-"}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent >

        {/* History Tab */}
        < TabsContent value="history" >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {UI_MESSAGES.CONTAINER_DETAILS.HISTORY}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {history && history.length > 0 ? (
                  <div className="relative pl-6 border-l-2 border-muted space-y-8">
                    {history.map((item, index) => (
                      <div key={item.id || index} className="relative">
                        <div className="absolute -left-[31px] mt-1 h-4 w-4 rounded-full border-2 border-background bg-primary"></div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-lg">
                              {item.activity}
                            </h4>
                            <p className="text-muted-foreground">
                              {item.details}
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full flex items-center gap-2 shrink-0 self-start sm:self-center">
                            <Clock className="h-3 w-3" />
                            {new Date(item.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>{UI_MESSAGES.CONTAINER_DETAILS.NO_HISTORY}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent >

        {/* Damage Tab */}
        {
          container.damaged && (
            <TabsContent value="damage">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    {UI_MESSAGES.CONTAINER_DETAILS.DAMAGE_REPORT}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">
                        {UI_MESSAGES.TABLE.DAMAGE_DETAILS}
                      </Label>
                      {isEditing ? (
                        <Textarea
                          className="mt-1"
                          value={editData.damageDetails || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              damageDetails: e.target.value,
                            })
                          }
                          placeholder={UI_MESSAGES.CONTAINER_DETAILS.DESCRIBE_DAMAGE}
                          rows={4}
                        />
                      ) : (
                        <p className="font-medium mt-1">
                          {container.damageDetails || UI_MESSAGES.CONTAINER_DETAILS.NO_DETAILS}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )
        }
      </Tabs >
    </DashboardLayout >
  );
}
