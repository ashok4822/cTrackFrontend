import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import { fetchNotifications, markAsRead, markAllAsRead, removeNotification } from "@/store/slices/notificationSlice";
import type { Notification } from "@/types";
import {
    Bell,
    CheckCheck,
    Trash2,
    Clock,
    Info,
    AlertTriangle,
    CheckCircle2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { notificationService } from "@/services/notificationService";

const NotificationsPage = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { notifications, isLoading, unreadCount } = useSelector((state: RootState) => state.notifications);

    useEffect(() => {
        dispatch(fetchNotifications());
    }, [dispatch]);

    const handleMarkAsRead = (id: string) => {
        dispatch(markAsRead(id));
    };

    const handleMarkAllRead = () => {
        dispatch(markAllAsRead());
    };

    const handleDelete = async (id: string) => {
        try {
            await notificationService.deleteNotification(id);
            dispatch(removeNotification(id));
        } catch (error) {
            console.error("Failed to delete notification", error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read && notification.id) {
            handleMarkAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "success":
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case "alert":
                return <AlertTriangle className="h-5 w-5 text-destructive" />;
            case "warning":
                return <AlertTriangle className="h-5 w-5 text-warning" />;
            case "info":
            default:
                return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    if (isLoading && notifications.length === 0) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-muted-foreground font-medium">Loading notifications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                    {unreadCount > 0 && (
                        <Badge variant="secondary" className="px-2 py-0.5">
                            {unreadCount} Unread
                        </Badge>
                    )}
                </div>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Mark all as read
                        </Button>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {notifications.length > 0 ? (
                    notifications.map((notification) => (
                        <Card
                            key={notification.id}
                            className={cn(
                                "transition-all duration-200 hover:shadow-md",
                                !notification.read ? "border-l-4 border-l-primary bg-primary/5" : "bg-card"
                            )}
                        >
                            <CardContent className="flex items-start gap-4 p-4">
                                <div className="mt-1 shrink-0">
                                    {getNotificationIcon(notification.type)}
                                </div>

                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className={cn(
                                            "font-semibold",
                                            !notification.read ? "text-foreground" : "text-muted-foreground"
                                        )}>
                                            {notification.title}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {notification.timestamp ? formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true }) : "just now"}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-sm text-foreground/80 leading-relaxed">
                                        {notification.message}
                                    </p>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex gap-4">
                                            {notification.link && (
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="h-auto p-0 text-primary font-medium"
                                                    onClick={() => handleNotificationClick(notification)}
                                                >
                                                    View Details
                                                </Button>
                                            )}
                                            {!notification.read && (
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="h-auto p-0 text-muted-foreground hover:text-foreground"
                                                    onClick={() => notification.id && handleMarkAsRead(notification.id)}
                                                >
                                                    Mark as read
                                                </Button>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => notification.id && handleDelete(notification.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 bg-muted/20">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Bell className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground mb-1">Stay Tuned!</h2>
                        <p className="text-muted-foreground max-w-xs text-center">
                            You don't have any notifications at the moment. We'll let you know when something important happens.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
