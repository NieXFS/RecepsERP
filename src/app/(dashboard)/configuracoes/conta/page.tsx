import { AccountPinPanel } from "@/components/settings/account-pin-panel";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/session";

export default async function AccountSettingsPage() {
  const user = await getAuthUser();
  const account = await db.user.findFirst({
    where: {
      id: user.id,
      tenantId: user.tenantId,
      isActive: true,
      deletedAt: null,
    },
    select: {
      pinConfiguredAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <AccountPinPanel
        initialPinConfiguredAt={account?.pinConfiguredAt?.toISOString() ?? null}
      />
    </div>
  );
}
