'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Link as LinkIcon, Type, FileText, Tag as TagIcon, FolderPlus, Sparkles, Zap, ShieldCheck } from 'lucide-react';
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl bg-black border border-white/10 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="px-10 py-10 border-b border-white/5 flex items-center justify-between bg-gradient-to-b from-white/[0.02] to-transparent">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3 h-3 text-orange-500" />
                  <span className="text-[10px] font-black text-orange-500/50 uppercase tracking-[0.4em]">Protocol Alpha</span>
                </div>
                <h2 className="text-3xl font-black font-space-grotesk tracking-tight text-white">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="w-14 h-14 flex items-center justify-center bg-white/5 rounded-[1.25rem] hover:scale-110 active:scale-95 transition-all text-zinc-500 hover:text-white border border-white/5"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-10">
              {children}
            </div>
          </motion.div>
        </div>
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
      setDetails({ url, title: '', description: '', tags: [], category: 'Other' });
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
    <Modal isOpen={isOpen} onClose={onClose} title="Capture Resource">
      {step === 1 ? (
        <div className="space-y-8">
          <div className="space-y-4">
            <label className="block text-sm font-bold text-zinc-500 tracking-wide uppercase">
              Target Link
            </label>
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative">
                <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  autoFocus
                  type="url"
                  placeholder="https://app.example.com/project"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && analyzeUrl()}
                  className="w-full pl-16 pr-6 py-5 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl text-sm font-bold placeholder:text-zinc-500 focus:border-indigo-500/50 outline-none transition-all"
                />
              </div>
            </div>
          </div>
          <button
            onClick={analyzeUrl}
            disabled={!url || loading}
            className="w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all shadow-2xl"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                <Zap className="w-5 h-5 fill-current" />
                Analyze Link
              </>
            )}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex items-center gap-6 p-6 bg-zinc-100 dark:bg-black/40 rounded-[2rem] border border-zinc-200 dark:border-zinc-800/50">
            <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {details.logo_url ? (
                <img src={details.logo_url} className="w-12 h-12 object-contain" />
              ) : (
                <ShieldCheck className="w-10 h-10 text-indigo-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-black font-space-grotesk truncate text-zinc-900 dark:text-white">{details.title}</p>
              <p className="text-xs font-bold text-zinc-500 truncate tracking-wide uppercase">{url}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Title</label>
                <input
                  value={details.title}
                  onChange={(e) => setDetails({ ...details, title: e.target.value })}
                  className="w-full px-5 py-4 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Category</label>
                <input
                  value={details.category}
                  onChange={(e) => setDetails({ ...details, category: e.target.value })}
                  className="w-full px-5 py-4 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Intelligence Summary</label>
              <textarea
                value={details.description}
                onChange={(e) => setDetails({ ...details, description: e.target.value })}
                rows={3}
                className="w-full px-5 py-4 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500/50 transition-all resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Destination Space</label>
              <select
                value={details.container_id || ''}
                onChange={(e) => setDetails({ ...details, container_id: e.target.value })}
                className="w-full px-5 py-4 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
              >
                <option value="">Ungrouped Discovery</option>
                {containers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-5 bg-zinc-100 dark:bg-zinc-800/50 rounded-[1.5rem] font-black text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
            >
              Re-scan
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-5 bg-black dark:bg-white text-white dark:text-black rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  <Sparkles className="w-5 h-5 fill-current" />
                  Save to Hub
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function EditBookmarkModal({
  isOpen,
  onClose,
  onUpdate,
  bookmark,
  containers
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: any) => Promise<void>;
  bookmark: any;
  containers: any[];
}) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bookmark) {
      setDetails({ ...bookmark });
    }
  }, [bookmark]);

  if (!details) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdate(bookmark.id, details);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Resource Details">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex items-center gap-6 p-6 bg-zinc-100 dark:bg-black/40 rounded-[2rem] border border-zinc-200 dark:border-zinc-800/50">
          <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
            {details.logo_url ? (
              <img src={details.logo_url} className="w-12 h-12 object-contain" />
            ) : (
              <ShieldCheck className="w-10 h-10 text-indigo-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-black font-space-grotesk truncate text-zinc-900 dark:text-white">{details.title}</p>
            <p className="text-xs font-bold text-zinc-500 truncate tracking-wide uppercase">{details.url}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Title</label>
              <input
                value={details.title || ''}
                onChange={(e) => setDetails({ ...details, title: e.target.value })}
                className="w-full px-5 py-4 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Category</label>
              <input
                value={details.category || ''}
                onChange={(e) => setDetails({ ...details, category: e.target.value })}
                className="w-full px-5 py-4 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Intelligence Summary</label>
            <textarea
              value={details.description || ''}
              onChange={(e) => setDetails({ ...details, description: e.target.value })}
              rows={5}
              className="w-full px-5 py-4 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500/50 transition-all resize-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Destination Space</label>
            <select
              value={details.container_id || ''}
              onChange={(e) => setDetails({ ...details, container_id: e.target.value })}
              className="w-full px-5 py-4 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
            >
              <option value="">Ungrouped Discovery</option>
              {containers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-5 bg-zinc-100 dark:bg-zinc-800/50 rounded-[1.5rem] font-black text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-[2] py-5 bg-black dark:bg-white text-white dark:text-black rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                <Sparkles className="w-5 h-5 fill-current" />
                Update Resource
              </>
            )}
          </button>
        </div>
      </form>
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
    <Modal isOpen={isOpen} onClose={onClose} title="Initialize Space">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <label className="block text-sm font-bold text-zinc-500 tracking-wide uppercase">
            Space Designation
          </label>
          <div className="relative group">
            <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative">
              <FolderPlus className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                autoFocus
                type="text"
                placeholder="e.g. Synthetic Architectures, Neural Assets"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl text-sm font-bold placeholder:text-zinc-500 focus:border-indigo-500/50 outline-none transition-all"
              />
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={!name || loading}
          className="w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all shadow-2xl"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
            <>
              <Zap className="w-5 h-5 fill-current" />
              Activate Space
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}
