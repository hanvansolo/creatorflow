import { UserProfile } from "@clerk/nextjs";
import { PageHeader } from "@/components/shared/page-header";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
      />
      <UserProfile
        appearance={{
          elements: {
            rootBox: "w-full",
            cardBox: "shadow-none w-full",
            card: "shadow-none w-full border border-border rounded-lg",
          },
        }}
      />
    </div>
  );
}
