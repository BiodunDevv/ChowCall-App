import { Suspense } from "react";
import { ResetPasswordPage } from "@/components/Auth";

export default function AuthResetPasswordPage() {
	return (
		<Suspense fallback={null}>
			<ResetPasswordPage />
		</Suspense>
	);
}
