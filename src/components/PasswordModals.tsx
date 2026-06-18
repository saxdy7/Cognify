'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Link as LinkIcon, Type, Mail, Key, FileText, Sparkles, Zap, ShieldCheck, RefreshCw, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
            className="relative w-full max-w-xl bg-black border border-white/10 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="px-10 py-10 border-b border-white/5 flex items-center justify-between bg-gradient-to-b from-white/[0.02] to-transparent sticky top-0 backdrop-blur-xl z-10">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-3 h-3 text-orange-500" />
                  <span className="text-[10px] font-black text-orange-500/50 uppercase tracking-[0.4em]">Secure Vault</span>
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

// Password Generator
function generatePassword(length: number = 16, options: any = {}) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let chars = '';
  if (options.uppercase !== false) chars += uppercase;
  if (options.lowercase !== false) chars += lowercase;
  if (options.numbers !== false) chars += numbers;
  if (options.symbols !== false) chars += symbols;

  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export function AddPasswordModal({
  isOpen,
  onClose,
  onAdd
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (password: any) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState({
    website_name: '',
    website_url: '',
    email: '',
    password: '',
    notes: '',
    category: 'Personal'
  });

  const [passwordLength, setPasswordLength] = useState(16);
  const [passwordOptions, setPasswordOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  });
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const newPassword = generatePassword(passwordLength, passwordOptions);
    setDetails({ ...details, password: newPassword });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(details.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    
    if (strength <= 2) return { label: 'Weak', color: 'text-red-500' };
    if (strength <= 3) return { label: 'Medium', color: 'text-yellow-500' };
    return { label: 'Strong', color: 'text-green-500' };
  };

  const strength = details.password ? getPasswordStrength(details.password) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAdd(details);
      setDetails({
        website_name: '',
        website_url: '',
        email: '',
        password: '',
        notes: '',
        category: 'Personal'
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Password">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Website Name *</label>
            <input
              autoFocus
              required
              value={details.website_name}
              onChange={(e) => setDetails({ ...details, website_name: e.target.value })}
              placeholder="e.g. GitHub, Gmail, AWS"
              className="w-full px-5 py-4 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl text-sm font-bold outline-none focus:border-orange-500/50 transition-all"
            />
          </div>

          <div className="col-span-2 space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Website URL</label>
            <input
              type="url"
              value={details.website_url}
              onChange={(e) => setDetails({ ...details, website_url: e.target.value })}
              placeholder="https://github.com"
              className="w-full px-5 py-4 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl text-sm font-bold outline-none focus:border-orange-500/50 transition-all"
            />
          </div>

          <div className="col-span-2 space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Email / Username *</label>
            <input
              required
              value={details.email}
              onChange={(e) => setDetails({ ...details, email: e.target.value })}
              placeholder="user@example.com"
              className="w-full px-5 py-4 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl text-sm font-bold outline-none focus:border-orange-500/50 transition-all"
            />
          </div>
        </div>

        {/* Password Generator Section */}
        <div className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-3xl border border-orange-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Password Generator</h3>
            <button
              type="button"
              onClick={handleGenerate}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Generate
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-white/5">
              <input
                type="text"
                value={details.password}
                onChange={(e) => setDetails({ ...details, password: e.target.value })}
                placeholder="Generated password or enter manually"
                className="flex-1 bg-transparent text-sm font-mono text-white outline-none"
                required
              />
              <button type="button" onClick={handleCopy} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
              </button>
            </div>

            {strength && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Strength:</span>
                <span className={cn("text-xs font-bold", strength.color)}>{strength.label}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Length: {passwordLength}</span>
                <input
                  type="range"
                  min="8"
                  max="32"
                  value={passwordLength}
                  onChange={(e) => setPasswordLength(parseInt(e.target.value))}
                  className="w-32"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Object.entries(passwordOptions).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setPasswordOptions({ ...passwordOptions, [key]: e.target.checked })}
                      className="rounded"
                    />
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Notes (Optional)</label>
          <textarea
            value={details.notes}
            onChange={(e) => setDetails({ ...details, notes: e.target.value })}
            rows={3}
            placeholder="Additional details..."
            className="w-full px-5 py-4 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl text-sm font-bold outline-none focus:border-orange-500/50 transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
            <>
              <ShieldCheck className="w-5 h-5 fill-current" />
              Save Password
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}

export function EditPasswordModal({
  isOpen,
  onClose,
  onUpdate,
  password
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: any) => Promise<void>;
  password: any;
}) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (password) {
      setDetails({ ...password });
    }
  }, [password]);

  if (!details) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdate(password.id, details);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Password">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Website Name</label>
            <input
              value={details.website_name || ''}
              onChange={(e) => setDetails({ ...details, website_name: e.target.value })}
              className="w-full px-5 py-4 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl text-sm font-bold outline-none focus:border-orange-500/50 transition-all"
            />
          </div>

          <div className="col-span-2 space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Website URL</label>
            <input
              value={details.website_url || ''}
              onChange={(e) => setDetails({ ...details, website_url: e.target.value })}
              className="w-full px-5 py-4 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl text-sm font-bold outline-none focus:border-orange-500/50 transition-all"
            />
          </div>

          <div className="col-span-2 space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Email / Username</label>
            <input
              value={details.email || ''}
              onChange={(e) => setDetails({ ...details, email: e.target.value })}
              className="w-full px-5 py-4 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl text-sm font-bold outline-none focus:border-orange-500/50 transition-all"
            />
          </div>

          <div className="col-span-2 space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Password</label>
            <input
              type="password"
              value={details.password || ''}
              onChange={(e) => setDetails({ ...details, password: e.target.value })}
              className="w-full px-5 py-4 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl text-sm font-bold outline-none focus:border-orange-500/50 transition-all font-mono"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Notes</label>
          <textarea
            value={details.notes || ''}
            onChange={(e) => setDetails({ ...details, notes: e.target.value })}
            rows={5}
            className="w-full px-5 py-4 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl text-sm font-bold outline-none focus:border-orange-500/50 transition-all resize-none"
          />
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
            className="flex-[2] py-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                <ShieldCheck className="w-5 h-5 fill-current" />
                Update Password
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
