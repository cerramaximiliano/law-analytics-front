import { useEffect, useState } from "react";
import {
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
import { ClipboardText, DocumentText, Eye } from "iconsax-react";

import MainCard from "components/MainCard";
import { dispatch } from "store";
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

const CardsSkeleton = () => (
  <Grid container spacing={2.5}>
    {Array(4).fill(0).map((_, i) => (
      <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
        <Card variant="outlined" sx={{ height: "100%" }}>
          <CardContent>
            <Stack spacing={1.5}>
              <Skeleton variant="rounded" width={72} height={22} sx={{ borderRadius: 4 }} />
              <Skeleton variant="rounded" width="80%" height={22} />
              <Skeleton variant="rounded" width="100%" height={40} />
              <Skeleton variant="rounded" width={60} height={18} />
            </Stack>
          </CardContent>
          <CardActions sx={{ px: 2, pb: 2 }}>
            <Skeleton variant="rounded" width={90} height={30} />
            <Skeleton variant="rounded" width={110} height={30} />
          </CardActions>
        </Card>
      </Grid>
    ))}
  </Grid>
);

// ── Preview dialog ─────────────────────────────────────────────────────────────

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
          <Chip
            size="small"
            label={template.category}
            color={CATEGORY_COLORS[template.category] ?? "default"}
          />
        )}
      </Stack>
    </DialogTitle>
    <DialogContent dividers>
      {loading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      ) : pdfUrl ? (
        <iframe
          src={pdfUrl}
          title={template?.name}
          style={{ width: "100%", height: 560, border: "none" }}
        />
      ) : (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
          <Typography color="textSecondary">No se pudo cargar la vista previa.</Typography>
        </Stack>
      )}
    </DialogContent>
  </Dialog>
);

// ── Página principal ───────────────────────────────────────────────────────────

const PlantillasPage = () => {
  const theme = useTheme();
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Vista previa
  const [previewTemplate, setPreviewTemplate] = useState<PdfTemplate | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Crear documento desde plantilla
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

  const handleClosePreview = () => {
    setPreviewTemplate(null);
    setPreviewUrl(null);
  };

  return (
    <MainCard title="Plantillas de documentos">
      {loading ? (
        <CardsSkeleton />
      ) : templates.length === 0 ? (
        <Stack alignItems="center" justifyContent="center" spacing={2.5} sx={{ py: 8 }}>
          <Box sx={{ p: 2.5, bgcolor: "primary.lighter", borderRadius: "50%" }}>
            <ClipboardText size={40} variant="Bulk" style={{ color: theme.palette.primary.main }} />
          </Box>
          <Stack alignItems="center" spacing={1}>
            <Typography variant="h5" color="textSecondary">Sin plantillas disponibles</Typography>
            <Typography variant="body2" color="textSecondary" align="center" sx={{ maxWidth: 360 }}>
              No hay plantillas configuradas en este momento.
            </Typography>
          </Stack>
        </Stack>
      ) : (
        <Grid container spacing={2.5}>
          {templates.map((tpl) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={tpl._id}>
              <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Chip
                        size="small"
                        label={tpl.category}
                        color={CATEGORY_COLORS[tpl.category] ?? "default"}
                        variant="outlined"
                      />
                    </Stack>
                    <Typography variant="subtitle1" fontWeight={600} lineHeight={1.3}>
                      {tpl.name}
                    </Typography>
                    {tpl.description && (
                      <Typography variant="body2" color="textSecondary">
                        {tpl.description}
                      </Typography>
                    )}
                    <Divider />
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <DocumentText size={14} style={{ opacity: 0.5 }} />
                      <Typography variant="caption" color="textSecondary">
                        {tpl.fields?.length ?? 0} campo{tpl.fields?.length !== 1 ? "s" : ""} completables
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
                    onClick={() => handlePreview(tpl)}
                  >
                    Vista previa
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => setCreateFromTemplate(tpl)}
                  >
                    Usar plantilla
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <PreviewDialog
        open={Boolean(previewTemplate)}
        template={previewTemplate}
        pdfUrl={previewUrl}
        loading={previewLoading}
        onClose={handleClosePreview}
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

export default PlantillasPage;
