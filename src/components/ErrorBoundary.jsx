import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary capturó un error:', error, info);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-white p-6">
          <div className="w-full max-w-md rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
            <h1 className="text-lg font-bold text-red-700">Algo salió mal</h1>
            <p className="mt-2 break-words text-sm text-red-600">
              {this.state.error?.message || 'Ocurrió un error inesperado.'}
            </p>
            <button
              onClick={this.handleReload}
              className="mt-4 rounded-xl bg-gradient-to-br from-brand-800 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
            >
              Recargar la página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
