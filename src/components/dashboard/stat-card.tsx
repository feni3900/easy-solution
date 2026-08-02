import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  description?: string;
  variant?: "default" | "destructive";
}

export function StatCard({
  title,
  value,
  icon,
  description,
  variant = "default",
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-2 p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p
            className={cn(
              "text-xl font-semibold tracking-tight",
              variant === "destructive" && "text-destructive"
            )}
          >
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              variant === "destructive"
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary"
            )}
          >
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
