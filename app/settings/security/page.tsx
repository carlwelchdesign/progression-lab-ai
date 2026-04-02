import { permanentRedirect } from 'next/navigation';

export default function SecuritySettingsPage() {
  permanentRedirect('/account');
}
