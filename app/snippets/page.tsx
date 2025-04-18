'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';
import { LoaderIcon, AlertTriangleIcon, XIcon, EditIcon, SaveIcon, XCircleIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Snippet } from '@/lib/db/schema';
import { ChatHeader } from '@/components/chat-header';
import { cn } from '@/lib/utils';
import { Markdown } from '@/components/markdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  PanelGroup, 
  Panel, 
  PanelResizeHandle 
} from 'react-resizable-panels';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig
} from "@/components/ui/chart";

// Helper function type
type MessagePart = { type: string; text?: string };

// Helper to extract text from parts
const getFirstTextPart = (parts: unknown): string | null => {
  if (!Array.isArray(parts)) return null;
  const textPart = parts.find((part: MessagePart) => part.type === 'text');
  return textPart?.text ?? null;
};

type PopulatedSnippet = Snippet & { messageParts: unknown };

// Sample Data for the Chart
const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function SnippetsPage() {
  const { 
    data: snippets, 
    error, 
    isLoading, 
    mutate 
  } = useSWR<PopulatedSnippet[]>('/api/snippets', fetcher);

  const [selectedSnippet, setSelectedSnippet] = useState<PopulatedSnippet | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedTitle, setEditedTitle] = useState<string>('');
  const [editedContent, setEditedContent] = useState<string>('');

  useEffect(() => {
    setIsEditing(false);
    setEditedTitle('');
    setEditedContent('');
  }, [selectedSnippet]);

  const handleSnippetSelect = (snippet: PopulatedSnippet) => {
    setSelectedSnippet(snippet);
  };

  const handleCloseViewer = () => {
    setSelectedSnippet(null);
  };

  const handleEditClick = () => {
    if (!selectedSnippet) return;
    const currentText = getFirstTextPart(selectedSnippet.messageParts) ?? '';
    setEditedTitle(selectedSnippet.title);
    setEditedContent(currentText);
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setEditedTitle('');
    setEditedContent('');
  };

  const handleSaveClick = async () => {
    if (!selectedSnippet) return;
    
    // Use the correct identifiers from the selected snippet
    const { chatId, messageId } = selectedSnippet;
    
    // Show loading toast
    const savePromise = fetch('/api/snippet', { 
      method: 'PATCH', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        chatId, 
        messageId, 
        title: editedTitle,
        text: editedContent 
      }),
    });

    toast.promise(savePromise, {
      loading: 'Saving snippet...',
      success: async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to save snippet');
        }
        // Update local state optimistically & revalidate SWR cache
        mutate(); 
        setSelectedSnippet(prev => 
          prev ? { 
            ...prev, 
            title: editedTitle,
            messageParts: [{ type: 'text', text: editedContent }] 
          } : null
        );
        setIsEditing(false);
        return 'Snippet saved successfully!';
      },
      error: (err) => {
        console.error(err);
        return err.message || 'Failed to save snippet.'; // Show specific error message
      },
    });
  };

  console.log('Fetched snippets:', snippets);

  return (
    <div className="flex flex-col h-full">
      <ChatHeader />

      {/* Vertical Panel Group */}
      <PanelGroup direction="vertical" className="flex-1">

        {/* Top Panel: Chart */}
        <Panel defaultSize={35} minSize={20}>
          <div className="p-4 h-full flex flex-col">
            <h2 className="text-lg font-semibold mb-2">Activity</h2>
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    dataKey="desktop"
                    type="monotone"
                    stroke={chartConfig.desktop.color}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    dataKey="mobile"
                    type="monotone"
                    stroke={chartConfig.mobile.color}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </Panel>

        {/* Vertical Resize Handle */}
        <PanelResizeHandle className="h-px w-full bg-border hover:bg-primary data-[resize-handle-state=drag]:bg-primary transition-colors" />

        {/* Bottom Panel: Existing Horizontal Panels */}
        <Panel minSize={30}>
          {/* Main content area with resizable panels */}
          <PanelGroup direction="horizontal" className="flex-1 overflow-hidden h-full">
            {/* Left Panel: Snippet List */}
            <Panel defaultSize={33} minSize={20}>
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  <h2 className="text-lg font-semibold mb-3">Snippets</h2>
                  {/* TODO: Add 'Create New Snippet' button here? */}
                  {isLoading && (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <LoaderIcon className="mr-2 size-4 animate-spin" />
                      Loading...
                    </div>
                  )}
                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangleIcon className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>Could not load snippets.</AlertDescription>
                    </Alert>
                  )}
                  {!isLoading && !error && (!snippets || snippets.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No snippets yet.
                    </p>
                  )}
                  {!isLoading && !error && snippets && snippets.length > 0 && (
                    <ul className="space-y-1">
                      {snippets.map((snippet) => (
                        <li key={snippet.messageId}>
                          <button
                            onClick={() => handleSnippetSelect(snippet)}
                            className={cn(
                              "w-full text-left p-2 rounded-md text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                              selectedSnippet?.messageId === snippet.messageId && "bg-muted font-medium"
                            )}
                          >
                            {snippet.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </ScrollArea>
            </Panel>

            {/* Resize Handle */}
            <PanelResizeHandle className="w-px bg-border hover:bg-primary data-[resize-handle-state=drag]:bg-primary transition-colors" />

            {/* Right Panel: Snippet Viewer/Editor */}
            <Panel minSize={30} className="p-2">
              <div className="h-full p-0 border rounded-md bg-background overflow-hidden relative">
                {selectedSnippet && (
                  <Button 
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full text-muted-foreground hover:text-foreground z-10 border"
                    onClick={handleCloseViewer}
                    aria-label="Close snippet viewer"
                  >
                    <XIcon className="size-4" />
                  </Button>
                )}
                <ScrollArea className="h-full">
                  {selectedSnippet ? (
                    <div className="p-4 md:p-6 space-y-4 relative">
                      <div className="flex justify-between items-center pr-10 mb-2">
                        {isEditing ? (
                          <Input 
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="text-xl font-semibold h-auto px-2 py-1 border border-input rounded-md focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0"
                            placeholder="Snippet title..."
                          />
                        ) : (
                          <h3 className="text-xl font-semibold">{selectedSnippet.title}</h3>
                        )}
                        <div className="flex gap-1 pl-2">
                          {isEditing ? (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSaveClick} title="Save changes">
                                <SaveIcon className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancelClick} title="Cancel editing">
                                <XCircleIcon className="size-4" />
                              </Button>
                            </>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleEditClick} title="Edit snippet">
                              <EditIcon className="size-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {isEditing ? (
                          <Textarea 
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="min-h-[200px] w-full font-mono text-sm"
                            placeholder="Enter snippet content..."
                          />
                        ) : (
                          <Markdown>
                            {getFirstTextPart(selectedSnippet.messageParts) ?? '(No text content found)'}
                          </Markdown>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>Select a snippet from the list to view its content.</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </Panel>
          </PanelGroup>
        </Panel>

      </PanelGroup>
    </div>
  );
} 