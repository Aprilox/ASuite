import { RoleDetailClient } from './role-detail-client';

export default async function AdminRoleDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  return <RoleDetailClient id={id} />;
}
