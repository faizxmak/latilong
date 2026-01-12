import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center p-8 text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-4xl font-display font-bold text-foreground mb-4">Page not found</h1>
        <p className="text-muted-foreground mb-8">
          Did you take a wrong turn? The page you are looking for doesn't exist or has been moved.
        </p>
        <Link href="/" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
          Return Home
        </Link>
      </div>
    </div>
  );
}
