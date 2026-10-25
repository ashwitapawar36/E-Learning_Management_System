import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Video, 
  Link as LinkIcon, 
  Download, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';

const ModuleAccordion = ({
  modules = [],
  isInstructor = false,
  onAddMaterial,
  onDeleteModule,
  onDeleteMaterial,
  onAddModule
}) => {
  const [expandedModules, setExpandedModules] = useState(() => {
    // Expand first module by default
    return modules.length > 0 ? { [modules[0].id]: true } : {};
  });

  const [expandedMaterialIds, setExpandedMaterialIds] = useState({});

  const toggleMaterialContent = (matId) => {
    setExpandedMaterialIds(prev => ({
      ...prev,
      [matId]: !prev[matId]
    }));
  };

  const toggleModule = (id) => {
    setExpandedModules(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'file': return <FileText className="w-4 h-4 text-rose-500" />;
      case 'video': return <Video className="w-4 h-4 text-purple-500" />;
      case 'link': return <LinkIcon className="w-4 h-4 text-sky-500" />;
      default: return <BookOpen className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {modules.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-slate-200 p-6">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No syllabus modules added yet</p>
          <p className="text-xs text-slate-400 mt-1">Modules structure course lessons, readings, and lab activities.</p>
          {isInstructor && onAddModule && (
            <div className="mt-4">
              <Button size="sm" onClick={onAddModule} icon={Plus}>
                Add First Module
              </Button>
            </div>
          )}
        </div>
      ) : (
        modules.map((mod, idx) => {
          const isExpanded = !!expandedModules[mod.id];
          const materials = mod.materials || [];

          return (
            <div
              key={mod.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
            >
              {/* Module Header Bar */}
              <div
                className="p-4 sm:px-6 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 transition-colors select-none"
                onClick={() => toggleModule(mod.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                  <span className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 truncate heading-font">
                      {mod.title}
                    </h4>
                    {mod.description && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {mod.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="neutral" size="sm">
                    {materials.length} {materials.length === 1 ? 'item' : 'items'}
                  </Badge>

                  {isInstructor && (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onAddMaterial && onAddMaterial(mod)}
                        title="Add Course Material"
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      {onDeleteModule && (
                        <button
                          onClick={() => onDeleteModule(mod.id)}
                          title="Delete Module"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}

                  <button className="text-slate-400 hover:text-slate-600 p-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Module Contents */}
              {isExpanded && (
                <div className="px-4 sm:px-6 pb-4 pt-1 border-t border-slate-100 bg-slate-50/40">
                  {materials.length === 0 ? (
                    <div className="py-4 text-center">
                      <p className="text-xs text-slate-400">No resources or lecture notes in this module yet.</p>
                      {isInstructor && onAddMaterial && (
                        <button
                          onClick={() => onAddMaterial(mod)}
                          className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Upload file, video link, or reading notes
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 mt-2">
                      {materials.map((mat) => (
                        <div
                          key={mat.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/60 hover:border-slate-300 transition-all text-xs"
                        >
                          <div className="flex items-start gap-2.5 flex-1 min-w-0 pr-3">
                            <div className="mt-0.5 flex-shrink-0">
                              {getMaterialIcon(mat.material_type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-slate-800 block truncate">
                                {mat.title}
                              </span>
                              {mat.content && (
                                <div className="mt-1">
                                  <p className={`text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-sans text-xs leading-relaxed whitespace-pre-wrap ${expandedMaterialIds[mat.id] ? '' : 'line-clamp-2'}`}>
                                    {mat.content}
                                  </p>
                                  {mat.content.length > 80 && (
                                    <button
                                      type="button"
                                      onClick={() => toggleMaterialContent(mat.id)}
                                      className="mt-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      {expandedMaterialIds[mat.id] ? 'Show less' : 'Read full note'}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {mat.file_url && (
                              <a
                                href={mat.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                              >
                                <Download className="w-3 h-3" />
                                <span>Download</span>
                              </a>
                            )}

                            {mat.material_type === 'video' && mat.file_url && (
                              <a
                                href={mat.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Watch Video</span>
                              </a>
                            )}

                            {mat.material_type === 'link' && mat.file_url && (
                              <a
                                href={mat.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-medium transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Open Link</span>
                              </a>
                            )}

                            {isInstructor && onDeleteMaterial && (
                              <button
                                onClick={() => onDeleteMaterial(mat.id)}
                                className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors"
                                title="Delete Resource"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default ModuleAccordion;
