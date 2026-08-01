import { redirect } from 'next/navigation'

export function generateStaticParams() {
  return [{ token: 'demo' }]
}

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params
  const token = resolvedParams?.token || 'demo'
  redirect(`/register?token=${encodeURIComponent(token)}`)
}
