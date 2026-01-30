import { Mail, Pen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SubmissionType } from '@/types/signature';

interface SubmissionOptionsProps {
  submissionType: SubmissionType;
  recipientEmail: string;
  onSubmissionTypeChange: (type: SubmissionType) => void;
  onRecipientEmailChange: (email: string) => void;
}

// Options for how to submit/sign the document
export function SubmissionOptions({
  submissionType,
  recipientEmail,
  onSubmissionTypeChange,
  onRecipientEmailChange,
}: SubmissionOptionsProps) {
  return (
    <div className="w-full max-w-lg mx-auto space-y-4 animate-fade-in">
      {/* Sign Now option */}
      <div
        onClick={() => onSubmissionTypeChange('sign-now')}
        className={cn("option-card", submissionType === 'sign-now' && "selected")}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
            submissionType === 'sign-now' ? "bg-primary/10" : "bg-muted"
          )}>
            <Pen className={cn(
              "w-6 h-6 transition-colors",
              submissionType === 'sign-now' ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Sign Now</h3>
            <p className="text-sm text-muted-foreground">Continue in browser</p>
          </div>
        </div>
      </div>

      {/* Send via Email option */}
      <div
        className={cn("option-card", submissionType === 'send-email' && "selected")}
      >
        <div
          onClick={() => onSubmissionTypeChange('send-email')}
          className="flex items-center gap-4 cursor-pointer"
        >
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
            submissionType === 'send-email' ? "bg-primary/10" : "bg-muted"
          )}>
            <Mail className={cn(
              "w-6 h-6 transition-colors",
              submissionType === 'send-email' ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Send via Email</h3>
            <p className="text-sm text-muted-foreground">Send signing link to recipient</p>
          </div>
        </div>

        {submissionType === 'send-email' && (
          <div className="mt-4 pt-4 border-t border-border animate-fade-in">
            <Input
              type="email"
              placeholder="email@example.com"
              value={recipientEmail}
              onChange={(e) => onRecipientEmailChange(e.target.value)}
              className="mb-3"
            />
            <Button className="w-full" disabled={!recipientEmail.includes('@')}>
              Send Link
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
