export default function WebViewer({ url, onClose }) {
  if (!url) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100 bg-white">
        <button onClick={onClose} className="text-orange-500 font-medium text-sm">✕ Close</button>
        <p className="flex-1 text-xs text-stone-400 truncate">{url}</p>
      </div>
      <iframe src={url} className="flex-1 w-full border-none" title="Recipe" />
    </div>
  );
}
