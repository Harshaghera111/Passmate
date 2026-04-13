import React from 'react';
import { Check, Circle } from 'lucide-react';

interface Step { label: string; sublabel?: string; }

interface StepperProgressProps {
  steps: Step[];
  current: number;
  variant?: 'horizontal' | 'vertical';
  timestamps?: (string | null)[];
}

const StepperProgress: React.FC<StepperProgressProps> = ({ steps, current, variant = 'horizontal', timestamps }) => {
  if (variant === 'horizontal') {
    return (
      <div className="flex items-center w-full">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                  done ? 'bg-accent-secondary text-white' : active ? 'bg-accent-primary text-white ring-4 ring-blue-100' : 'bg-bg-muted text-text-muted border border-border',
                ].join(' ')}>
                  {done ? <Check size={14} strokeWidth={3} /> : <span>{i + 1}</span>}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${active ? 'text-accent-primary' : done ? 'text-accent-secondary' : 'text-text-muted'}`}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-500 ${i < current ? 'bg-accent-secondary' : 'bg-border'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // Vertical timeline
  return (
    <div className="flex flex-col gap-0">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const pending = i > current;
        return (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={[
                'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 border-2',
                done ? 'bg-accent-secondary border-accent-secondary text-white' :
                active ? 'bg-white border-accent-primary text-accent-primary ring-4 ring-blue-100' :
                'bg-white border-border text-text-muted',
              ].join(' ')}>
                {done ? <Check size={16} strokeWidth={3} /> : active ? <Circle size={10} fill="currentColor" /> : <Circle size={10} />}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-0.5 flex-1 min-h-[32px] my-1 rounded-full ${done ? 'bg-accent-secondary' : 'bg-border'}`} />
              )}
            </div>
            <div className="pb-6 pt-1.5 flex-1 min-w-0">
              <p className={`text-sm font-semibold ${done ? 'text-accent-secondary' : active ? 'text-text-primary' : 'text-text-muted'}`}>
                {step.label}
                {active && <span className="ml-2 inline-block w-2 h-2 bg-accent-primary rounded-full animate-pulse" />}
              </p>
              {step.sublabel && (
                <p className="text-xs text-text-muted mt-0.5">{step.sublabel}</p>
              )}
              {timestamps?.[i] && (
                <p className="text-xs text-text-muted mt-1 font-mono">{timestamps[i]}</p>
              )}
              {pending && !timestamps?.[i] && (
                <p className="text-xs text-text-muted mt-1">Pending...</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StepperProgress;
