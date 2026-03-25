import { auth } from "@clerk/nextjs/server";
import { CreditCard } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUsage } from "@/lib/services/usage";
import { getUserById } from "@/lib/services/users";

export default async function BillingPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const [usage, user] = await Promise.all([
    getUsage(userId),
    getUserById(userId),
  ]);

  const plan = user?.subscriptionPlan || "free";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Manage your subscription and billing"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Current Plan</CardTitle>
            <Badge variant="outline" className="capitalize">{plan}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">AI Queries</span>
                <span>{usage.used} / {usage.limit} per month</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min((usage.used / usage.limit) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
          {plan === "free" && (
            <Button className="w-full">
              <CreditCard className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
