'use client';

import React from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';
import { LoaderIcon, AlertTriangleIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Snippet } from '@/lib/db/schema'; // Import Snippet type

// Remove locally defined Snippet interface
/*
interface Snippet {
  id: string;
  title: string;
  text: string;
  createdAt: Date; // Or string, depending on API response
}
*/

export default function SnippetsPage() {
  // Use imported Snippet type in useSWR
  const { data: snippets, error, isLoading } = useSWR<Snippet[]>(
    '/api/snippets', // Assuming this is the endpoint for snippets
    fetcher
  );

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-semibold mb-6">Manage Snippets</h1>

      {/* TODO: Add 'Create New Snippet' button here */}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <LoaderIcon className="mr-2 size-5 animate-spin" />
          Loading snippets...
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Error Loading Snippets</AlertTitle>
          <AlertDescription>
            Could not fetch snippets. Please try again later.
            {/* Optionally show error details: {error.message} */}
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && (!snippets || snippets.length === 0) && (
        <div className="p-6 border rounded bg-muted text-center text-muted-foreground">
          <p>You haven't created any snippets yet.</p>
          {/* TODO: Link to 'Create New Snippet' form/modal */}
        </div>
      )}

      {!isLoading && !error && snippets && snippets.length > 0 && (
        <div className="space-y-4">
          {snippets.map((snippet) => (
            <div key={snippet.messageId} className="p-4 border rounded-md bg-card">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium">{snippet.title}</h3>
                {/* TODO: Add Edit/Delete buttons here */}
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                {snippet.text}
              </p>
              {/* Optionally display creation date */}
              {/* <p className="text-xs text-muted-foreground mt-2">
                Created: {new Date(snippet.createdAt).toLocaleDateString()}
              </p> */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 