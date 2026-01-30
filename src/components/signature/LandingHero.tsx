import { FileSignature } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LandingHeroProps {
  onGetStarted: () => void;
}

// Landing page hero section
export function LandingHero({ onGetStarted }: LandingHeroProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl p-10 shadow-soft border border-border text-center card-hover animate-fade-in">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-secondary mx-auto mb-8 flex items-center justify-center">
            <FileSignature className="w-10 h-10 text-primary" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Document Signature
          </h1>

          {/* Description */}
          <p className="text-muted-foreground mb-8">
            Upload your PDF, place signature fields, and send it for signing.
          </p>

          {/* CTA */}
          <Button
            size="lg"
            onClick={onGetStarted}
            className="px-10 py-6 text-lg font-semibold rounded-xl shadow-glow hover:shadow-xl transition-all duration-300"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}
