import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard";

export async function requireDashboardData() {
  try {
    return await getDashboardData();
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      redirect("/login");
    }

    throw error;
  }
}
