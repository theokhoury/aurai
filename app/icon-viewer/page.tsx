'use client';

import React, { useState } from 'react';
import * as Icons from '@/components/icons'; // Import all exports
import { Input } from '@/components/ui/input'; // Added Input import

export default function IconViewerPage() {
  const [filterText, setFilterText] = useState(''); // State for filter text
  const iconEntries = Object.entries(Icons);

  // Filter icons based on filterText (case-insensitive)
  const filteredIcons = iconEntries.filter(([name]) => 
    name.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Icon Viewer</h1>
      <p className="mb-4">Icons available in @/components/icons.tsx:</p>
      
      {/* Filter Input */}
      <div className="mb-6">
        <Input 
          type="text"
          placeholder="Filter icons by name..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
        {filteredIcons.map(([name, IconComponent]) => { // Use filteredIcons
          // Basic check if it's a likely React component (starts with uppercase)
          if (name[0] >= 'A' && name[0] <= 'Z' && typeof IconComponent === 'function') {
            return (
              <div key={name} className="flex flex-col items-center text-center p-2 border rounded">
                <IconComponent size={24} /> {/* Render icon */}
                <span className="text-xs mt-2 break-all">{name}</span> {/* Show name */}
              </div>
            );
          }
          return null; // Skip non-component exports
        })}
      </div>
    </div>
  );
} 
 
 