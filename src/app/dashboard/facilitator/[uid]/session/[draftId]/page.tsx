import { FacilitatorSession } from "@/components/dashboards/facilitator-session";

export default async function FacilitatorSessionWithDraftId({ params }: { params: Promise<{ uid: string; draftId: string }> }) {
  const resolvedParams = await params;
  return <FacilitatorSession draftId={resolvedParams.draftId} />;
}