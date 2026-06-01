"use server";

import { revalidatePath } from "next/cache";

import { resetDashboardData } from "@/lib/reset-dashboard";

export async function resetDashboardAction() {
  const result = await resetDashboardData();
  revalidatePath("/dashboard");
  return result;
}
