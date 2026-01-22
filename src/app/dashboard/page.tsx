'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { BookmarkCard } from '@/components/BookmarkCard';
import { MasonryGrid } from '@/components/MasonryGrid';
import { MicroExpander } from '@/components/MicroExpander';
import { AddBookmarkModal, AddContainerModal, EditBookmarkModal } from '@/components/Modals';
import { supabase } from '@/lib/supabase';
import { Bookmark, Container, Notification } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, Sparkles, Settings, LogOut, Bell, CheckCircle, Info, AlertTriangle, ArrowRight, LayoutGrid, List, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
  const router = useRouter();

  const [isAddBookmarkOpen, setIsAddBookmarkOpen] = useState(false);
  const [isEditBookmarkOpen, setIsEditBookmarkOpen] = useState(false);
  const [isAddContainerOpen, setIsAddContainerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'Welcome to Cognify 2.0', description: 'System initialized. Experience the new God-level dashboard.', type: 'info', time: 'Just now', read: false }
  ]);

  /**
   * Centralized Notification Handler
   * Captures all system alerts (Success, Warning, Info) and pushes them to the Inbox.
   * used by: Container Creation, Bookmark Operations, System Events.
   */
  const addNotification = (title: string, description: string, type: 'info' | 'success' | 'warning' | 'alert' = 'info') => {
    const newNotification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      type,
      time: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const handleRemoveNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      fetchData(user.id);
    };
    checkAuth();
  }, [router]);

  const fetchData = async (userId: string) => {
    setLoading(true);
    try {
      const { data: containersData } = await supabase
        .from('containers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const { data: bookmarksData } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setContainers(containersData || []);
      setBookmarks(bookmarksData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContainer = async (name: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('containers')
        .insert([{ name, user_id: user.id }])
        .select();

      if (error) throw error;
      if (data) {
        setContainers([data[0], ...containers]);
        toast.success('New space initialized successfully');
        addNotification('Space Created', `Successfully initialized new space "${name}".`, 'success');
      }
    } catch (error) {
      console.error('Error adding container:', error);
      toast.error('Failed to initialize space');
    }
  };

  const handleAddBookmark = async (bookmarkData: any) => {
    if (!user) return;
    try {
      // Only include columns that exist in the database
      const cleanData = {
        user_id: user.id,
        url: bookmarkData.url,
        title: bookmarkData.title,
        description: bookmarkData.description,
        logo_url: bookmarkData.logo_url,
        preview_image_url: bookmarkData.preview_image_url,
        category: bookmarkData.category,
        tags: bookmarkData.tags || [],
        container_id: bookmarkData.container_id || null,
        metadata_json: bookmarkData.metadata_json,
        ai_summary: bookmarkData.ai_summary
      };

      const { data, error } = await supabase
        .from('bookmarks')
        .insert([cleanData])
        .select();

      if (error) throw error;
      if (data) {
        setBookmarks([data[0], ...bookmarks]);
        toast.success('Resource captured to hub');
        addNotification('Resource Captured', `Successfully added "${bookmarkData.title || bookmarkData.url}" to your hub.`, 'success');
      }
    } catch (error) {
      console.error('Error adding bookmark:', error);
      toast.error('Failed to capture resource');
    }
  };

  const handleUpdateBookmark = async (id: string, updatedData: any) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .update({
          title: updatedData.title,
          description: updatedData.description,
          category: updatedData.category,
          container_id: updatedData.container_id || null,
          tags: updatedData.tags
        })
        .eq('id', id);

      if (error) throw error;
      setBookmarks(bookmarks.map(b => b.id === id ? { ...b, ...updatedData } : b));
      toast.success('Resource intelligence updated');
    } catch (error) {
      console.error('Error updating bookmark:', error);
      toast.error('Failed to update resource');
    }
  };

  const handleToggleFavorite = async (bookmark: Bookmark) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .update({ is_favorite: !bookmark.is_favorite })
        .eq('id', bookmark.id);

      if (error) throw error;
      setBookmarks(bookmarks.map(b =>
        b.id === bookmark.id ? { ...b, is_favorite: !b.is_favorite } : b
      ));
      toast.success(bookmark.is_favorite ? 'Removed from curated' : 'Added to curated');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update curated status');
    }
  };

  const handleToggleShortcut = async (bookmark: Bookmark) => {
    try {
      const tags = bookmark.tags || [];
      const isShortcut = tags.includes('shortcut');
      const newTags = isShortcut
        ? tags.filter(t => t !== 'shortcut')
        : [...tags, 'shortcut'];

      const { error } = await supabase
        .from('bookmarks')
        .update({ tags: newTags })
        .eq('id', bookmark.id);

      if (error) throw error;
      setBookmarks(bookmarks.map(b =>
        b.id === bookmark.id ? { ...b, tags: newTags } : b
      ));
      toast.success(isShortcut ? 'Shortcut deactivated' : 'Shortcut activated');
    } catch (error) {
      console.error('Error toggling shortcut:', error);
      toast.error('Failed to update shortcut');
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBookmarks(bookmarks.filter(b => b.id !== id));
      toast.success('Resource purged from hub');
      addNotification('Resource Purged', 'Item has been permanently removed from your knowledge graph.', 'warning');
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      toast.error('Failed to purge resource');
    }
  };

  const isToday = (date: string) => {
    const today = new Date();
    const d = new Date(date);
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  const filteredBookmarks = bookmarks.filter(b => {
    const matchesSearch = b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedContainerId === 'favorites') return b.is_favorite;
    if (selectedContainerId === 'today') return isToday(b.created_at);
    if (selectedContainerId === 'shortcuts') return b.tags?.includes('shortcut');
    if (selectedContainerId === 'notifications') return false; // Notifications view handled separately
    if (selectedContainerId === 'settings') return false; // Settings view handled separately
    if (selectedContainerId) return b.container_id === selectedContainerId;
    return true;
  });

  const getSelectedName = () => {
    if (selectedContainerId === 'favorites') return 'Curated Collection';
    if (selectedContainerId === 'today') return 'Captured Today';
    if (selectedContainerId === 'shortcuts') return 'Active Shortcuts';
    if (selectedContainerId === 'notifications') return 'Notifications';
    if (selectedContainerId === 'settings') return 'System Settings';
    return containers.find(c => c.id === selectedContainerId)?.name || 'Global Discovery';
  };

  const selectedContainerName = getSelectedName();

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-black text-zinc-100 font-sans relative overflow-hidden">
      {/* God-level Dashboard Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-orange-500/5 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute -top-24 -left-24 w-[600px] h-[600px] bg-orange-600/5 blur-[120px] rounded-full" />
      </div>

      <Sidebar
        containers={containers}
        selectedContainerId={selectedContainerId}
        onSelectContainer={setSelectedContainerId}
        onAddContainer={() => setIsAddContainerOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main className={cn(
        "flex-1 flex flex-col min-w-0 relative z-10 transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "ml-24" : "ml-80"
      )}>
        <Header
          onAddBookmark={() => setIsAddBookmarkOpen(true)}
          onProfileClick={() => setSelectedContainerId('settings')}
          onNotificationsClick={() => setSelectedContainerId('notifications')}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          containerName={selectedContainerName}
        />

        <div className="flex-1 p-8 lg:p-12 overflow-y-auto custom-scrollbar">
          {/* View Toggle & Content Header */}
          {selectedContainerId !== 'settings' && selectedContainerId !== 'notifications' && (
            <div className="flex items-center justify-end mb-8 gap-2">
              <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    viewMode === 'grid' ? "bg-white/10 text-white shadow-lg" : "text-zinc-500 hover:text-white hover:bg-white/5"
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    viewMode === 'list' ? "bg-white/10 text-white shadow-lg" : "text-zinc-500 hover:text-white hover:bg-white/5"
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {selectedContainerId === 'notifications' ? (
            <div className="max-w-3xl mx-auto py-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-16"
              >
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-indigo-500 rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_rgba(99,102,241,0.3)]">
                    <Bell className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-5xl font-black font-space-grotesk tracking-tighter text-white">Inbox</h2>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-2">Latest system updates & alerts</p>
                  </div>
                </div>
                <button
                  onClick={() => setNotifications([])}
                  className="px-6 py-3 bg-white/5 border border-white/5 rounded-2xl text-xs font-black text-zinc-400 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                >
                  Mark all read
                </button>
              </motion.div>

              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {notifications.length > 0 ? (
                    notifications.map((item, i) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: i * 0.05 }}
                        className="group p-6 bg-white/5 border border-white/5 hover:border-white/10 rounded-[2rem] backdrop-blur-3xl flex items-center gap-6 cursor-pointer hover:bg-white/[0.07] transition-all relative pr-12"
                      >
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
                          item.type === 'success' ? "bg-green-500/10 text-green-500" :
                            item.type === 'warning' ? "bg-yellow-500/10 text-yellow-500" :
                              item.type === 'alert' ? "bg-red-500/10 text-red-500" :
                                "bg-blue-500/10 text-blue-500"
                        )}>
                          {item.type === 'success' ? <CheckCircle className="w-6 h-6" /> :
                            item.type === 'warning' ? <AlertTriangle className="w-6 h-6" /> :
                              item.type === 'alert' ? <AlertTriangle className="w-6 h-6" /> :
                                <Info className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">{item.title}</h3>
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{item.time}</span>
                          </div>
                          <p className="text-sm text-zinc-500 leading-relaxed font-medium">{item.description}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveNotification(item.id); }}
                          className="absolute right-6 top-1/2 -translate-y-1/2 p-2 rounded-xl text-zinc-600 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-20"
                    >
                      <Sparkles className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                      <p className="text-zinc-500 font-medium">No new notifications</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : selectedContainerId === 'settings' ? (
            <div className="max-w-4xl mx-auto py-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-6 mb-16"
              >
                <div className="w-20 h-20 bg-orange-500 rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_rgba(249,115,22,0.3)]">
                  <Settings className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-5xl font-black font-space-grotesk tracking-tighter text-white">System Settings</h2>
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-2">Manage your high-res intelligence workspace</p>
                </div>
              </motion.div>

              <div className="grid gap-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-10 bg-white/5 border border-white/5 rounded-[3rem] backdrop-blur-3xl"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black font-space-grotesk text-white">Profile Configuration</h3>
                    <div className="px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-[10px] font-black text-orange-500 uppercase tracking-widest">Active Node</div>
                  </div>

                  <div className="flex items-center gap-8 p-8 bg-black/40 rounded-[2rem] border border-white/5">
                    <div className="w-24 h-24 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-2xl">
                      {user.email?.[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-1">Identity</p>
                      <p className="text-2xl font-bold text-white mb-2">{user.email}</p>
                      <div className="flex items-center gap-4">
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">UID: {user.id.substring(0, 8)}...</p>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-[10px] font-bold text-green-500/80 uppercase tracking-widest">Verified Session</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-2 gap-8"
                >
                  <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] backdrop-blur-3xl">
                    <h4 className="text-lg font-black font-space-grotesk text-white mb-4">Workspace Privacy</h4>
                    <p className="text-sm text-zinc-500 mb-6 leading-relaxed">Your data is encrypted end-to-end. Cognify AI processes metadata locally before sync.</p>
                    <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:bg-white/10 transition-all">Export Local Log</button>
                  </div>
                  <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] backdrop-blur-3xl">
                    <h4 className="text-lg font-black font-space-grotesk text-white mb-4">Neural Preferences</h4>
                    <p className="text-sm text-zinc-500 mb-6 leading-relaxed">Adjust AI extraction intensity and metadata depth for your resources.</p>
                    <button className="w-full py-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-[10px] font-black text-orange-500 uppercase tracking-widest hover:bg-orange-500/20 transition-all">Configure AI</button>
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                  className="w-full p-8 bg-red-500/5 border border-red-500/10 rounded-[3rem] text-red-500/60 font-black text-xl hover:bg-red-500 hover:text-white transition-all group overflow-hidden relative"
                >
                  <span className="relative z-10">Terminate Current Session</span>
                  <div className="absolute inset-0 bg-red-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </motion.button>
              </div>
            </div>
          ) : loading ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-sm font-medium">Loading your Cognify hub...</p>
            </div>
          ) : filteredBookmarks.length > 0 ? (
            <div className="max-w-[2000px] mx-auto pb-32">
              <AnimatePresence mode="popLayout">
                <motion.div
                  layout
                  className={cn(
                    viewMode === 'grid'
                      ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
                      : "flex flex-col gap-4 max-w-4xl mx-auto"
                  )}
                >
                  {filteredBookmarks.map((bookmark, index) => (
                    <motion.div
                      layout
                      key={bookmark.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className={viewMode === 'grid' ? "h-full" : "w-full"}
                    >
                      <BookmarkCard
                        bookmark={bookmark}
                        viewMode={viewMode}
                        onEdit={(b) => {
                          setSelectedBookmark(b);
                          setIsEditBookmarkOpen(true);
                        }}
                        onDelete={handleDeleteBookmark}
                        onToggleFavorite={handleToggleFavorite}
                        onToggleShortcut={handleToggleShortcut}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner">
                <Sparkles className="w-10 h-10 text-zinc-400" />
              </div>
              <h2 className="text-2xl font-bold mb-3 font-space-grotesk">No inspiration yet</h2>
              <p className="text-zinc-500 mb-10 leading-relaxed">
                {searchQuery
                  ? "We couldn't find anything matching your search. Try a broader term."
                  : "Start building your God-level knowledge hub by adding your first resource."}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsAddBookmarkOpen(true)}
                  className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold hover:scale-105 transition-transform shadow-xl active:scale-95"
                >
                  Create Bookmark
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <MicroExpander
        onAddBookmark={() => setIsAddBookmarkOpen(true)}
        onAddContainer={() => setIsAddContainerOpen(true)}
        onSearch={() => {
          const input = document.querySelector('input[type="text"]') as HTMLInputElement;
          input?.focus();
        }}
        onToggleFavorites={() => setSelectedContainerId(selectedContainerId === 'favorites' ? null : 'favorites')}
      />

      <AddBookmarkModal
        isOpen={isAddBookmarkOpen}
        onClose={() => setIsAddBookmarkOpen(false)}
        onAdd={handleAddBookmark}
        containers={containers}
      />

      <EditBookmarkModal
        isOpen={isEditBookmarkOpen}
        onClose={() => setIsEditBookmarkOpen(false)}
        onUpdate={handleUpdateBookmark}
        bookmark={selectedBookmark}
        containers={containers}
      />

      <AddContainerModal
        isOpen={isAddContainerOpen}
        onClose={() => setIsAddContainerOpen(false)}
        onAdd={handleAddContainer}
      />
    </div>
  );
}

