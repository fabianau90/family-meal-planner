import { useRef } from 'react';

// Compresses and crops image to a square, returns base64 data URL
function compressImage(file, size = 200) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function Avatar({ member, size = 'md', editable = false, onUpload }) {
  const inputRef = useRef(null);

  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-24 h-24 text-4xl',
  };

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await compressImage(file);
    onUpload?.(base64);
    e.target.value = '';
  }

  const inner = member?.avatar_url
    ? <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
    : <span className="font-bold text-white leading-none">{member?.name?.[0]?.toUpperCase()}</span>;

  return (
    <div className="relative inline-flex flex-shrink-0">
      <div
        className={`${sizes[size]} rounded-full flex items-center justify-center overflow-hidden shadow-sm`}
        style={{ backgroundColor: member?.avatar_color || '#6366f1' }}
      >
        {inner}
      </div>

      {editable && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs shadow hover:bg-orange-600 transition-colors"
            title="Change photo"
          >
            📷
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </>
      )}
    </div>
  );
}
