export const dynamic = 'force-dynamic';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata = { title: 'Create Account — Pulsedge' };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
