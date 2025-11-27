export default function MyAccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-8">
        {children}
      </main>
    </div>
  )
}
