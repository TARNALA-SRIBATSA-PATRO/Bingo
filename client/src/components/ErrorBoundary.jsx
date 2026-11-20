import { Component } from 'react';
import { reportClientError } from '../utils/clientErrors';
import './ErrorBoundary.css';

// Catches a render crash anywhere below it and shows a way out instead of a
// blank page. A saved multiplayer session survives a reload, so "Reload" is
// safe to offer first.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    reportClientError('render', error, { component: (info && info.componentStack || '').split('\n').find(Boolean) || '' });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="error-boundary" role="alert">
        <div className="error-panel">
          <h2>Something went wrong</h2>
          <p>The page hit an error it could not recover from. Reloading usually fixes it, and a game in progress is kept.</p>
          <div className="error-actions">
            <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>Reload</button>
            <button className="btn btn-secondary" type="button" onClick={() => { window.location.href = '/'; }}>Back to home</button>
          </div>
        </div>
      </div>
    );
  }
}
