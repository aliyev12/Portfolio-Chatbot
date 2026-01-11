import { useState, useEffect } from 'react';

interface UseChatStatusReturn {
  isAvailable: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useChatStatus(apiUrl: string): UseChatStatusReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        const response = await fetch(`${apiUrl}/api/status`);
        if (!response.ok) {
          throw new Error('Failed to check chatbot status');
        }
        const data = await response.json();
        setIsAvailable(data.available);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsAvailable(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkStatus();
  }, [apiUrl]);

  return { isAvailable, isLoading, error };
}
