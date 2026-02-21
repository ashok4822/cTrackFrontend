import { cn } from '@/lib/utils';
import type { ContainerStatus } from '@/types';

interface StatusBadgeProps {
    status: ContainerStatus | string;
    className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
    'in-yard': { label: 'In Yard', className: 'bg-success/10 text-success border-success/20' },
    'in-transit': { label: 'In Transit', className: 'bg-primary/10 text-primary border-primary/20' },
    'at-port': { label: 'At Port', className: 'bg-warning/10 text-warning border-warning/20' },
    'at-factory': { label: 'At Factory', className: 'bg-purple-100 text-purple-700 border-purple-200' },
    'damaged': { label: 'Damaged', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    'pending': { label: 'Pending', className: 'bg-muted text-muted-foreground border-border' },
    'gate-in': { label: 'Gate In', className: 'bg-info/10 text-info border-info/20' },
    'gate-out': { label: 'Gate Out', className: 'bg-accent/10 text-accent border-accent/20' },
    'approved': { label: 'Approved', className: 'bg-success/10 text-success border-success/20' },
    'rejected': { label: 'Rejected', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    'completed': { label: 'Completed', className: 'bg-success/10 text-success border-success/20' },
    'in-progress': { label: 'In Progress', className: 'bg-primary/10 text-primary border-primary/20' },
    'operational': { label: 'Operational', className: 'bg-success/10 text-success border-success/20' },
    'maintenance': { label: 'Maintenance', className: 'bg-warning/10 text-warning border-warning/20' },
    'down': { label: 'Down', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    'idle': { label: 'Idle', className: 'bg-muted text-muted-foreground border-border' },
    'active': { label: 'Active', className: 'bg-success/10 text-success border-success/20' },
    'inactive': { label: 'Inactive', className: 'bg-muted text-muted-foreground border-border' },
    'paid': { label: 'Paid', className: 'bg-success/10 text-success border-success/20' },
    'overdue': { label: 'Overdue', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    'urgent': { label: 'Urgent', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    'normal': { label: 'Normal', className: 'bg-muted text-muted-foreground border-border' },
    'nominated': { label: 'Nominated', className: 'bg-primary/10 text-primary border-primary/20' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground border-border' };

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                config.className,
                className
            )}
        >
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
            {config.label}
        </span>
    );
}
