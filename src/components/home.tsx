'use client';

import Dial from '@/components/ui/dial';
import { deleteFromStorage, useLocalStorage } from '@rehooks/local-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

const LOCALSTORAGE_API_KEY = 'API_KEY';

interface ViamConfig {
  key: string;
  id: string;
}

export default function Home() {
  const [queryClient] = useState(() => new QueryClient());
  const [config, setConfig] = useLocalStorage<ViamConfig>(LOCALSTORAGE_API_KEY);

  const [apiKey, setApiKey] = useState<string>('');
  const [apiKeyId, setApiKeyId] = useState<string>('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setConfig({ key: apiKey, id: apiKeyId });
  };

  return (
    <main className='flex mx-auto items-stretch min-h-screen flex-col p-6 max-w-screen-sm w-full'>
      <header>
        <h1 className='text-5xl'>thermo</h1>
        <hr className='my-2' />
        <h2 className='text-xl text-gray-300'>wifi-controlled thermostat</h2>
        <h2 className='text-lg text-gray-400'>(built using Viam)</h2>
      </header>

      {/* Input for when the config doesn't exist */}
      {!config && (
        <form onSubmit={handleSubmit} className='py-12'>
          <div className='pb-4'>
            <input
              className='h-10 rounded-md border border-input bg-black px-3 py-2 text-sm'
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder='API Key'
              type='password'
              autoComplete='off'
            />
          </div>
          <div className='pb-4'>
            <input
              className='h-10 rounded-md border border-input bg-black px-3 py-2 text-sm'
              value={apiKeyId}
              onChange={(e) => setApiKeyId(e.target.value)}
              placeholder='API Key ID'
              type='password'
              autoComplete='off'
            />
          </div>
          <button type='submit' className='bg-black outline p-2 rounded-md'>
            Submit Config
          </button>
        </form>
      )}

      {/* Main page is shown when API key is present */}
      {config && (
        <>
          <div className='pt-4 flex items-center justify-center'>
            <div className='max-w-sm max-sm:max-w-xs w-full'>
              <QueryClientProvider client={queryClient}>
                <Dial apiKey={config.key} apiKeyId={config.id} />
              </QueryClientProvider>
            </div>
          </div>
          <div className='absolute bottom-4 right-4'>
            <button
              className='bg-black outline p-2 rounded-md'
              onClick={() => deleteFromStorage(LOCALSTORAGE_API_KEY)}>
              Reset API Key
            </button>
          </div>
        </>
      )}
    </main>
  );
}
