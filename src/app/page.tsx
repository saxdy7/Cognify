'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { BookmarkCard } from '@/components/BookmarkCard';
import { AddBookmarkModal, AddContainerModal } from '@/components/Modals';
import { supabase } from '@/lib/supabase';
import { Bookmark, Container } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus } from 'lucide-react';

const DUMMY_USER_ID = '00000000-0000-0000-0000-000000000000';

export default function Dashboard() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAddBookmarkOpen, setIsAddBookmarkOpen] = useState(false);
  const [isAddContainerOpen, setIsAddContainerOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: containersData } = await supabase
        .from('containers')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { data: bookmarksData } = await supabase
        .from('bookmarks')
        .select('*')
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
    try {
      const { data, error } = await supabase
        .from('containers')
        .insert([{ name, user_id: DUMMY_USER_ID }])
        .select();
      
      if (error) throw error;
      if (data) setContainers([data[0], ...containers]);
    } catch (error) {
      console.error('Error adding container:', error);
    }
  };

  const handleAddBookmark = async (bookmarkData: any) => {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .insert([{ 
          ...bookmarkData, 
          user_id: DUMMY_USER_ID,
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

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans">
      <Sidebar 
        containers={containers} 
        selectedContainerId={selectedContainerId}
        onSelectContainer={setSelectedContainerId}
        onAddContainer={() => setIsAddContainerOpen(true)}
      />

      <main className="flex-1 flex flex-col">
        <Header 
          onAddBookmark={() => setIsAddBookmarkOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          containerName={selectedContainerName}
        />

        <div className="flex-1 p-8">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-sm font-medium">Loading your knowledge hub...</p>
            </div>
          ) : filteredBookmarks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredBookmarks.map((bookmark) => (
                  <BookmarkCard 
                    key={bookmark.id} 
                    bookmark={bookmark} 
                    onEdit={() => {}} 
                    onDelete={handleDeleteBookmark}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                <Plus className="w-10 h-10 text-zinc-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">No bookmarks found</h2>
              <p className="text-zinc-500 mb-8">
                {searchQuery 
                  ? "We couldn't find anything matching your search. Try a different keyword." 
                  : "Start building your personal knowledge hub by adding your first bookmark."}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsAddBookmarkOpen(true)}
                  className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold hover:opacity-90 transition-opacity"
                >
                  Add Your First Link
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

      <AddContainerModal 
        isOpen={isAddContainerOpen}
        onClose={() => setIsAddContainerOpen(false)}
        onAdd={handleAddContainer}
      />
    </div>
  );
}
