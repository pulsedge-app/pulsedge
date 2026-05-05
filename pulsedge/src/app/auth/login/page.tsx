export const dynamic = 'force-dynamic';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata = { title: 'Sign In — Pulsedge' };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
