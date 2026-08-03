'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { BookmarkCard } from '@/components/BookmarkCard';
import { AddBookmarkModal, AddContainerModal, EditBookmarkModal, AddBoardModal } from '@/components/Modals';
import { CanvasWorkspace } from '@/components/CanvasWorkspace';
import { TemplateGallery } from '@/components/TemplateGallery';
import { DocsWorkspace } from '@/components/DocsWorkspace';
import { supabase } from '@/lib/supabase';
import { Bookmark, Container, Notification, CanvasBoard, Note } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, Sparkles, Settings, LogOut, Bell, CheckCircle, Info, AlertTriangle, ArrowRight, LayoutGrid, List, X, Presentation, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [boards, setBoards] = useState<CanvasBoard[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
  const [viewType, setViewType] = useState<'bookmarks' | 'canvas' | 'docs'>('bookmarks');
  const router = useRouter();

  const [isAddBookmarkOpen, setIsAddBookmarkOpen] = useState(false);
  const [isEditBookmarkOpen, setIsEditBookmarkOpen] = useState(false);
  const [isAddContainerOpen, setIsAddContainerOpen] = useState(false);
  const [isAddBoardOpen, setIsAddBoardOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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
      const { data: containersData, error: containersError } = await supabase
        .from('containers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (containersError) {
        console.error('Error fetching containers:', containersError);
        toast.error('Failed to load spaces: ' + containersError.message);
      }

      const { data: bookmarksData, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (bookmarksError) {
        console.error('Error fetching bookmarks:', bookmarksError);
        toast.error('Failed to load bookmarks: ' + bookmarksError.message);
      } else {
        console.log('Fetched bookmarks:', bookmarksData?.length || 0);
      }

      const { data: boardsData, error: boardsError } = await supabase
        .from('canvas_boards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (boardsError) {
        console.error('Error fetching boards:', boardsError);
        toast.error('Failed to load visual boards: ' + boardsError.message);
      }

      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (notesError) {
        console.error('Error fetching notes:', notesError);
        toast.error('Failed to load docs: ' + notesError.message);
      }

      setContainers(containersData || []);
      setBookmarks(bookmarksData || []);
      setBoards(boardsData || []);
      setNotes(notesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBoard = async (name: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('canvas_boards')
        .insert([{ name, user_id: user.id }])
        .select();

      if (error) throw error;
      if (data) {
        setBoards([data[0], ...boards]);
        setSelectedBoardId(data[0].id);
        toast.success('Visual workspace initialized');
        addNotification('Workspace Created', `Successfully initialized visual board "${name}".`, 'success');
      }
    } catch (error) {
      console.error('Error adding board:', error);
      toast.error('Failed to initialize board');
    }
  };

  const handleDeleteBoard = async (id: string) => {
    try {
      const { error } = await supabase
        .from('canvas_boards')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBoards(boards.filter(b => b.id !== id));
      if (selectedBoardId === id) setSelectedBoardId(null);
      toast.success('Board permanently deleted');
      addNotification('Board Purged', 'Visual board and all its nodes have been removed.', 'warning');
    } catch (error) {
      console.error('Error deleting board:', error);
      toast.error('Failed to purge board');
    }
  };

  // Docs / Pages Handlers
  const seedDatabaseContent = () => ({
    kind: 'database',
    columns: [
      { id: 'c_name', name: 'Name', type: 'text' },
      { id: 'c_done', name: 'Done', type: 'checkbox' },
      { id: 'c_link', name: 'Link', type: 'url' },
      { id: 'c_phone', name: 'Number', type: 'text' },
      { id: 'c_status', name: 'Status', type: 'select', options: [
        { id: 's1', name: 'Not started', color: 'gray' },
        { id: 's2', name: 'In progress', color: 'blue' },
        { id: 's3', name: 'Done', color: 'green' },
      ] },
    ],
    rows: [
      { id: 'r1', cells: { c_name: '', c_done: false, c_link: '', c_phone: '', c_status: null } },
      { id: 'r2', cells: { c_name: '', c_done: false, c_link: '', c_phone: '', c_status: null } },
      { id: 'r3', cells: { c_name: '', c_done: false, c_link: '', c_phone: '', c_status: null } },
    ],
  });

  const handleAddNote = async (parentId: string | null = null, kind: 'page' | 'database' = 'page') => {
    if (!user) return;
    try {
      const isDb = kind === 'database';
      const { data, error } = await supabase
        .from('notes')
        .insert([{
          user_id: user.id,
          parent_id: parentId,
          title: isDb ? 'Untitled Database' : 'Untitled',
          icon: isDb ? '🗃️' : '📄',
          content: isDb ? seedDatabaseContent() : {},
        }])
        .select();

      if (error) throw error;
      if (data) {
        setNotes([data[0], ...notes]);
        setSelectedNoteId(data[0].id);
        toast.success(isDb ? 'Database created' : 'Page created');
        addNotification(isDb ? 'Database Created' : 'Page Created', `A new ${isDb ? 'database' : 'doc page'} has been added to your workspace.`, 'success');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to create page');
    }
  };

  const handleUpdateNote = async (id: string, updatedData: Partial<Note>) => {
    // Optimistic update
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updatedData } : n));
    try {
      const { error } = await supabase
        .from('notes')
        .update({ ...updatedData, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to save page');
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      // Cascade is handled by the DB (ON DELETE CASCADE), mirror it locally
      const toRemove = new Set<string>([id]);
      let grew = true;
      while (grew) {
        grew = false;
        for (const n of notes) {
          if (n.parent_id && toRemove.has(n.parent_id) && !toRemove.has(n.id)) {
            toRemove.add(n.id);
            grew = true;
          }
        }
      }
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
      setNotes(notes.filter(n => !toRemove.has(n.id)));
      if (selectedNoteId && toRemove.has(selectedNoteId)) setSelectedNoteId(null);
      toast.success('Page deleted');
      addNotification('Page Deleted', 'A doc page and its subpages were removed.', 'warning');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete page');
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
    if (viewType === 'canvas') {
      if (selectedBoardId === 'shared') return 'Shared Boards';
      if (selectedBoardId === 'trash') return 'Trash / Archive';
      if (selectedBoardId) return boards.find(b => b.id === selectedBoardId)?.name || 'Canvas Board';
      return 'Visual Workspaces';
    }

    if (viewType === 'docs') {
      if (selectedContainerId === 'notifications') return 'Notifications';
      if (selectedContainerId === 'settings') return 'System Settings';
      if (selectedNoteId === 'favorites') return 'Favorite Pages';
      if (selectedNoteId === 'recent') return 'Recently Edited';
      if (selectedNoteId) return notes.find(n => n.id === selectedNoteId)?.title || 'Untitled';
      return 'Knowledge Docs';
    }
    
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
        onSelectContainer={(id) => {
          setSelectedContainerId(id);
          setIsMobileSidebarOpen(false);
        }}
        onAddContainer={() => setIsAddContainerOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
        viewType={viewType}
        boards={boards}
        selectedBoardId={selectedBoardId}
        onSelectBoard={(id) => {
          setSelectedBoardId(id);
          setIsMobileSidebarOpen(false);
        }}
        onAddBoard={() => setIsAddBoardOpen(true)}
        notes={notes}
        selectedNoteId={selectedNoteId}
        onSelectNote={(id) => {
          setSelectedNoteId(id);
          setIsMobileSidebarOpen(false);
        }}
        onAddNote={(parentId) => handleAddNote(parentId ?? null)}
      />

      <main className={cn(
        "flex-1 flex flex-col min-w-0 relative z-10 transition-all duration-300 ease-in-out",
        "ml-0 lg:ml-24",
        !isSidebarCollapsed && "lg:ml-80"
      )}>
        <Header
          onAddBookmark={
            viewType === 'canvas'
              ? () => setIsAddBoardOpen(true)
              : viewType === 'docs'
                ? () => handleAddNote(null)
                : () => setIsAddBookmarkOpen(true)
          }
          onProfileClick={() => setSelectedContainerId('settings')}
          onNotificationsClick={() => setSelectedContainerId('notifications')}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          containerName={selectedContainerName}
          onMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          viewType={viewType}
          onViewTypeChange={(type) => {
            setViewType(type);
            // Reset selection so the destination view's navigation highlights correctly
            setSelectedContainerId(null);
            setSelectedBoardId(null);
            setSelectedNoteId(null);
          }}
        />

        <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-12 overflow-y-auto custom-scrollbar">
          {/* View Toggle & Content Header */}
          {selectedContainerId !== 'settings' && selectedContainerId !== 'notifications' && viewType !== 'canvas' && viewType !== 'docs' && (
            <div className="flex items-center justify-end mb-4 sm:mb-6 md:mb-8 gap-2">
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
            <div className="max-w-3xl mx-auto py-6 sm:py-8 md:py-12 lg:py-16 xl:py-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8 sm:mb-12 md:mb-16 gap-2"
              >
                <div className="flex items-center gap-3 sm:gap-4 md:gap-6 min-w-0 flex-1">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-indigo-500 rounded-xl sm:rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shadow-[0_10px_30px_rgba(99,102,241,0.3)] sm:shadow-[0_20px_50px_rgba(99,102,241,0.3)] shrink-0">
                    <Bell className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black font-space-grotesk tracking-tighter text-white truncate">Inbox</h2>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-[8px] sm:text-[9px] md:text-[10px] mt-1 sm:mt-2">Latest system updates & alerts</p>
                  </div>
                </div>
                <button
                  onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                  className="hidden sm:flex px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] md:text-xs font-black text-zinc-400 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all shrink-0"
                >
                  Mark all read
                </button>
              </motion.div>

              <div className="space-y-3 sm:space-y-4">
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
                        className="group p-4 sm:p-5 md:p-6 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl sm:rounded-[1.5rem] md:rounded-[2rem] backdrop-blur-3xl flex items-center gap-3 sm:gap-4 md:gap-6 cursor-pointer hover:bg-white/[0.07] transition-all relative pr-10 sm:pr-12"
                      >
                        <div className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0",
                          item.type === 'success' ? "bg-green-500/10 text-green-500" :
                            item.type === 'warning' ? "bg-yellow-500/10 text-yellow-500" :
                              item.type === 'alert' ? "bg-red-500/10 text-red-500" :
                                "bg-blue-500/10 text-blue-500"
                        )}>
                          {item.type === 'success' ? <CheckCircle className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6" /> :
                            item.type === 'warning' ? <AlertTriangle className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6" /> :
                              item.type === 'alert' ? <AlertTriangle className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6" /> :
                                <Info className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-1">
                            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-300 transition-colors truncate">{item.title}</h3>
                            <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-zinc-600 uppercase tracking-widest shrink-0">{item.time}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-medium line-clamp-2">{item.description}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveNotification(item.id); }}
                          className="absolute right-3 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-zinc-600 hover:text-white hover:bg-white/10 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 sm:py-16 md:py-20"
                    >
                      <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-zinc-600 mx-auto mb-3 sm:mb-4" />
                      <p className="text-sm sm:text-base text-zinc-500 font-medium">No new notifications</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : selectedContainerId === 'settings' ? (
            <div className="max-w-4xl mx-auto py-6 sm:py-8 md:py-12 lg:py-16 xl:py-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12 md:mb-16"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-orange-500 rounded-xl sm:rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shadow-[0_10px_30px_rgba(249,115,22,0.3)] sm:shadow-[0_20px_50px_rgba(249,115,22,0.3)]">
                  <Settings className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black font-space-grotesk tracking-tighter text-white truncate">System Settings</h2>
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-[8px] sm:text-[9px] md:text-[10px] mt-1 sm:mt-2">Manage your high-res intelligence workspace</p>
                </div>
              </motion.div>

              <div className="grid gap-3 sm:gap-4 md:gap-6 lg:gap-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-5 sm:p-6 md:p-8 lg:p-10 bg-white/5 border border-white/5 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] lg:rounded-[3rem] backdrop-blur-3xl"
                >
                  <div className="flex items-center justify-between mb-5 sm:mb-6 md:mb-8 gap-2">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-black font-space-grotesk text-white truncate">Profile Configuration</h3>
                    <div className="px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-[8px] sm:text-[9px] md:text-[10px] font-black text-orange-500 uppercase tracking-widest shrink-0">Active Node</div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 md:gap-8 p-4 sm:p-6 md:p-8 bg-black/40 rounded-xl sm:rounded-[1.5rem] md:rounded-[2rem] border border-white/5">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-full flex items-center justify-center text-2xl sm:text-2xl md:text-3xl font-black text-white shadow-2xl shrink-0">
                      {user.email?.[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <p className="text-xs sm:text-sm font-black text-zinc-500 uppercase tracking-widest mb-1">Identity</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 truncate">{user.email}</p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 md:gap-4">
                        <p className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-zinc-600 uppercase tracking-widest truncate">UID: {user.id.substring(0, 8)}...</p>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                        <p className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-green-500/80 uppercase tracking-widest shrink-0">Verified Session</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:gap-8"
                >
                  <div className="p-5 sm:p-6 md:p-8 bg-white/5 border border-white/5 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] backdrop-blur-3xl">
                    <h4 className="text-base sm:text-lg font-black font-space-grotesk text-white mb-3 sm:mb-4">Workspace Privacy</h4>
                    <p className="text-xs sm:text-sm text-zinc-500 mb-4 sm:mb-5 md:mb-6 leading-relaxed">Your data is encrypted end-to-end. Cognify AI processes metadata locally before sync.</p>
                    <button className="w-full py-3 sm:py-3.5 md:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:bg-white/10 transition-all">Export Local Log</button>
                  </div>
                  <div className="p-5 sm:p-6 md:p-8 bg-white/5 border border-white/5 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] backdrop-blur-3xl">
                    <h4 className="text-base sm:text-lg font-black font-space-grotesk text-white mb-3 sm:mb-4">Neural Preferences</h4>
                    <p className="text-xs sm:text-sm text-zinc-500 mb-4 sm:mb-5 md:mb-6 leading-relaxed">Adjust AI extraction intensity and metadata depth for your resources.</p>
                    <button className="w-full py-3 sm:py-3.5 md:py-4 bg-orange-500/10 border border-orange-500/20 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black text-orange-500 uppercase tracking-widest hover:bg-orange-500/20 transition-all">Configure AI</button>
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                  className="w-full p-5 sm:p-6 md:p-8 bg-red-500/5 border border-red-500/10 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] lg:rounded-[3rem] text-red-500/60 font-black text-base sm:text-lg md:text-xl hover:bg-red-500 hover:text-white transition-all group overflow-hidden relative"
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
          ) : viewType === 'canvas' ? (
            selectedBoardId ? (
              <CanvasWorkspace
                board={boards.find(b => b.id === selectedBoardId)!}
                onBackToBoards={() => setSelectedBoardId(null)}
                userId={user.id}
              />
            ) : (
              <div className="max-w-[2000px] mx-auto pb-32">
                {/* Visual Boards Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black font-space-grotesk tracking-tighter text-white">Visual Workspaces</h2>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] mt-1">Freeform infinite 2D canvas boards</p>
                  </div>
                  <button
                    onClick={() => setIsAddBoardOpen(true)}
                    className="px-6 py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_4px_15px_rgba(244,63,94,0.3)] shrink-0 cursor-pointer"
                  >
                    New Board
                  </button>
                </div>

                {boards.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                    {boards
                      .filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((board) => (
                        <div
                          key={board.id}
                          onClick={() => setSelectedBoardId(board.id)}
                          className="group relative p-6 bg-white/5 border border-white/5 hover:border-rose-500/30 rounded-3xl backdrop-blur-3xl cursor-pointer hover:bg-white/[0.08] transition-all flex flex-col min-h-[160px]"
                        >
                          <div className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Presentation className="w-5 h-5" />
                          </div>
                          <h3 className="text-base font-black text-white group-hover:text-rose-400 transition-colors line-clamp-1 mb-1">{board.name}</h3>
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-6">
                            Created {new Date(board.created_at).toLocaleDateString()}
                          </span>
                          
                          <div className="mt-auto flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase text-rose-500 tracking-wider flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                              Open Board <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to delete "${board.name}"?`)) {
                                  handleDeleteBoard(board.id);
                                }
                              }}
                              className="p-1.5 bg-white/5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Delete Board"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-16 border border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01] mb-12">
                    <Presentation className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">No boards found</h3>
                    <p className="text-xs text-zinc-600 font-medium max-w-xs mx-auto">Initialize a visual workspace above or use a creative template design below.</p>
                  </div>
                )}

                {/* Templates Section */}
                <div className="border-t border-white/5 pt-12">
                  <TemplateGallery
                    userId={user.id}
                    onBoardCreated={(boardId) => {
                      fetchData(user.id);
                      setSelectedBoardId(boardId);
                    }}
                  />
                </div>
              </div>
            )
          ) : viewType === 'docs' ? (
            <DocsWorkspace
              notes={notes}
              selectedNoteId={selectedNoteId}
              searchQuery={searchQuery}
              onSelectNote={setSelectedNoteId}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
            />
          ) : filteredBookmarks.length > 0 ? (
            <div className="max-w-[2000px] mx-auto pb-32">
              <AnimatePresence mode="popLayout">
                <motion.div
                  layout
                  className={cn(
                    viewMode === 'grid'
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6"
                      : "flex flex-col gap-3 sm:gap-4 max-w-4xl mx-auto"
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
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto px-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-zinc-100 dark:bg-zinc-900 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center mb-6 sm:mb-8 shadow-inner">
                <Sparkles className="w-10 h-10 text-zinc-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 font-space-grotesk">No inspiration yet</h2>
              <p className="text-sm sm:text-base text-zinc-500 mb-6 sm:mb-10 leading-relaxed">
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

      <AddBoardModal
        isOpen={isAddBoardOpen}
        onClose={() => setIsAddBoardOpen(false)}
        onAdd={handleAddBoard}
      />
    </div>
  );
}

