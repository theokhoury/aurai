'use client';

import { Asset86Icon } from './icons';
import { Button } from './ui/button';
import { generateRandomQuote } from '@/lib/ai/actions/generate-quote'; // Import server action
import { useState, useEffect } from 'react'; // Import hooks
import { LoaderIcon } from 'lucide-react'; // Import loader icon

export function Greeting() {
  const [quote, setQuote] = useState<string | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);

  useEffect(() => {
    let isMounted = true; // Prevent state update on unmounted component
    setIsLoadingQuote(true);
    generateRandomQuote()
      .then(generatedQuote => {
        if (isMounted) {
          setQuote(generatedQuote);
        }
      })
      .catch(error => {
        console.error("Failed to fetch quote:", error);
        if (isMounted) {
            // Set a default fallback quote if fetch fails
            setQuote("Let's start a new conversation."); 
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingQuote(false);
        }
      });

    return () => { isMounted = false }; // Cleanup function
  }, []); // Empty dependency array ensures it runs only once on mount

  return (
    <div className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center">
      <div className="mx-auto size-12 mb-4 rounded-full flex items-center justify-center ring-1 shrink-0 ring-border bg-background">
        <Asset86Icon size={24} />
      </div>

      {isLoadingQuote ? (
        <div className="text-center text-lg font-semibold text-muted-foreground flex items-center justify-center">
            <LoaderIcon className="mr-2 size-4 animate-spin" /> Loading quote...
        </div>
      ) : (
        <div className="text-center text-lg font-semibold whitespace-pre-wrap">
           {quote ? (
             <>
               {quote.split('\n')[0]} {/* Render the quote part */}
               {quote.includes('\n') && (
                 <>
                   <br /> {/* Explicit line break */}
                   <em className="text-muted-foreground font-normal">{quote.split('\n')[1]}</em> {/* Render signature italic */}                 
                 </>
               )}
             </>
           ) : (
             "How can I help you today?" /* Fallback text if quote is null/empty */
           )}
        </div>
      )}

      {/* Optional: keep the Send Tip button if desired */}
      {/* 
      <div className="mt-8 flex flex-col gap-2 items-center">
        <div className="text-xs text-zinc-500 flex items-center gap-1">
          Send a tip <PaperPlaneIcon className="text-zinc-400" />
        </div>

        <div className="flex flex-row gap-2 items-center">
          <Button variant="secondary" className="text-xs">
            /explain
          </Button>
          <Button variant="secondary" className="text-xs">
            /feedback
          </Button>
          <Button variant="secondary" className="text-xs">
            /help
          </Button>
        </div>
      </div> 
      */}
    </div>
  );
}
