'use client';

import React, { useState } from 'react';
import { ExternalLink, Star, Trash2, Eye, EyeOff, Copy, Shield, Check } from 'lucide-react';
import { Password } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PasswordCardProps {
  password: Password;
  onEdit: (password: Password) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (password: Password) => void;
  viewMode?: 'grid' | 'list';
}

export function PasswordCard({ password, onEdit, onDelete, onToggleFavorite, viewMode = 'grid' }: PasswordCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyPassword = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(password.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(password.email);
  };

  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    
    if (strength <= 2) return { label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { label: 'Medium', color: 'bg-yellow-500' };
    return { label: 'Strong', color: 'bg-green-500' };
  };

  const strength = getPasswordStrength(password.password);

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="group relative flex items-center gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 bg-white/5 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/10 dark:border-zinc-800/50 rounded-xl sm:rounded-[1.5rem] hover:bg-white/10 transition-all duration-300 w-full"
      >
        {/* List View Content */}
        <div className="relative w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0 shadow-lg">
          <Shield className="w-6 h-6 text-white" />
        </div>

        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onEdit(password)}
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-1">
            <h3 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-orange-400 transition-colors">
              {password.website_name}
            </h3>
            <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider", strength.color, "text-white")}>
              {strength.label}
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-zinc-500 truncate">{password.email}</p>
        </div>

        {/* List View Actions */}
        <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopyEmail}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Copy Email"
          >
            <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={handleCopyPassword}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Copy Password"
          >
            {copied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
          <button
            onClick={(e) => { e.preventDefault(); onToggleFavorite(password); }}
            className={cn("p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors", password.is_favorite ? "text-amber-400" : "text-zinc-400")}
          >
            <Star className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", password.is_favorite && "fill-current")} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); onDelete(password.id); }}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -8, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } }}
      className="group relative flex flex-col bg-white/5 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/10 dark:border-zinc-800/50 rounded-[2.5rem] overflow-hidden hover:shadow-[0_30px_100px_-20px_rgba(0,0,0,0.5)] transition-all duration-500 h-full"
    >
      {/* Action Buttons */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-6 md:right-6 z-20 flex gap-1.5 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300">
        <button
          onClick={(e) => { e.preventDefault(); onToggleFavorite(password); }}
          className={cn(
            "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20 transition-all hover:scale-110 active:scale-95 shadow-2xl",
            password.is_favorite
              ? "bg-amber-500 text-white border-amber-400"
              : "bg-white/10 dark:bg-zinc-800/40 text-white"
          )}
        >
          <Star className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5", password.is_favorite && "fill-current")} />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); onDelete(password.id); }}
          className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center bg-white/10 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/20 text-white transition-all hover:scale-110 active:scale-95 hover:bg-red-500/80 hover:border-red-400 shadow-2xl"
        >
          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
        </button>
      </div>

      {/* Gradient Header */}
      <div className="relative h-32 bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
          <div className={cn("inline-flex px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider", strength.color, "text-white shadow-lg")}>
            {strength.label}
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className="p-4 sm:p-5 md:p-6 lg:p-8 flex flex-col flex-1 cursor-pointer"
        onClick={() => onEdit(password)}
      >
        <div className="flex items-start gap-2.5 sm:gap-3 md:gap-4 mb-4 sm:mb-5 md:mb-6">
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-[1.25rem] bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0 shadow-2xl">
            <Shield className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-white leading-tight mb-1 font-space-grotesk group-hover:text-orange-400 transition-colors line-clamp-2">
              {password.website_name}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-zinc-500 tracking-wide truncate">
              {password.website_url || 'Secure Entry'}
            </p>
          </div>
        </div>

        {/* Email */}
        <div className="mb-4">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2">Email/Username</p>
          <div className="flex items-center gap-2 p-3 bg-black/20 rounded-xl border border-white/5">
            <p className="text-sm text-zinc-300 flex-1 truncate">{password.email}</p>
            <button onClick={handleCopyEmail} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <Copy className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Password */}
        <div className="mb-4">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2">Password</p>
          <div className="flex items-center gap-2 p-3 bg-black/20 rounded-xl border border-white/5">
            <p className="text-sm text-zinc-300 flex-1 font-mono truncate">
              {showPassword ? password.password : '••••••••••••'}
            </p>
            <button onClick={() => setShowPassword(!showPassword)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4 text-zinc-400" /> : <Eye className="w-4 h-4 text-zinc-400" />}
            </button>
            <button onClick={handleCopyPassword} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
            </button>
          </div>
        </div>

        {/* Notes */}
        {password.notes && (
          <div className="mt-auto pt-4 border-t border-white/5">
            <p className="text-xs text-zinc-500 line-clamp-2">{password.notes}</p>
          </div>
        )}

        {/* Link */}
        {password.website_url && (
          <a
            href={password.website_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-4 flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Visit Website
          </a>
        )}
      </div>
    </motion.div>
  );
}
