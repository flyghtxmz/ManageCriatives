import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  className?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  className 
}: StatsCardProps) {
  return (
    <Card className={cn("stats-card", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon className="text-primary" size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
