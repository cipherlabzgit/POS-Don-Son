import { redirect } from 'next/navigation';

/** Legacy URL; pending deliveries are approved from Operation → All Approvals. */
export default function DeliveryApprovalRedirectPage() {
  redirect('/operation/approvals');
}
