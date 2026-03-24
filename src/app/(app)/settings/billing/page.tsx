import { CreditCard } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BillingPage() {
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
            <Badge variant="outline">Free</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">AI Queries</span>
              <span>0 / 50 per month</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Storage</span>
              <span>0 MB / 100 MB</span>
            </div>
          </div>
          <Button className="w-full">
            <CreditCard className="mr-2 h-4 w-4" />
            Upgrade to Pro
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
