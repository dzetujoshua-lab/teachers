import type { Metadata } from "next";
import { FacilitatorUidDashboard } from "@/components/dashboards/facilitator-uid";

export async function generateMetadata({ params }: { params: Promise<{ uid: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  return { title: `Facilitator Dashboard - ${resolvedParams.uid}` };
}

export default async function FacilitatorUidOverview({ params }: { params: Promise<{ uid: string }> }) {
  const resolvedParams = await params;
  return <FacilitatorUidDashboard uid={resolvedParams.uid} />;
}