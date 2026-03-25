import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata = {
  title: 'Create Account — Footy Feed',
  description: 'Create your free Footy Feed account to access personalised features and preferences.',
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return <RegisterForm />;
}
