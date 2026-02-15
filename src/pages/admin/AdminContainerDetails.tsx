import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavItems } from '@/config/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchContainerById, updateContainer, clearCurrentContainer } from '@/store/slices/containerSlice';
import { fetchShippingLines } from '@/store/slices/shippingLineSlice';
import { fetchYardBlocks } from '@/store/slices/yardSlice';
import type { Container, ContainerSize, ContainerType, MovementType, ContainerStatus } from '@/types';
import {
    ArrowLeft,
    Edit,
    Save,
    X,
    Box,
    MapPin,
    Truck,
    Calendar,
    AlertTriangle,
    Clock,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ContainerDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { currentContainer: container, isLoading, error } = useAppSelector((state) => state.container);
    const { lines: shippingLines } = useAppSelector((state) => state.shippingLine);
    const { blocks: yardBlocks } = useAppSelector((state) => state.yard);

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Container>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (id) {
            dispatch(fetchContainerById(id));
            dispatch(fetchShippingLines());
            dispatch(fetchYardBlocks());
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
            <DashboardLayout navItems={adminNavItems} pageTitle="Loading Container...">
                <div className="flex items-center justify-center py-12">
                    <p>Loading container details...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!container && !isLoading) {
        return (
            <DashboardLayout navItems={adminNavItems} pageTitle="Container Not Found">
                <div className="flex flex-col items-center justify-center py-12">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Container Not Found</h2>
                    <p className="text-muted-foreground mb-4">
                        The container you're looking for doesn't exist.
                    </p>
                    <Button onClick={() => navigate('/admin/containers')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Containers
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
            toast.success("Container updated successfully");
        } catch (err: unknown) {
            const errorMessage = typeof err === "string" ? err : "Failed to update container";
            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString();
    };

    if (!container) return null;

    return (
        <DashboardLayout
            navItems={adminNavItems}
            pageTitle={`Container: ${container.containerNumber}`}
            pageActions={
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                <Save className="h-4 w-4 mr-2" />
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={handleEdit}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Container
                        </Button>
                    )}
                </div>
            }
        >
            <div className="mb-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/admin/containers')}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Container List
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
                                <h2 className="text-2xl font-bold">{container.containerNumber}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline">{container.size}</Badge>
                                    <Badge variant="outline" className="capitalize">
                                        {container.type}
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
                                <span className="font-medium">Damaged</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="details" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="location">Location</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    {container.damaged && <TabsTrigger value="damage">Damage</TabsTrigger>}
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details">
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Box className="h-5 w-5" />
                                    Container Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Container Number</Label>
                                        <p className="font-medium">{container.containerNumber}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Size</Label>
                                        {isEditing ? (
                                            <Select
                                                value={editData.size}
                                                onValueChange={(value) =>
                                                    setEditData({ ...editData, size: value as ContainerSize })
                                                }
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="20ft">20ft</SelectItem>
                                                    <SelectItem value="40ft">40ft</SelectItem>
                                                    <SelectItem value="45ft">45ft</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <p className="font-medium">{container.size}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Type</Label>
                                        {isEditing ? (
                                            <Select
                                                value={editData.type}
                                                onValueChange={(value) =>
                                                    setEditData({ ...editData, type: value as ContainerType })
                                                }
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="standard">Standard</SelectItem>
                                                    <SelectItem value="reefer">Reefer</SelectItem>
                                                    <SelectItem value="tank">Tank</SelectItem>
                                                    <SelectItem value="open-top">Open Top</SelectItem>
                                                    <SelectItem value="flat-rack">Flat Rack</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <p className="font-medium capitalize">{container.type}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Movement Type</Label>
                                        {isEditing ? (
                                            <Select
                                                value={editData.movementType}
                                                onValueChange={(value) =>
                                                    setEditData({ ...editData, movementType: value as MovementType })
                                                }
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="import">Import</SelectItem>
                                                    <SelectItem value="export">Export</SelectItem>
                                                    <SelectItem value="domestic">Domestic</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <p className="font-medium capitalize">{container.movementType}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Status</Label>
                                        {isEditing ? (
                                            <Select
                                                value={editData.status}
                                                onValueChange={(value) =>
                                                    setEditData({ ...editData, status: value as ContainerStatus })
                                                }
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="gate-in">Gate In</SelectItem>
                                                    <SelectItem value="in-yard">In Yard</SelectItem>
                                                    <SelectItem value="in-transit">In Transit</SelectItem>
                                                    <SelectItem value="at-port">At Port</SelectItem>
                                                    <SelectItem value="at-factory">At Factory</SelectItem>
                                                    <SelectItem value="gate-out">Gate Out</SelectItem>
                                                    <SelectItem value="damaged">Damaged</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <StatusBadge status={container.status} />
                                        )}
                                    </div>
                                    {(isEditing ? editData.status === "in-yard" : container.status === "in-yard") && (
                                        <div>
                                            <Label className="text-muted-foreground">Yard Block</Label>
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
                                                        <SelectValue placeholder="Select block" />
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
                                                    {container.yardLocation?.block || "Not Assigned"}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    <div>
                                        <Label className="text-muted-foreground">Dwell Time</Label>
                                        <p className="font-medium">
                                            {container.dwellTime ? `${container.dwellTime} days` : '-'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Label className="text-muted-foreground">Blacklisted</Label>
                                        {isEditing ? (
                                            <input
                                                type="checkbox"
                                                checked={editData.blacklisted || false}
                                                onChange={(e) =>
                                                    setEditData({ ...editData, blacklisted: e.target.checked })
                                                }
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                        ) : (
                                            <Badge variant={container.blacklisted ? "destructive" : "outline"}>
                                                {container.blacklisted ? "Yes" : "No"}
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
                                    Shipping & Customer
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-muted-foreground">Shipping Line</Label>
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
                                                        <SelectItem key={line.id} value={line.shipping_line_name}>
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
                                        <Label className="text-muted-foreground">Customer</Label>
                                        {isEditing ? (
                                            <Input
                                                className="mt-1"
                                                value={editData.customer || ''}
                                                onChange={(e) =>
                                                    setEditData({ ...editData, customer: e.target.value })
                                                }
                                                placeholder="Enter customer name"
                                            />
                                        ) : (
                                            <p className="font-medium">{container.customer || '-'}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Weight (kg)</Label>
                                        {isEditing ? (
                                            <Input
                                                type="number"
                                                className="mt-1"
                                                value={editData.weight || ''}
                                                onChange={(e) =>
                                                    setEditData({
                                                        ...editData,
                                                        weight: e.target.value ? Number(e.target.value) : undefined,
                                                    })
                                                }
                                                placeholder="Enter weight"
                                            />
                                        ) : (
                                            <p className="font-medium">
                                                {container.weight ? `${container.weight.toLocaleString()} kg` : '-'}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Seal Number</Label>
                                        {isEditing ? (
                                            <Input
                                                className="mt-1"
                                                value={editData.sealNumber || ''}
                                                onChange={(e) =>
                                                    setEditData({ ...editData, sealNumber: e.target.value })
                                                }
                                                placeholder="Enter seal number"
                                            />
                                        ) : (
                                            <p className="font-medium">{container.sealNumber || '-'}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent >

                {/* Location Tab */}
                < TabsContent value="location" >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Yard Location
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isEditing && editData.status === "in-yard" ? (
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-muted-foreground">Yard Block</Label>
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
                                                <SelectValue placeholder="Select a yard block" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {yardBlocks.map((block) => (
                                                    <SelectItem key={block.id} value={block.name}>
                                                        {block.name} ({block.occupied}/{block.capacity})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            ) : container.yardLocation ? (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-muted rounded-lg text-center">
                                        <p className="text-sm text-muted-foreground">Block</p>
                                        <p className="text-2xl font-bold">{container.yardLocation.block}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No yard location assigned</p>
                                    {editData.status === "in-yard" && (
                                        <p className="text-sm mt-2">Click "Edit Container" to assign a location</p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent >

                {/* Timeline Tab */}
                < TabsContent value="timeline" >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Movement Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {container.gateInTime && (
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Truck className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Gate In</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatDate(container.gateInTime.toString())}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {container.gateOutTime && (
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                                            <Truck className="h-5 w-5 text-accent-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Gate Out</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatDate(container.gateOutTime.toString())}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {!container.gateInTime && !container.gateOutTime && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>No movement events recorded</p>
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
                                        Damage Report
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-muted-foreground">Damage Details</Label>
                                            {isEditing ? (
                                                <Textarea
                                                    className="mt-1"
                                                    value={editData.damageDetails || ''}
                                                    onChange={(e) =>
                                                        setEditData({ ...editData, damageDetails: e.target.value })
                                                    }
                                                    placeholder="Describe the damage..."
                                                    rows={4}
                                                />
                                            ) : (
                                                <p className="font-medium mt-1">
                                                    {container.damageDetails || 'No details provided'}
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
