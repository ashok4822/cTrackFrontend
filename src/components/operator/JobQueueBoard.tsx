import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";

interface Task {
    id: string;
    type: string;
    status: string;
    containerNumber: string;
    createdAt: string | Date;
}

interface JobQueueBoardProps {
    tasks: Task[];
}

export function JobQueueBoard({ tasks }: JobQueueBoardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">Priority Task Queue</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="space-y-2 pt-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                    {tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <ClipboardList className="mb-2 h-10 w-10 opacity-20" />
                            <p>No pending jobs in queue</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="group relative rounded-xl border bg-card p-4 transition-all hover:shadow-md border-l-4 border-l-primary"
                                >
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                                            {task.type}
                                        </span>
                                        <Badge variant="secondary" className="capitalize">
                                            {task.status}
                                        </Badge>
                                    </div>
                                    <h4 className="flex items-center gap-2 font-bold text-lg">
                                        {task.containerNumber}
                                    </h4>
                                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground font-medium">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(task.createdAt), "MMM d, HH:mm")}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            Main Terminal
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
