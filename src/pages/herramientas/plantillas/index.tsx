import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { Add, ClipboardText, DocumentText, Eye, Setting2 } from "iconsax-react";

import MainCard from "components/MainCard";
import { dispatch, useSelector } from "store";
import { fetchPdfTemplates, getPdfTemplate } from "store/reducers/postalDocuments";
import { openSnackbar } from "store/reducers/snackbar";
import { PdfTemplate } from "types/postal-document";
import CreatePostalDocumentModal from "sections/apps/postal-documents/CreatePostalDocumentModal";

// ── Helpers ────────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
  postal:      "info",
  laboral:     "warning",
  judicial:    "error",
  societario:  "secondary",
  notarial:    "success",
  otros:       "default",
};

// ── Skeleton ───────────────────────────────────────────────────────────────────

const CardsSkeleton = ({ count = 4 }: { count?: number }) => (
  <Grid container spacing={2.5}>
    {Array(count).fill(0).map((_, i) => (
      <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
        <Card variant="outlined" sx={{ height: "100%" }}>
          <CardContent>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1}>
                <Skeleton variant="rounded" width={60} height={22} sx={{ borderRadius: 4 }} />
                <Skeleton variant="rounded" width={55} height={22} sx={{ borderRadius: 4 }} />
              </Stack>
              <Skeleton variant="rounded" width="80%" height={22} />
              <Skeleton variant="rounded" width="100%" height={40} />
              <Skeleton variant="rounded" width={80} height={18} />
            </Stack>
          </CardContent>
          <CardActions sx={{ px: 2, pb: 2 }}>
            <Skeleton variant="rounded" width={95} height={30} />
            <Skeleton variant="rounded" width={100} height={30} />
          </CardActions>
        </Card>
      </Grid>
    ))}
  </Grid>
);

// ── Vista previa ───────────────────────────────────────────────────────────────

interface PreviewDialogProps {
  open: boolean;
  template: PdfTemplate | null;
  pdfUrl: string | null;
  loading: boolean;
  onClose: () => void;
}

const PreviewDialog = ({ open, template, pdfUrl, loading, onClose }: PreviewDialogProps) => (
  <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
    <DialogTitle>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Typography variant="h5">{template?.name}</Typography>
        {template?.category && (
          <Chip size="small" label={template.category} color={CATEGORY_COLORS[template.category] ?? "default"} />
        )}
        <Chip
          size="small"
          label={template?.modelType === "dynamic" ? "Dinámico" : "Estático"}
          color={template?.modelType === "dynamic" ? "secondary" : "default"}
          variant="outlined"
        />
      </Stack>
    </DialogTitle>
    <DialogContent dividers>
      {loading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      ) : pdfUrl ? (
        <iframe src={pdfUrl} title={template?.name} style={{ width: "100%", height: 560, border: "none" }} />
      ) : (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
          <Typography color="textSecondary">No se pudo cargar la vista previa.</Typography>
        </Stack>
      )}
    </DialogContent>
  </Dialog>
);

// ── Tarjeta de modelo ──────────────────────────────────────────────────────────

interface ModelCardProps {
  template: PdfTemplate;
  onPreview: (t: PdfTemplate) => void;
  onUse: (t: PdfTemplate) => void;
}

const ModelCard = ({ template, onPreview, onUse }: ModelCardProps) => (
  <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
    <CardContent sx={{ flexGrow: 1 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            label={template.category}
            color={CATEGORY_COLORS[template.category] ?? "default"}
            variant="outlined"
          />
          <Chip
            size="small"
            label={template.modelType === "dynamic" ? "Dinámico" : "Estático"}
            variant="outlined"
            color={template.modelType === "dynamic" ? "secondary" : "default"}
          />
        </Stack>
        <Typography variant="subtitle1" fontWeight={600} lineHeight={1.3}>
          {template.name}
        </Typography>
        {template.description && (
          <Typography variant="body2" color="textSecondary">
            {template.description}
          </Typography>
        )}
        <Divider />
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <DocumentText size={14} style={{ opacity: 0.5 }} />
          <Typography variant="caption" color="textSecondary">
            {template.fields?.length ?? 0} campo{template.fields?.length !== 1 ? "s" : ""} completables
          </Typography>
        </Stack>
      </Stack>
    </CardContent>
    <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
      <Button
        size="small"
        variant="outlined"
        color="secondary"
        startIcon={<Eye size={15} />}
        onClick={() => onPreview(template)}
      >
        Vista previa
      </Button>
      <Button size="small" variant="contained" onClick={() => onUse(template)}>
        Usar modelo
      </Button>
    </CardActions>
  </Card>
);

// ── Section header ─────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
}

const SectionHeader = ({ icon, title, subtitle, badge }: SectionHeaderProps) => (
  <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
      <Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h5">{title}</Typography>
          {badge}
        </Stack>
        <Typography variant="body2" color="textSecondary">{subtitle}</Typography>
      </Stack>
    </Stack>
  </Stack>
);

// ── Página principal ───────────────────────────────────────────────────────────

const ModelosPage = () => {
  const theme = useTheme();
  const userId = useSelector((state: any) => state.auth?.user?._id);
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Vista previa
  const [previewTemplate, setPreviewTemplate] = useState<PdfTemplate | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Crear escrito desde modelo
  const [createFromTemplate, setCreateFromTemplate] = useState<PdfTemplate | null>(null);

  useEffect(() => {
    dispatch(fetchPdfTemplates()).then((res: any) => {
      if (res.success) setTemplates(res.templates || []);
      setLoading(false);
    });
  }, []);

  const showSnackbar = (message: string, severity: "success" | "error") => {
    dispatch(openSnackbar({ open: true, message, variant: "alert", alert: { color: severity }, close: true }));
  };

  const handlePreview = async (tpl: PdfTemplate) => {
    setPreviewTemplate(tpl);
    setPreviewUrl(null);
    setPreviewLoading(true);
    const res = await dispatch(getPdfTemplate(tpl.slug));
    if (res?.success && res.template?.previewUrl) {
      setPreviewUrl(res.template.previewUrl);
    } else {
      showSnackbar("No se pudo obtener la vista previa", "error");
    }
    setPreviewLoading(false);
  };

  // Separar modelos del sistema y del usuario
  const systemTemplates = templates.filter(
    (t) => t.source === "system" || t.isPublic || !t.userId
  );
  const userTemplates = templates.filter(
    (t) => t.source === "user" && !t.isPublic && t.userId === userId
  );

  return (
    <MainCard title="Modelos">
      {/* ── Modelos del sistema ── */}
      <SectionHeader
        icon={<Setting2 size={22} />}
        title="Modelos del sistema"
        subtitle="Plantillas predefinidas listas para usar. Pueden ser estáticas (PDF con campos fijos) o dinámicas (autocompletado con datos del sistema)."
      />

      {loading ? (
        <CardsSkeleton count={4} />
      ) : systemTemplates.length === 0 ? (
        <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ py: 6, mb: 4 }}>
          <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: "50%" }}>
            <ClipboardText size={32} style={{ color: theme.palette.text.secondary }} />
          </Box>
          <Typography color="textSecondary">No hay modelos del sistema configurados.</Typography>
        </Stack>
      ) : (
        <Grid container spacing={2.5} sx={{ mb: 5 }}>
          {systemTemplates.map((tpl) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={tpl._id}>
              <ModelCard
                template={tpl}
                onPreview={handlePreview}
                onUse={setCreateFromTemplate}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <Divider sx={{ my: 4 }} />

      {/* ── Modelos del usuario ── */}
      <SectionHeader
        icon={<ClipboardText size={22} />}
        title="Mis modelos"
        subtitle="Modelos propios creados con el editor de documentos. Podés definir campos autocompletables vinculados a carpetas, contactos u otros recursos."
        badge={
          <Chip label="En desarrollo" size="small" color="warning" variant="outlined" />
        }
      />

      <Alert
        severity="info"
        icon={<Add size={18} />}
        sx={{ mb: 3 }}
        action={
          <Button size="small" disabled>
            Crear modelo
          </Button>
        }
      >
        Próximamente podrás crear tus propios modelos con un editor WYSIWYG, definir campos dinámicos y vincularlos a tus recursos del sistema.
      </Alert>

      {userTemplates.length > 0 && (
        <Grid container spacing={2.5}>
          {userTemplates.map((tpl) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={tpl._id}>
              <ModelCard
                template={tpl}
                onPreview={handlePreview}
                onUse={setCreateFromTemplate}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Diálogos */}
      <PreviewDialog
        open={Boolean(previewTemplate)}
        template={previewTemplate}
        pdfUrl={previewUrl}
        loading={previewLoading}
        onClose={() => { setPreviewTemplate(null); setPreviewUrl(null); }}
      />

      <CreatePostalDocumentModal
        open={Boolean(createFromTemplate)}
        handleClose={() => setCreateFromTemplate(null)}
        preselectedTemplate={createFromTemplate}
        showSnackbar={showSnackbar}
      />
    </MainCard>
  );
};

export default ModelosPage;
