import { TicketDetailClient } from './ticket-detail-client';

export default async function AdminTicketDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  return <TicketDetailClient id={id} />;
}
