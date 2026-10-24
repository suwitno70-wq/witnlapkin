import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Upload, RotateCcw, Check, Sparkles, X } from 'lucide-react';
import { DEFAULT_SUPERVISOR_SIGNATURE, DEFAULT_TEACHER_SIGNATURE } from '../utils/defaultData';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole: 'teacher' | 'supervisor';
  currentSignature?: string;
  roleTitle: string;
  personName: string;
  nip: string;
  onSaveSignature: (role: 'teacher' | 'supervisor', signatureDataUrl: string) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  targetRole,
  currentSignature,
  roleTitle,
  personName,
  nip,
  onSaveSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState<string>('#1e293b'); // dark formal ink
  const [penSize, setPenSize] = useState<number>(3);
  const [hasDrawn, setHasDrawn] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // If current signature exists, draw it
    if (currentSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, (canvas.width - img.width) / 2, (canvas.height - img.height) / 2);
        setHasDrawn(true);
      };
      img.src = currentSignature;
    } else {
      setHasDrawn(false);
    }
  }, [isOpen, currentSignature]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleUsePreset = () => {
    const preset = targetRole === 'teacher' ? DEFAULT_TEACHER_SIGNATURE : DEFAULT_SUPERVISOR_SIGNATURE;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, (canvas.width - img.width) / 2, (canvas.height - img.height) / 2);
      setHasDrawn(true);
    };
    img.src = preset;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Scale to fit
        const scale = Math.min((canvas.width - 20) / img.width, (canvas.height - 20) / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        setHasDrawn(true);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSaveSignature(targetRole, dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PenTool className="w-4 h-4 text-blue-600" />
              Tanda Tangan Digital ({targetRole === 'teacher' ? 'Guru' : 'Kepala Madrasah'})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tanda tangan akan diposisikan rata kiri/kanan secara presisi pada dokumen cetak dan Word.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Target preview info */}
          <div className="text-center pb-2 border-b border-slate-100">
            <span className="text-xs text-slate-500">{roleTitle}</span>
            <div className="text-sm font-bold text-slate-800">{personName}</div>
            <div className="text-[11px] text-slate-400">NIP. {nip}</div>
          </div>

          {/* Canvas Pad */}
          <div className="flex flex-col items-center">
            <div className="relative border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-white shadow-inner">
              <canvas
                ref={canvasRef}
                width={360}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="cursor-crosshair touch-none"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 text-xs italic">
                  Goreskan tanda tangan Anda di sini (layar sentuh / mouse)
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between w-full mt-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px]">Tinta:</span>
                <button
                  type="button"
                  onClick={() => setPenColor('#1e293b')}
                  className={`w-5 h-5 rounded-full bg-slate-900 border-2 ${
                    penColor === '#1e293b' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'
                  }`}
                  title="Tinta Hitam Formal"
                />
                <button
                  type="button"
                  onClick={() => setPenColor('#1d4ed8')}
                  className={`w-5 h-5 rounded-full bg-blue-700 border-2 ${
                    penColor === '#1d4ed8' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'
                  }`}
                  title="Tinta Biru Dokumen"
                />

                <span className="text-slate-300 mx-1">|</span>

                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-rose-600 px-2 py-1 rounded hover:bg-slate-100"
                >
                  <RotateCcw className="w-3 h-3" />
                  Hapus
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-blue-600 px-2 py-1 rounded hover:bg-slate-100 border border-slate-200"
                >
                  <Upload className="w-3 h-3" />
                  Upload Gambar
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={handleUsePreset}
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded hover:bg-indigo-50 border border-indigo-200"
                  title="Gunakan contoh tanda tangan presisi dari foto dokumen"
                >
                  <Sparkles className="w-3 h-3" />
                  Gunakan TTD Foto
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
          >
            <Check className="w-4 h-4" />
            Terapkan Tanda Tangan
          </button>
        </div>
      </div>
    </div>
  );
};
