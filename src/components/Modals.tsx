'use client';

import React, { useState } from 'react';
import { X, Loader2, Link as LinkIcon, Type, FileText, Tag as TagIcon, FolderPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import axios from 'axios';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-[51] overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
              <h2 className="text-lg font-bold">{title}</h2>
              <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function AddBookmarkModal({ 
  isOpen, 
  onClose, 
  onAdd,
  containers 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onAdd: (bookmark: any) => Promise<void>;
  containers: any[];
}) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: URL, 2: Details
  const [details, setDetails] = useState<any>(null);

  const analyzeUrl = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const { data } = await axios.post('/api/analyze', { url });
      setDetails(data);
      setStep(2);
    } catch (error) {
      console.error(error);
      alert('Failed to analyze URL. You can still add it manually.');
      setDetails({ url, title: '', description: '', tags: [] });
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAdd({ ...details, url });
      setUrl('');
      setStep(1);
      setDetails(null);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Bookmark">
      {step === 1 ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Paste your link
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                autoFocus
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && analyzeUrl()}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
              />
            </div>
          </div>
          <button
            onClick={analyzeUrl}
            disabled={!url || loading}
            className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="w-12 h-12 bg-white dark:bg-black rounded-lg border border-zinc-100 dark:border-zinc-800 flex items-center justify-center overflow-hidden">
                <img src={details.logo_url} className="w-8 h-8 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{details.title}</p>
                <p className="text-xs text-zinc-500 truncate">{url}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Title</label>
              <input
                value={details.title}
                onChange={(e) => setDetails({ ...details, title: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-black dark:focus:border-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Description</label>
              <textarea
                value={details.description}
                onChange={(e) => setDetails({ ...details, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Container</label>
              <select
                value={details.container_id || ''}
                onChange={(e) => setDetails({ ...details, container_id: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-black dark:focus:border-white transition-colors"
              >
                <option value="">No Container</option>
                {containers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Bookmark'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function AddContainerModal({ 
  isOpen, 
  onClose, 
  onAdd 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onAdd: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    try {
      await onAdd(name);
      setName('');
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Container">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Container Name
          </label>
          <div className="relative">
            <FolderPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              autoFocus
              type="text"
              placeholder="e.g. AI Tools, Reading List"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={!name || loading}
          className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Container'}
        </button>
      </form>
    </Modal>
  );
}
