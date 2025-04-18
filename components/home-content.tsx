'use client';

import { Button } from '@/components/ui/button';
import { SearchIcon, UsersIcon, TerminalIcon, ShoppingCartIcon } from 'lucide-react'; // Example icons

export function HomeContent() {
  const buttons = [
    { label: 'Search', icon: SearchIcon },
    { label: 'Social', icon: UsersIcon },
    { label: 'Programmatic', icon: TerminalIcon },
    { label: 'Commerce', icon: ShoppingCartIcon },
  ];

  return (
    <div className="p-4 flex flex-col gap-2">
      {buttons.map((button) => (
        <Button
          key={button.label}
          variant="ghost"
          className="w-full justify-start gap-2"
          // Add onClick handler as needed
          // onClick={() => console.log(`${button.label} clicked`)}
        >
          <button.icon className="size-4" />
          {button.label}
        </Button>
      ))}
    </div>
  );
} 
 