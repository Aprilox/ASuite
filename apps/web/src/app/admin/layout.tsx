import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-auth';
import { AdminLayoutClient } from './layout-client';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminSession();

  // Vérifier si l'utilisateur a accès à l'administration
  if (!admin || !admin.permissions.includes('admin.dashboard')) {
    redirect('/login?error=unauthorized');
  }

  return (
    <AdminLayoutClient 
      permissions={admin.permissions}
      roles={admin.roles}
    >
      {children}
    </AdminLayoutClient>
  );
}

