import { TenantDashboard } from "./_components/tenant-dashboard";

export default async function TenantDashboardPage({
	params,
}: {
	params: Promise<{ tenant: string }>;
}) {
	const { tenant } = await params;
	return <TenantDashboard tenant={tenant} />;
}
