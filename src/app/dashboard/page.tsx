'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { BookmarkCard } from '@/components/BookmarkCard';
import { MasonryGrid } from '@/components/MasonryGrid';
import { MicroExpander } from '@/components/MicroExpander';
import { AddBookmarkModal, AddContainerModal } from '@/components/Modals';
import { supabase } from '@/lib/supabase';
import { Bookmark, Container } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  
  const [isAddBookmarkOpen, setIsAddBookmarkOpen] = useState(false);
  const [isAddContainerOpen, setIsAddContainerOpen] = useState(false);

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
      if (data) setContainers([data[0], ...containers]);
    } catch (error) {
      console.error('Error adding container:', error);
    }
  };

  const handleAddBookmark = async (bookmarkData: any) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .insert([{ 
          ...bookmarkData, 
          user_id: user.id,
          tags: bookmarkData.tags || []
        }])
        .select();
      
      if (error) throw error;
      if (data) setBookmarks([data[0], ...bookmarks]);
    } catch (error) {
      console.error('Error adding bookmark:', error);
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
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bookmark?')) return;
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setBookmarks(bookmarks.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting bookmark:', error);
    }
  };

  const filteredBookmarks = bookmarks.filter(b => {
    const matchesSearch = b.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         b.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         b.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedContainerId === 'favorites') return b.is_favorite && matchesSearch;
    if (selectedContainerId) return b.container_id === selectedContainerId && matchesSearch;
    return matchesSearch;
  });

  const selectedContainerName = selectedContainerId === 'favorites' 
    ? 'Favorites' 
    : containers.find(c => c.id === selectedContainerId)?.name || 'All Bookmarks';

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-transparent text-zinc-900 dark:text-zinc-100 font-sans">
      <Sidebar 
        containers={containers} 
        selectedContainerId={selectedContainerId}
        onSelectContainer={setSelectedContainerId}
        onAddContainer={() => setIsAddContainerOpen(true)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <Header 
          onAddBookmark={() => setIsAddBookmarkOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          containerName={selectedContainerName}
        />

        <div className="flex-1 p-8 lg:p-12">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-sm font-medium">Loading your Cognify hub...</p>
            </div>
          ) : filteredBookmarks.length > 0 ? (
            <div className="max-w-[2000px] mx-auto">
              <MasonryGrid>
                <AnimatePresence mode="popLayout">
                  {filteredBookmarks.map((bookmark, index) => (
                    <motion.div
                      key={bookmark.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <BookmarkCard 
                        bookmark={bookmark} 
                        onEdit={() => {}} 
                        onDelete={handleDeleteBookmark}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </MasonryGrid>
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

      <AddContainerModal 
        isOpen={isAddContainerOpen}
        onClose={() => setIsAddContainerOpen(false)}
        onAdd={handleAddContainer}
      />
    </div>
  );
}
