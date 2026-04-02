import { permanentRedirect } from 'next/navigation';

export default function BillingSettingsPage() {
  permanentRedirect('/account');
}
