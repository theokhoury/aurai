"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  SnippetGroupContext,
  SnippetGroupContextType,
  SnippetGroup,
  initialSnippetGroupsData // Import initial data
} from '@/components/app-sidebar'; // Adjust path if necessary

export function SnippetGroupProvider({ children }: { children: React.ReactNode }) {
  // State management logic moved here
  const [snippetGroups, setSnippetGroups] = useState<SnippetGroup[]>(initialSnippetGroupsData.snippetGroups);

  const handleRenameGroup = (id: string, newName: string) => {
    setSnippetGroups((currentGroups) =>
      currentGroups.map((g) =>
        g.id === id ? { ...g, name: newName } : g
      )
    );
    console.log(`Provider: TODO: API call to rename group ${id} to ${newName}`);
  };

  const contextValue = useMemo<SnippetGroupContextType>(() => ({
    snippetGroups,
    renameGroup: handleRenameGroup,
  }), [snippetGroups]);

  return (
    <SnippetGroupContext.Provider value={contextValue}>
      {children}
    </SnippetGroupContext.Provider>
  );
} 