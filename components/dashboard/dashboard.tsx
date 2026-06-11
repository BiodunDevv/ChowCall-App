import { BillingHealth } from "@/components/dashboard/billing-health";
import { ChannelSalesChart } from "@/components/dashboard/channel-sales-chart";
import { DashboardActivity } from "@/components/dashboard/dashboard-activity";
import { DashboardInvoices } from "@/components/dashboard/dashboard-invoices";
import { NetRevenueChart } from "@/components/dashboard/net-revenue-chart";
import { DashboardStats } from "@/components/dashboard/stats";

type DashboardProps = {
	apiPath?: string;
	scope?: "tenant" | "platform";
};

export function Dashboard({
	apiPath = "/v1/analytics/dashboard",
	scope = "tenant",
}: DashboardProps) {
	return (
		<div className="w-full min-w-0 overflow-hidden rounded-xl border">
			<div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
				<DashboardStats apiPath={apiPath} scope={scope} />
				<NetRevenueChart apiPath={apiPath} />
				<ChannelSalesChart apiPath={apiPath} />
				<DashboardInvoices apiPath={apiPath} scope={scope} />
				{scope === "tenant" ? <BillingHealth /> : null}
				<DashboardActivity apiPath={apiPath} />
			</div>
		</div>
	);
}
