import { redirect } from 'next/navigation';

export default function SettingsPage() {
  redirect('/administrator/system-settings');
}
