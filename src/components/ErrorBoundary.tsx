import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {}
  render() {
    return this.state.failed ? (
      <main className="narrow page">
        <h1>Something went wrong</h1>
        <p>Your saved history is still on this device. Reload to reopen it.</p>
        <button className="button primary" onClick={() => location.reload()}>
          Reload app
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
