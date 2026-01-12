## Packages
framer-motion | Smooth animations for chat bubbles and page transitions
react-markdown | Rendering AI responses with rich text
date-fns | Formatting timestamps (e.g., "Just now", "10:42 AM")
clsx | Utility for conditional classes (often used with tailwind-merge)
tailwind-merge | Merging tailwind classes effectively

## Notes
The app is a chat interface.
Chat API uses `POST /api/conversations/:id/messages` for SSE streaming.
We need to handle the streaming response manually in the frontend hook.
Icons provided by lucide-react.
Images for hotels/cities will use Unsplash placeholders if not provided by DB.
