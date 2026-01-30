import React from 'react';
import { Check } from 'lucide-react';

/**
 * Step indicator for the signature wizard
 */
export function StepIndicator({ steps, currentStepIndex, onStepClick }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isClickable = index <= currentStepIndex;

        return (
          <React.Fragment key={step.key}>
            {/* Step circle */}
            <button
              onClick={() => isClickable && onStepClick(step.key)}
              disabled={!isClickable}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                isCompleted
                  ? 'bg-green-500 text-white'
                  : isCurrent
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              } ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}`}
            >
              {isCompleted ? (
                <Check className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </button>

            {/* Step label */}
            <span
              className={`text-sm font-medium ${
                isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-2 ${
                  index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
