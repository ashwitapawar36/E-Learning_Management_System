import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Upload, FileText, Link, Video, AlignLeft } from 'lucide-react';

const MaterialModal = ({ isOpen, onClose, onSubmit, targetModule, loading = false }) => {
  const [materialType, setMaterialType] = useState('file');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('title', title);
    data.append('material_type', materialType);

    if (materialType === 'file' && file) {
      data.append('file', file);
    } else if (materialType === 'video' || materialType === 'link') {
      data.append('file_url', externalUrl);
    }
    
    if (content) {
      data.append('content', content);
    }

    onSubmit(targetModule.id, data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Material to "${targetModule?.title || 'Module'}"`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Material Format
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { type: 'file', label: 'File / Doc', icon: FileText },
              { type: 'video', label: 'Video Lecture', icon: Video },
              { type: 'link', label: 'External Link', icon: Link },
              { type: 'text', label: 'Notes / Guide', icon: AlignLeft },
            ].map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => setMaterialType(type)}
                className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                  materialType === type
                    ? 'border-brand-600 bg-brand-50/70 text-brand-700 font-semibold ring-1 ring-brand-600'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[11px]">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Resource Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Experiment 3 Lab Guide & Instructions"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />
        </div>

        {/* Dynamic Inputs based on type */}
        {materialType === 'file' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Document / PDF *
            </label>
            <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl p-6 hover:bg-slate-50 transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs font-semibold text-slate-700">
                {file ? file.name : 'Click to upload PDF, DOCX, ZIP or Slides'}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">Maximum 50MB</span>
              <input
                type="file"
                required={!file}
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>
        )}

        {(materialType === 'video' || materialType === 'link') && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {materialType === 'video' ? 'Video URL (YouTube, Vimeo, Cloud Stream) *' : 'Web Resource URL *'}
            </label>
            <input
              type="url"
              required
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://example.com/lecture-recording"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Notes / Learning Instructions (Optional)
          </label>
          <textarea
            rows="3"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Provide context, references, or instructions for students..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-sans"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Add Material
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default MaterialModal;
