'use client';

import React from 'react';
import * as Icons from '@/components/icons'; // Import all exports

export default function IconViewerPage() {
  const iconEntries = Object.entries(Icons);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Icon Viewer</h1>
      <p className="mb-4">Icons available in @/components/icons.tsx:</p>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
        {iconEntries.map(([name, IconComponent]) => {
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