export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Meta Ads Analytics Suite</h1>
        <p className="text-muted-foreground mb-8">
          AI-powered analytics for your Meta advertising campaigns
        </p>
        <div className="flex gap-4 justify-center">
          <a 
            href="/dashboard" 
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
