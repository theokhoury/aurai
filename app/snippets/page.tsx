'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useSearchParams } from 'next/navigation';
import { fetcher } from '@/lib/utils';
import { LoaderIcon, AlertTriangleIcon, XIcon, EditIcon, SaveIcon, XCircleIcon, PlusCircleIcon, Trash2Icon } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSnippetGroups } from '@/components/app-sidebar';
import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper function type
type MessagePart = { type: string; text?: string };

// Helper to extract text from parts
const getFirstTextPart = (parts: unknown): string | null => {
  if (!Array.isArray(parts)) return null;
  const textPart = parts.find((part: MessagePart) => part.type === 'text');
  return textPart?.text ?? null;
};

// Update type to include the snippet's unique ID
type PopulatedSnippet = Snippet & { 
    id: string; // Add the unique ID
    messageParts: unknown | null; // Message parts might be null for manual snippets
};

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

// Define available badge variants for cycling
const badgeVariants: BadgeProps['variant'][] = [
  'default', 
  'secondary', 
  'outline', 
  'destructive' // Add more custom variants if you have them
];

export default function SnippetsPage() {
  const searchParams = useSearchParams();
  const { 
    data: snippets, 
    error, 
    isLoading, 
    mutate 
  } = useSWR<PopulatedSnippet[]>('/api/snippets', fetcher);
  
  // Fetch snippet groups from context
  const { snippetGroups } = useSnippetGroups();

  const [selectedSnippet, setSelectedSnippet] = useState<PopulatedSnippet | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedTitle, setEditedTitle] = useState<string>('');
  const [editedContent, setEditedContent] = useState<string>('');
  const [selectedGroupIdFilter, setSelectedGroupIdFilter] = useState<string | null>(null); // State for filter
  const [isSaving, setIsSaving] = useState<boolean>(false); // State for save button loading
  const [isDeleting, setIsDeleting] = useState<boolean>(false); // State for delete button loading

  useEffect(() => {
    // Do not clear editing state if editing is active when selection changes
    // This allows creating a new snippet without losing edit mode
    if (!isEditing) {
        setIsEditing(false);
        setEditedTitle('');
        setEditedContent('');
    }
  }, [selectedSnippet, isEditing]); // Add isEditing dependency

  // Effect to handle selecting snippet from URL param
  useEffect(() => {
    const selectedId = searchParams.get('selected');
    if (selectedId && snippets && !selectedSnippet) { // Only run if selectedId exists, snippets loaded, and nothing is currently selected
      const snippetFromUrl = snippets.find(s => s.id === selectedId);
      if (snippetFromUrl) {
        setSelectedSnippet(snippetFromUrl);
        // Reset editing state if URL selection changes
        setIsEditing(false);
        setEditedTitle('');
        setEditedContent('');
        // Optional: scroll the snippet into view in the list? 
      }
    }
    // Clear selection if param removed? Add logic if needed.

  }, [searchParams, snippets, selectedSnippet]); // Depend on params and loaded snippets

  const handleSnippetSelect = (snippet: PopulatedSnippet) => {
    setSelectedSnippet(snippet);
    // Reset editing state when selecting an existing snippet
    setIsEditing(false); 
    setEditedTitle('');
    setEditedContent('');
  };

  const handleCloseViewer = () => {
    setSelectedSnippet(null);
    setIsEditing(false); // Also exit editing mode when closing viewer
    setEditedTitle('');
    setEditedContent('');
  };

  const handleEditClick = () => {
    if (!selectedSnippet) return;
    const currentText = getFirstTextPart(selectedSnippet.messageParts) ?? '';
    setEditedTitle(selectedSnippet.title);
    setEditedContent(currentText);
    setIsEditing(true);
  };

  // Function to handle creating a new snippet
  const handleCreateNewSnippet = () => {
    setSelectedSnippet(null); // Deselect any current snippet
    setEditedTitle('');       // Clear title
    setEditedContent('');      // Clear content
    setIsEditing(true);        // Enter editing mode
    // Consider focusing the title input here
    // document.getElementById('snippet-title-input')?.focus(); // Needs id on input
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setEditedTitle('');
    setEditedContent('');
    // If we were creating a new one, selectedSnippet is already null.
    // If we were editing an existing one, keep it selected.
  };

  const handleSaveClick = async () => {
    const isCreating = !selectedSnippet; // Check if we are creating or updating
    
    setIsSaving(true); // Start saving state

    let savePromise;
    let endpoint;
    let method;
    let body;

    if (isCreating) {
      // --- Creating a new manual snippet ---
      endpoint = '/api/snippets'; // Endpoint for creating manual snippets
      method = 'POST';
      body = JSON.stringify({ 
        // Only send title and text (and potentially groupId later)
        title: editedTitle || 'Untitled Snippet',
        text: editedContent 
        // groupId: selectedGroupIdFilter // Example if adding group selection during creation
      });
      savePromise = fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body });
    } else if (selectedSnippet) { // Ensure selectedSnippet exists for updating
      // --- Updating an existing snippet (manual or bookmarked) ---
      endpoint = '/api/snippet'; // Endpoint for updating any snippet
      method = 'PATCH';
      body = JSON.stringify({ 
        id: selectedSnippet.id, // Send the unique snippet ID
        title: editedTitle,
        text: editedContent 
      });
      savePromise = fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body });
    } else {
        // Should not happen, but handle gracefully
        console.error('Save clicked without a snippet selected and not in creation mode.');
        setIsSaving(false);
        toast.error('Cannot save. Invalid state.');
        return; 
    }

    toast.promise(savePromise, {
      loading: isCreating ? 'Creating snippet...' : 'Saving snippet...',
      success: async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to ${isCreating ? 'create' : 'save'} snippet`);
        }
        
        mutate(); // Revalidate the snippets list FIRST
        
        if (isCreating) {
          const newSnippet = await response.json(); // Assuming API returns the created snippet
          mutate(); // Revalidate the snippets list FIRST
          // Optionally, select the newly created snippet
          setSelectedSnippet(newSnippet); 
          setIsEditing(false); // Exit editing mode after successful creation
          setIsSaving(false); // End saving state after successful creation
          return 'Snippet created successfully!';
        } else {
          // Optimistically update the selected snippet for updates
          // Use functional update to ensure we have the latest state
          setSelectedSnippet(prev => 
            prev ? { 
              ...prev, 
              id: prev.id, // Ensure ID remains
              title: editedTitle,
              // Reconstruct messageParts carefully if needed, or rely on mutate()
              // For simplicity, let's assume mutate() handles refreshing content correctly
              // If manual snippets have null messageParts, update text directly
              text: editedContent, // Update text directly if messageParts is not the source
              messageParts: prev.messageParts ? [{ type: 'text', text: editedContent }] : null 
            } : null
          );
          mutate(); // Revalidate SWR cache to get definitive data
          setIsEditing(false); // Exit editing mode
          setIsSaving(false); // End saving state after successful update
          return 'Snippet saved successfully!';
        }
      },
      error: (err) => {
        console.error(err);
        setIsSaving(false); // End saving state on error
        return err.message || `Failed to ${isCreating ? 'create' : 'save'} snippet.`;
      },
    });
  };

  const handleDeleteClick = async () => {
    if (!selectedSnippet || isDeleting || isSaving) return; // Don't delete if nothing selected or already processing

    // Simple confirmation dialog
    if (!window.confirm(`Are you sure you want to delete the snippet "${selectedSnippet.title}"? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    const snippetId = selectedSnippet.id;

    const deletePromise = fetch(`/api/snippet?id=${snippetId}`, { 
      method: 'DELETE', 
    });

    toast.promise(deletePromise, {
      loading: 'Deleting snippet...',
      success: async (response) => {
        if (!response.ok) {
          let errorMsg = 'Failed to delete snippet.';
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
          } catch {}
          throw new Error(errorMsg);
        }
        mutate(); // Revalidate the snippets list
        setSelectedSnippet(null); // Deselect the snippet
        setIsEditing(false); // Ensure not in edit mode
        setIsDeleting(false); // End deleting state
        return 'Snippet deleted successfully!';
      },
      error: (err) => {
        console.error(err);
        setIsDeleting(false); // End deleting state on error
        return err.message || 'Failed to delete snippet.';
      },
    });
  };

  // Helper function to get a variant based on group index
  const getBadgeVariantForGroup = (groupId: string | null | undefined): BadgeProps['variant'] => {
    if (!groupId || !snippetGroups) return 'secondary'; // Default for unassigned
    const groupIndex = snippetGroups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return 'secondary'; // Default if group not found
    return badgeVariants[groupIndex % badgeVariants.length] ?? 'default';
  };

  console.log('Fetched snippets:', snippets);
  console.log('Snippet Groups from context:', snippetGroups); // For debugging

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
          <PanelGroup direction="horizontal" className="flex-1 overflow-hidden h-full">
            {/* Left Panel: Snippet List */}
            <Panel defaultSize={40} minSize={25}>
              <div className="p-4 h-full flex flex-col">
                {/* Header Row with Filter and Add Button */}
                <div className="flex justify-between items-center mb-3 flex-shrink-0">
                  <div className="flex items-center gap-2"> {/* Group title and button */}
                    <h2 className="text-lg font-semibold">Snippets</h2>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-muted-foreground hover:text-foreground" 
                      onClick={handleCreateNewSnippet}
                      title="Create new snippet"
                    >
                      <PlusCircleIcon className="size-4" />
                    </Button>
                  </div>
                  
                  {/* Filter Dropdown */}
                  <div className="w-[180px]"> {/* Constrain width */} 
                    <Select 
                      value={selectedGroupIdFilter ?? 'all'} 
                      onValueChange={(value) => setSelectedGroupIdFilter(value === 'all' ? null : value)}
                    >
                      <SelectTrigger className="h-8"> {/* Remove w-full, maybe adjust height */} 
                        <SelectValue placeholder="Filter by Group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Groups</SelectItem>
                        {snippetGroups?.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex-grow overflow-y-auto">
                  {isLoading && (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <LoaderIcon className="mr-2 size-4 animate-spin" />
                      Loading...
                    </div>
                  )}
                  {error && (
                    <Alert variant="destructive" className="m-4">
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
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Title</TableHead>
                          <TableHead className="w-[150px] text-right whitespace-nowrap text-center">Group</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {snippets
                          .filter(snippet => 
                            !selectedGroupIdFilter || snippet.groupId === selectedGroupIdFilter
                          )
                          .map((snippet) => {
                            const group = snippetGroups?.find(g => g.id === snippet.groupId);
                            const groupName = group?.name ?? 'Unassigned';
                            // Get the badge variant for this group
                            const badgeVariant = getBadgeVariantForGroup(snippet.groupId);

                            return (
                              <TableRow 
                                key={snippet.id}
                                onClick={() => handleSnippetSelect(snippet)}
                                className={cn(
                                  "cursor-pointer hover:bg-muted/50",
                                  selectedSnippet?.id === snippet.id && "bg-muted"
                                )}
                              >
                                <TableCell className="font-medium truncate">{snippet.title}</TableCell>
                                <TableCell className="text-right">
                                  <Badge 
                                    variant={badgeVariant} 
                                    className="text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-full block text-center"
                                    title={groupName} // Show full name on hover
                                  >
                                    {groupName}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </Panel>

            {/* Horizontal Resize Handle */}
            <PanelResizeHandle className="w-px h-full bg-border hover:bg-primary data-[resize-handle-state=drag]:bg-primary transition-colors" />

            {/* Right Panel: Snippet Viewer/Editor */}
            <Panel defaultSize={60} minSize={30}>
              <div className="h-full p-0 border rounded-md bg-background overflow-hidden relative">
                {selectedSnippet && (
                  <Button 
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full text-muted-foreground hover:text-foreground z-10 border"
                    onClick={handleCloseViewer}
                    aria-label="Close snippet viewer"
                    disabled={isSaving || isDeleting}
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
                            id="snippet-title-input"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="text-xl font-semibold h-auto px-2 py-1 border border-input rounded-md focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0"
                            placeholder="Snippet title..."
                            disabled={isSaving || isDeleting}
                          />
                        ) : (
                          <h3 className="text-xl font-semibold">{selectedSnippet.title}</h3>
                        )}
                        <div className="flex gap-1 pl-2">
                          {isEditing ? (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSaveClick} title="Save changes" disabled={isSaving || isDeleting}>
                                {isSaving ? <LoaderIcon className="size-4 animate-spin" /> : <SaveIcon className="size-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancelClick} title="Cancel editing" disabled={isSaving || isDeleting}>
                                <XCircleIcon className="size-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleEditClick} title="Edit snippet" disabled={isDeleting}>
                                <EditIcon className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80" onClick={handleDeleteClick} title="Delete snippet" disabled={isDeleting}>
                                {isDeleting ? <LoaderIcon className="size-4 animate-spin" /> : <Trash2Icon className="size-4" />}
                              </Button>
                            </>
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
                            disabled={isSaving || isDeleting}
                          />
                        ) : (
                          <Markdown>
                            {(selectedSnippet.messageParts 
                              ? getFirstTextPart(selectedSnippet.messageParts)
                              : selectedSnippet.text) 
                            ?? '(No text content found)'}
                          </Markdown>
                        )}
                      </div>
                    </div>
                  ) : isEditing ? (
                    <div className="p-4 md:p-6 space-y-4 relative">
                      <div className="flex justify-between items-center pr-10 mb-2">
                        <Input 
                          id="snippet-title-input"
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="text-xl font-semibold h-auto px-2 py-1 border border-input rounded-md focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0"
                          placeholder="Snippet title..."
                          disabled={isSaving}
                        />
                        <div className="flex gap-1 pl-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSaveClick} title="Save new snippet" disabled={isSaving}>
                            {isSaving ? <LoaderIcon className="size-4 animate-spin" /> : <SaveIcon className="size-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancelClick} title="Cancel creation" disabled={isSaving}>
                            <XCircleIcon className="size-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <Textarea 
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="min-h-[200px] w-full font-mono text-sm"
                          placeholder="Enter snippet content..."
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>Select a snippet from the list to view its content, or create a new one.</p>
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
 