export interface PdfTemplateField {
  pdfFieldName: string;
  name: string;
  label: string;
  type: 'text' | 'multiline' | 'date' | 'radio' | 'checkbox';
  group: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  order: number;
}

export interface PdfTemplate {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  s3Key: string;
  fields: PdfTemplateField[];
  isActive: boolean;
  isPublic: boolean;
  source?: 'system' | 'user';
  modelType?: 'static' | 'dynamic';
  userId?: string;
  fillConfig: { flatten: boolean };
  previewUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PostalDocumentType {
  _id: string;
  userId: string;
  pdfTemplateId: string;
  templateSlug: string;
  templateName: string;
  templateCategory: string;
  title: string;
  description?: string;
  formData: Record<string, string>;
  s3Key?: string | null;
  status: 'draft' | 'generated' | 'sent' | 'archived';
  generatedAt?: string | null;
  linkedTrackingId?: string | null;
  linkedFolderId?: string | null;
  linkedContactId?: string | null;
  tags?: string[];
  sentAt?: string | null;
  sentVia?: string | null;
  documentUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}
