import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private isSupabaseConfigError = () => {
    const errorMessage = this.state.error?.message || '';
    return (
      errorMessage.includes('Invalid supabaseUrl') ||
      errorMessage.includes('supabase') ||
      errorMessage.includes('VITE_SUPABASE')
    );
  };

  public render() {
    if (this.state.hasError) {
      const isConfigError = this.isSupabaseConfigError();

      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {isConfigError ? '⚙️ Setup Required' : '❌ Something Went Wrong'}
                </h1>
                <p className="text-gray-600 mb-4">
                  {isConfigError
                    ? "Your Supabase project isn't configured yet. Let's fix that!"
                    : 'An unexpected error occurred. Please try refreshing the page.'}
                </p>
              </div>
            </div>

            {isConfigError && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-3">
                  🚀 Quick Setup (5 minutes)
                </h2>
                <ol className="space-y-3 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 font-bold">1.</span>
                    <div>
                      <span className="font-medium">Create Supabase Project:</span>
                      <br />
                      <a
                        href="https://supabase.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        Visit supabase.com <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 font-bold">2.</span>
                    <div>
                      <span className="font-medium">Get your credentials:</span>
                      <br />
                      Dashboard → Settings → API → Copy URL and Key
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 font-bold">3.</span>
                    <div>
                      <span className="font-medium">Update .env file:</span>
                      <br />
                      Replace placeholder values with your real credentials
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 font-bold">4.</span>
                    <div>
                      <span className="font-medium">Apply database migrations:</span>
                      <br />
                      Run SQL files in supabase/migrations/ folder
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 font-bold">5.</span>
                    <div>
                      <span className="font-medium">Restart dev server:</span>
                      <br />
                      Press Ctrl+C and run <code className="bg-blue-100 px-1 rounded">npm run dev</code>
                    </div>
                  </li>
                </ol>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-sm text-blue-700">
                    📖 <span className="font-medium">Need detailed instructions?</span>
                    <br />
                    Check <code className="bg-blue-100 px-1 rounded">SETUP_SUPABASE_PROJECT.md</code> in your project folder
                  </p>
                </div>
              </div>
            )}

            {!isConfigError && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Error Details:</h3>
                <pre className="text-xs text-gray-600 overflow-auto p-3 bg-white rounded border border-gray-200">
                  {this.state.error?.message || 'Unknown error'}
                </pre>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
              >
                <RefreshCw className="w-5 h-5" />
                Reload Page
              </button>
              {isConfigError && (
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-700 font-medium py-3 px-6 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-all"
                >
                  <ExternalLink className="w-5 h-5" />
                  Open Supabase
                </a>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                Check the browser console (F12) for more details
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
