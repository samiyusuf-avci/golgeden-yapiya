import React, { useState } from 'react';
import { AlertTriangle, X, Trash2, ShieldAlert } from 'lucide-react';

interface DeleteProjectModalProps {
  isOpen: boolean;
  projectName: string;
  onClose: () => void;
  onConfirmDelete: () => void;
}

export const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  isOpen,
  projectName,
  onClose,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = () => {
    setIsDeleting(true);
    onConfirmDelete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fadeIn">
      <div className="bg-slate-900 border border-red-500/30 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-[0_0_50px_rgba(239,68,68,0.2)] relative overflow-hidden">
        {/* Glow Decorator */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">Projeyi Silmeyi Onaylayın</h3>
              <p className="text-xs text-red-400 font-medium">Bu işlem geri alınamaz!</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="space-y-4 relative z-10">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-red-300">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>Kalıcı Silme Uyarısı</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              <strong className="text-white font-bold">{projectName}</strong> isimli projeyi silmek üzeresiniz.
              Projeye ait tüm katlar, daireler, imalat aşamaları ve gider kayıtları kalıcı olarak silinecektir.
            </p>
          </div>

          <div className="text-xs text-slate-400">
            Silme işlemini onaylamak için lütfen aşağıdan <strong className="text-white">"Projeyi Kalıcı Olarak Sil"</strong> butonuna tıklayın.
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Vazgeç / İptal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-bold transition shadow-lg shadow-red-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Siliniyor...' : 'Evet, Projeyi Kalıcı Olarak Sil'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
