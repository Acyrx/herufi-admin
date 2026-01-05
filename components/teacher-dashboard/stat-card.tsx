import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    description: string;
    variant?: "default" | "primary" | "secondary" | "accent";
    trend?: string;
}

export default function StatCard({
    title,
    value,
    icon,
    description,
    variant = "default",
    trend
}: StatCardProps) {
    const variantClasses = {
        default: "border-border bg-card",
        primary: "border-primary/20 bg-primary/5",
        secondary: "border-secondary/20 bg-secondary/5",
        accent: "border-accent/20 bg-accent/5"
    };

    const iconClasses = {
        default: "bg-muted text-foreground",
        primary: "bg-primary/20 text-primary",
        secondary: "bg-secondary/20 text-secondary",
        accent: "bg-accent/20 text-accent"
    };

    return (
        <Card className={cn("border-0 shadow-sm transition-all hover:shadow-md", variantClasses[variant])}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
                        <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                    <div className={cn("p-2 rounded-lg", iconClasses[variant])}>
                        {icon}
                    </div>
                </div>
                {trend && (
                    <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground">{trend}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}