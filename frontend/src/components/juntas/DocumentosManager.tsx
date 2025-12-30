import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DocumentoParaSubir, 
  CategoriaDocumento, 
  CATEGORIAS_DOCUMENTO,
  Adjunto 
} from '../../types';
import {
  DocumentIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  FolderIcon,
  EyeIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface DocumentosManagerProps {
  documentos: DocumentoParaSubir[];
  adjuntosExistentes?: Adjunto[];
  onChange: (documentos: DocumentoParaSubir[]) => void;
  onDeleteExistente?: (adjuntoId: string) => void;
  readOnly?: boolean;
}

const DocumentosManager = ({ 
  documentos, 
  adjuntosExistentes = [],
  onChange, 
  onDeleteExistente,
  readOnly = false 
}: DocumentosManagerProps) => {
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaDocumento>('EXAMEN_PSICOLOGICO');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const nuevosDocumentos: DocumentoParaSubir[] = [];
    
    Array.from(files).forEach(file => {
      // Validar tipo de archivo
      const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!tiposPermitidos.includes(file.type)) {
        return;
      }

      // Validar tamaño (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        return;
      }

      // Crear preview para imágenes
      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }

      nuevosDocumentos.push({
        file,
        categoria: categoriaActiva,
        preview,
      });
    });

    onChange([...documentos, ...nuevosDocumentos]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemoveDocumento = (index: number) => {
    const nuevosDocumentos = [...documentos];
    // Limpiar preview URL si existe
    if (nuevosDocumentos[index].preview) {
      URL.revokeObjectURL(nuevosDocumentos[index].preview!);
    }
    nuevosDocumentos.splice(index, 1);
    onChange(nuevosDocumentos);
  };

  const documentosPorCategoria = documentos.filter(d => d.categoria === categoriaActiva);
  const adjuntosPorCategoria = adjuntosExistentes.filter(a => a.categoria === categoriaActiva);

  const contarDocumentos = (categoria: CategoriaDocumento) => {
    return documentos.filter(d => d.categoria === categoria).length + 
           adjuntosExistentes.filter(a => a.categoria === categoria).length;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Tabs de categorías */}
      <div className="border-b border-gray-200">
        <div className="flex flex-wrap gap-1">
          {CATEGORIAS_DOCUMENTO.map((cat) => {
            const count = contarDocumentos(cat.value);
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategoriaActiva(cat.value)}
                className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors relative ${
                  categoriaActiva === cat.value
                    ? 'bg-vdc-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
                {count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                    categoriaActiva === cat.value
                      ? 'bg-white text-vdc-primary'
                      : 'bg-vdc-primary text-white'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Área de contenido */}
      <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
        {/* Zona de drop */}
        {!readOnly && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors mb-4 ${
              dragOver 
                ? 'border-vdc-primary bg-vdc-primary/5' 
                : 'border-gray-300 hover:border-vdc-primary/50'
            }`}
          >
            <CloudArrowUpIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              Arrastra archivos aquí o <span className="text-vdc-primary font-medium">haz clic para seleccionar</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PDF, JPG, PNG (máx. 10MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>
        )}

        {/* Lista de documentos existentes */}
        {adjuntosPorCategoria.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Documentos guardados</p>
            {adjuntosPorCategoria.map((adjunto) => (
              <div
                key={adjunto.id}
                className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200"
              >
                <div className="flex items-center space-x-3">
                  <DocumentIcon className="h-8 w-8 text-vdc-primary" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{adjunto.nombre}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(adjunto.size)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    className="p-1.5 text-gray-400 hover:text-vdc-primary transition-colors"
                    title="Ver documento"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  {!readOnly && onDeleteExistente && (
                    <button
                      type="button"
                      onClick={() => onDeleteExistente(adjunto.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      title="Eliminar documento"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lista de documentos nuevos */}
        <AnimatePresence>
          {documentosPorCategoria.length > 0 && (
            <div className="space-y-2">
              {adjuntosPorCategoria.length > 0 && (
                <p className="text-xs font-medium text-gray-500 uppercase">Nuevos documentos</p>
              )}
              {documentosPorCategoria.map((doc, idx) => {
                const globalIndex = documentos.findIndex(d => d === doc);
                return (
                  <motion.div
                    key={`${doc.file.name}-${idx}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-200"
                  >
                    <div className="flex items-center space-x-3">
                      {doc.preview ? (
                        <img 
                          src={doc.preview} 
                          alt={doc.file.name}
                          className="h-10 w-10 object-cover rounded"
                        />
                      ) : (
                        <DocumentIcon className="h-8 w-8 text-green-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(doc.file.size)}</p>
                      </div>
                    </div>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDocumento(globalIndex)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        title="Quitar documento"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Estado vacío */}
        {documentosPorCategoria.length === 0 && adjuntosPorCategoria.length === 0 && (
          <div className="text-center py-8">
            <FolderIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">
              No hay documentos en esta categoría
            </p>
          </div>
        )}
      </div>

      {/* Resumen total */}
      {documentos.length > 0 && (
        <div className="flex items-center justify-between text-sm bg-blue-50 rounded-lg px-4 py-2">
          <span className="text-blue-700">
            {documentos.length} documento{documentos.length !== 1 ? 's' : ''} nuevo{documentos.length !== 1 ? 's' : ''} para subir
          </span>
          <span className="text-blue-600 font-medium">
            {formatFileSize(documentos.reduce((acc, d) => acc + d.file.size, 0))}
          </span>
        </div>
      )}
    </div>
  );
};

export default DocumentosManager;
