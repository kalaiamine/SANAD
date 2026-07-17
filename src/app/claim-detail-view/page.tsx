import { redirect } from 'next/navigation';

export default function ClaimDetailRedirect() {
    redirect('/dashboard');
}