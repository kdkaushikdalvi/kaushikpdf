import React from 'react';
import { Pen, Mail } from 'lucide-react';

/**
 * Submission type selection (Sign Now or Send to Recipient)
 */
export function SubmissionOptions({
  submissionType,
  onTypeChange,
  recipientEmail,
  onEmailChange,
}) {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <h3 className="text-lg font-semibold text-center">How would you like to proceed?</h3>

      {/* Sign Now Option */}
      <label
        className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
          submissionType === 'sign-now'
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <input
          type="radio"
          name="submissionType"
          value="sign-now"
          checked={submissionType === 'sign-now'}
          onChange={() => onTypeChange('sign-now')}
          className="mt-1"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Pen className="w-5 h-5 text-blue-600" />
            <span className="font-medium">Sign Now</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Sign the document yourself and download immediately
          </p>
        </div>
      </label>

      {/* Send to Recipient Option */}
      <label
        className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
          submissionType === 'send-email'
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <input
          type="radio"
          name="submissionType"
          value="send-email"
          checked={submissionType === 'send-email'}
          onChange={() => onTypeChange('send-email')}
          className="mt-1"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <span className="font-medium">Send to Recipient</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Email the document for someone else to sign
          </p>
        </div>
      </label>

      {/* Email input for send option */}
      {submissionType === 'send-email' && (
        <div className="pl-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Email
          </label>
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="email@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
}
