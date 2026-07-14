'use client';

import { useParams } from 'next/navigation';
import ZplDesigner from '@/components/label-designer/ZplDesigner';

export default function EditLabelTemplatePage() {
  const params = useParams();
  return <ZplDesigner mode="edit" templateId={params.id as string} />;
}
