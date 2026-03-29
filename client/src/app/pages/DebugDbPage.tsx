import { useEffect, useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';

type DebugState = {
  data: unknown;
  error: string | null;
  loading: boolean;
};

export function DebugDbPage() {
  const [state, setState] = useState<DebugState>({
    data: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadVocabulary() {
      try {
        const response = await fetch('/api/debug-db');
        const payload = await response.json();

        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          setState({
            data: null,
            error: payload.error || 'Failed to fetch debug data.',
            loading: false,
          });
          return;
        }

        setState({
          data: payload,
          error: null,
          loading: false,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setState({
          data: null,
          error:
            error instanceof Error ? error.message : 'Unknown Supabase error.',
          loading: false,
        });
      }
    }

    void loadVocabulary();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AnimatedPage>
      <div className="max-w-5xl mx-auto p-6 lg:p-10 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Supabase Debug
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Trang này gọi <code>/api/debug-db</code> để đọc bảng{' '}
            <code>vocabulary</code> từ phía server.
          </p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {state.loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading vocabulary...
            </p>
          ) : null}

          {state.error ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                Query failed
              </p>
              <pre className="overflow-x-auto rounded-2xl bg-red-50 p-4 text-sm text-red-900 dark:bg-red-950/40 dark:text-red-100">
                {JSON.stringify({ error: state.error }, null, 2)}
              </pre>
            </div>
          ) : null}

          {!state.loading && !state.error ? (
            <pre className="overflow-x-auto rounded-2xl bg-gray-950 p-4 text-sm text-gray-100">
              {JSON.stringify(state.data, null, 2)}
            </pre>
          ) : null}
        </div>
      </div>
    </AnimatedPage>
  );
}
