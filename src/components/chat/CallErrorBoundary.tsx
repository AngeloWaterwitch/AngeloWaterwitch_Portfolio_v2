'use client';

import { Component, type ReactNode } from 'react';

/**
 * Keeps a failure inside the chat/call code from taking the whole dashboard down.
 * If it catches an error it quietly stops the ringtone, shows a small notice, and offers a retry.
 */
export default class CallErrorBoundary extends Component<{ children: ReactNode; label?: string }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[calls] the call/chat panel crashed:', error);
    // Make sure nothing keeps ringing or flashing the tab title after a crash.
    import('./ringtone').then((m) => m.stopRinging()).catch(() => {});
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" style={{ padding: '0.9rem 1rem', background: '#2a1015', border: '1px solid #7a1020', color: '#ffb3c0', fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', lineHeight: 1.6 }}>
        {this.props.label ?? 'Chat and calls'} hit a problem.{' '}
        <button type="button" onClick={() => this.setState({ failed: false })} style={{ background: 'transparent', border: '1px solid #ffb3c0', color: '#ffb3c0', padding: '0.2rem 0.7rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
          Try again
        </button>
      </div>
    );
  }
}
