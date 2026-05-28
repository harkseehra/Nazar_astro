'use client';
import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="fixed inset-0 flex items-center justify-center flex-col gap-3 text-center px-6"
          style={{ background: '#0A0E14' }}>
          <p className="text-white/40 text-sm">Something broke rendering the view.</p>
          <p className="text-white/20 text-xs font-mono">{this.state.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="mt-4 text-xs text-[#2196D4] hover:text-white transition-colors"
          >
            try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
