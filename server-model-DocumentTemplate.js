const mongoose = require('mongoose');

const variableDetailSchema = new mongoose.Schema({
  model: {
    type: String,
    required: true,
    enum: ['Contact', 'Folder', 'User', 'Skill', 'JudFolder'],
    description: 'Modelo de referencia'
  },
  property: {
    type: String,
    required: true,
    description: 'Propiedad del modelo'
  },
  path: {
    type: String,
    required: true,
    description: 'Path completo para el template (ej: contact.name)'
  },
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['contact', 'folder', 'user', 'other']
  },
  required: {
    type: Boolean,
    default: true
  },
  description: String,
  fallback: String,
  displayName: {
    type: String,
    required: true,
    description: 'Nombre amigable para mostrar (ej: NOMBRE_CLIENTE)'
  }
}, { _id: false });

const documentTemplateSchema = new mongoose.Schema({
  // Identificación
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  
  // Categorización
  category: {
    type: String,
    required: true,
    enum: ['presentaciones', 'demandas', 'escritos', 'recursos', 'medidas_cautelares', 'otros'],
    default: 'escritos'
  },
  
  // Contenido
  content: {
    type: String,
    required: true
  },
  
  // Modelos requeridos
  requiredModels: [{
    type: String,
    enum: ['Contact', 'Folder', 'User', 'Skill', 'JudFolder']
  }],
  
  // Detalles de variables
  variableDetails: [variableDetailSchema],
  
  // Etiquetas para búsqueda
  tags: [String],
  
  // Propiedad y visibilidad
  isGeneral: {
    type: Boolean,
    default: false,
    index: true
  },
  
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return !this.isGeneral;
    }
  },
  
  // Control de estado
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Metadatos
  usageCount: {
    type: Number,
    default: 0
  },
  
  lastUsedAt: Date,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices compuestos
documentTemplateSchema.index({ isGeneral: 1, isActive: 1 });
documentTemplateSchema.index({ owner: 1, isActive: 1 });
documentTemplateSchema.index({ category: 1, isActive: 1 });
documentTemplateSchema.index({ tags: 1 });
documentTemplateSchema.index({ name: 'text', description: 'text' });

// Métodos de instancia
documentTemplateSchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  return this.save();
};

// Métodos estáticos
documentTemplateSchema.statics.getGeneralTemplates = function(category = null) {
  const query = { isGeneral: true, isActive: true };
  if (category) query.category = category;
  return this.find(query).sort({ category: 1, name: 1 });
};

documentTemplateSchema.statics.getUserTemplates = function(userId, category = null) {
  const query = { owner: userId, isActive: true };
  if (category) query.category = category;
  return this.find(query).sort({ category: 1, name: 1 });
};

module.exports = mongoose.model('DocumentTemplate', documentTemplateSchema);