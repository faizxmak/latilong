import { Link, useLocation } from "wouter";
import { Plus, MessageSquare, Menu, X, Plane, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useConversations, useCreateConversation } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

export function Sidebar() {
  const [location] = useLocation();
  const { data: conversations, isLoading } = useConversations();
  const createConversation = useCreateConversation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Extract current ID
  const currentId = location.split("/").pop();

  const handleCreateNew = async () => {
    try {
      const newConv = await createConversation.mutateAsync("New Trip Plan");
      // Use window.location to force navigation if needed, or wouter navigate
      window.location.href = `/chat/${newConv.id}`;
      setIsOpen(false);
    } catch (e) {
      console.error("Failed to create chat", e);
    }
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-40 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2 font-display font-bold text-xl text-primary">
          <Plane className="h-6 w-6" />
          latiNlong
        </div>
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          {isOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-72 bg-white border-r transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "pt-16 md:pt-0" // Add padding for mobile header
        )}
      >
        <div className="p-4 border-b hidden md:flex items-center gap-2 font-display font-bold text-2xl text-primary h-16">
           <Plane className="h-7 w-7" />
           latiNlong
        </div>

        <div className="p-4">
          <Button 
            className="w-full justify-start gap-2 shadow-sm" 
            size="lg"
            onClick={handleCreateNew}
            disabled={createConversation.isPending}
          >
            <Plus className="h-5 w-5" />
            {createConversation.isPending ? "Creating..." : "New Trip"}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {isLoading ? (
            <div className="space-y-3 px-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : conversations?.length === 0 ? (
            <div className="text-center p-6 text-muted-foreground text-sm">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p>No chats yet.</p>
              <p>Start planning your next adventure!</p>
            </div>
          ) : (
            conversations?.map((conv) => (
              <Link key={conv.id} href={`/chat/${conv.id}`}>
                <div
                  className={cn(
                    "group flex flex-col p-3 rounded-xl transition-all hover:bg-muted cursor-pointer border border-transparent",
                    currentId === String(conv.id) 
                      ? "bg-secondary border-secondary-foreground/10 shadow-sm" 
                      : ""
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={cn(
                      "font-semibold text-sm truncate pr-2",
                      currentId === String(conv.id) ? "text-primary-foreground/90 text-primary-dark" : "text-foreground"
                    )}>
                      {conv.title}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground truncate">
                    {conv.createdAt ? formatDistanceToNow(new Date(conv.createdAt), { addSuffix: true }) : 'Just now'}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
              {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "ME"}
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-sm font-medium truncate">
                {user?.firstName || user?.email || "My Account"}
              </span>
              <span className="text-xs text-muted-foreground">Free Plan</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
