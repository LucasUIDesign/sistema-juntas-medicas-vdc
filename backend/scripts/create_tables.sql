-- Crear tabla JuntaMedica
CREATE TABLE IF NOT EXISTS JuntaMedica (
    id TEXT PRIMARY KEY,
    pacienteId TEXT NOT NULL,
    medicoId TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'BORRADOR',
    fecha TEXT NOT NULL,
    fechaDictamen TEXT,
    aptitudLaboral TEXT,
    diagnosticoPrincipal TEXT,
    observaciones TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (pacienteId) REFERENCES Paciente(id),
    FOREIGN KEY (medicoId) REFERENCES User(id)
);

-- Crear tabla Dictamen
CREATE TABLE IF NOT EXISTS Dictamen (
    id TEXT PRIMARY KEY,
    juntaId TEXT NOT NULL UNIQUE,
    datosCompletos TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (juntaId) REFERENCES JuntaMedica(id) ON DELETE CASCADE
);

-- Crear tabla DocumentoAdjunto
CREATE TABLE IF NOT EXISTS DocumentoAdjunto (
    id TEXT PRIMARY KEY,
    juntaId TEXT NOT NULL,
    nombre TEXT NOT NULL,
    tipo TEXT,
    url TEXT NOT NULL,
    categoria TEXT,
    size INTEGER,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (juntaId) REFERENCES JuntaMedica(id) ON DELETE CASCADE
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_juntamedica_paciente ON JuntaMedica(pacienteId);
CREATE INDEX IF NOT EXISTS idx_juntamedica_medico ON JuntaMedica(medicoId);
CREATE INDEX IF NOT EXISTS idx_juntamedica_estado ON JuntaMedica(estado);
CREATE INDEX IF NOT EXISTS idx_dictamen_junta ON Dictamen(juntaId);
CREATE INDEX IF NOT EXISTS idx_documento_junta ON DocumentoAdjunto(juntaId);
