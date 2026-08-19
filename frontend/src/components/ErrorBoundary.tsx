import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
    const msg = error?.message || '';
    const name = error?.name || '';
    if (
      msg.includes('removeChild') ||
      msg.includes('insertBefore') ||
      name === 'NotFoundError'
    ) {
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-md w-full p-8 shadow-[0_0_50px_rgba(245,158,11,0.15)] space-y-5 relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">Görünüm Yüklenirken Bir Aksamat Oluştu</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Şantiye verileri işlenirken bir beklenmedik hata algılandı. Yeniden deneyerek işleme devam edebilirsiniz.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-red-400 font-mono overflow-x-auto text-left max-h-24">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                Tekrar Dene ve Devam Et
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
