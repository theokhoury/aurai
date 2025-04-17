import mitt from 'mitt';

// Define event types and their expected payloads
type Events = {
  setChatInput: string; // Event name and the type of data it carries (the text)
  displayBookmarkedMessage: { title: string; text: string }; // Update payload to include title and text
};

// Create and export the emitter instance
export const emitter = mitt<Events>(); 