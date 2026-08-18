import React, { useState, useRef, useEffect } from 'react';
import type { Project } from '../types';
import { Building2, ChevronDown, Check, Layers, MapPin, Plus } from 'lucide-react';

interface ProjectSelectorProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (project: Project) => void;
  onOpenPortfolio: () => void;
  onOpenCreateModal?: () => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onOpenPortfolio,
  onOpenCreateModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white px-3.5 py-2 rounded-2xl transition flex items-center gap-3 shadow-lg group cursor-pointer"
        title="Aktif İnşaat Projesini Değiştir"
      >
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-sm">
          <Building2 className="w-4 h-4" />
        </div>

        <div className="text-left hidden sm:block max-w-[180px] lg:max-w-[220px]">
          <div className="text-xs font-bold text-white truncate">
            {activeProject ? activeProject.name : 'Proje Seçiniz'}
          </div>
          <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-amber-400" />
            {activeProject ? activeProject.location : 'İnşaat Lokasyonu'}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 group-hover:text-white transition-transform ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 lg:w-80 bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-3xl shadow-2xl z-50 p-2 space-y-1">
          <div className="px-3 py-2 border-b border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Aktif İnşaat Projeleri ({projects.length})
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenPortfolio();
              }}
              className="text-[10px] font-bold text-amber-400 hover:text-amber-300 transition"
            >
              Portföy Görünümü ➔
            </button>
          </div>

          {/* Project List */}
          <div className="max-h-60 overflow-y-auto space-y-1 py-1">
            {projects.map((proj) => {
              const isSelected = activeProject?.id === proj.id;
              return (
                <button
                  key={proj.id}
                  onClick={() => {
                    onSelectProject(proj);
                    setIsOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-2xl transition flex items-center justify-between text-left cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 border border-amber-500/30 text-white'
                      : 'hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="space-y-0.5 max-w-[200px]">
                    <div className="text-xs font-bold truncate flex items-center gap-1.5">
                      <span>{proj.name}</span>
                      {proj.status === 'planning' && (
                        <span className="text-[9px] bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded border border-sky-500/30">
                          Planlama
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {proj.location} • %{proj.physical_progress.toFixed(0)} İlerleme
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                </button>
              );
            })}
          </div>

          {/* Footer Action */}
          {onOpenCreateModal && (
            <div className="pt-1.5 border-t border-slate-800/80">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenCreateModal();
                }}
                className="w-full bg-slate-800/80 hover:bg-slate-800 text-amber-400 border border-slate-700/60 p-2 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yeni İnşaat Ekle</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
