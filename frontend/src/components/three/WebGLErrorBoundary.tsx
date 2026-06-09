'use client';
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State { hasError: boolean }

export class WebGLErrorBoundary extends Component<Props, State> {
  static displayName = 'WebGLErrorBoundary';

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.error('[WebGL Error Boundary]', error.message);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div
          role="img"
          aria-label="3D visualization unavailable"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            color: 'rgba(0,230,118,0.3)',
            fontSize: 32,
          }}
        >
          ◎
        </div>
      );
    }
    return this.props.children;
  }
}
