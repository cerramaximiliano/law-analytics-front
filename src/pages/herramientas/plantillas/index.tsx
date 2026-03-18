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
  InputAdornment,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { Add, ClipboardText, DocumentText, DocumentUpload, Eye, SearchNormal1, Setting2 } from "iconsax-react";
import MainCard from "components/MainCard";
import { dispatch, useSelector } from "store";
import { fetchPdfTemplates, getPdfTemplate } from "store/reducers/postalDocuments";
import { openSnackbar } from "store/reducers/snackbar";
import { PdfTemplate } from "types/postal-document";
import CreatePostalDocumentModal from "sections/apps/postal-documents/CreatePostalDocumentModal";
import SupportModal from "layout/MainLayout/Drawer/DrawerContent/SupportModal";

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

// ── Página principal ───────────────────────────────────────────────────────────

const ModelosPage = () => {
  const theme = useTheme();
  const userId = useSelector((state: any) => state.auth?.user?._id);
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");

  // Vista previa
  const [previewTemplate, setPreviewTemplate] = useState<PdfTemplate | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Crear escrito desde modelo
  const [createFromTemplate, setCreateFromTemplate] = useState<PdfTemplate | null>(null);

  // Solicitar nuevo modelo
  const [requestModelOpen, setRequestModelOpen] = useState(false);

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
  const systemTemplates = templates
    .filter((t) => t.source === "system" || t.isPublic || !t.userId)
    .filter((t) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q);
    });
  const userTemplates = templates.filter(
    (t) => t.source === "user" && !t.isPublic && t.userId === userId
  );

  return (
    <MainCard title="Modelos">
      <Tabs
        value={activeTab}
        onChange={(_e, v) => setActiveTab(v)}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
      >
        <Tab
          label={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Setting2 size={16} />
              <span>Modelos del sistema</span>
            </Stack>
          }
        />
        <Tab
          label={
            <Stack direction="row" alignItems="center" spacing={1}>
              <ClipboardText size={16} />
              <span>Mis modelos</span>
              <Chip label="En desarrollo" size="small" color="warning" variant="outlined" sx={{ height: 18, fontSize: "0.65rem" }} />
            </Stack>
          }
        />
      </Tabs>

      {/* ── Tab 0: Modelos del sistema ── */}
      {activeTab === 0 && (
        <>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2.5 }}>
            <Typography variant="body2" color="textSecondary">
              Plantillas predefinidas listas para usar. Pueden ser estáticas (PDF con campos fijos) o dinámicas (autocompletado con datos del sistema).
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                size="small"
                variant="outlined"
                color="secondary"
                startIcon={<DocumentUpload size={15} />}
                onClick={() => setRequestModelOpen(true)}
              >
                Solicitar modelo
              </Button>
              <TextField
                size="small"
                placeholder="Buscar modelo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ minWidth: 220 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchNormal1 size={16} style={{ opacity: 0.5 }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          </Stack>

          {loading ? (
            <CardsSkeleton count={4} />
          ) : systemTemplates.length === 0 ? (
            <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ py: 6 }}>
              <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: "50%" }}>
                <ClipboardText size={32} style={{ color: theme.palette.text.secondary }} />
              </Box>
              <Typography color="textSecondary">
                {search.trim() ? `Sin resultados para "${search}"` : "No hay modelos del sistema configurados."}
              </Typography>
            </Stack>
          ) : (
            <Grid container spacing={2.5}>
              {systemTemplates.map((tpl) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={tpl._id}>
                  <ModelCard template={tpl} onPreview={handlePreview} onUse={setCreateFromTemplate} />
                </Grid>
              ))}
              {/* Tarjeta para solicitar nuevo modelo */}
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <Card
                  variant="outlined"
                  onClick={() => setRequestModelOpen(true)}
                  sx={{
                    height: "100%",
                    minHeight: 160,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderStyle: "dashed",
                    borderColor: "primary.light",
                    cursor: "pointer",
                    transition: "border-color 0.2s, background-color 0.2s",
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: "primary.lighter",
                    },
                  }}
                >
                  <CardContent>
                    <Stack alignItems="center" spacing={1.5} sx={{ textAlign: "center" }}>
                      <Box sx={{ p: 1.5, bgcolor: "primary.lighter", borderRadius: "50%" }}>
                        <DocumentUpload size={24} color={theme.palette.primary.main} />
                      </Box>
                      <Typography variant="subtitle2" fontWeight={600} color="primary">
                        Solicitar nuevo modelo
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        ¿Tenés un PDF o DOC que querés convertir en modelo autocompletable?
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </>
      )}

      {/* ── Tab 1: Mis modelos ── */}
      {activeTab === 1 && (
        <>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2.5 }}>
            Modelos propios creados con el editor de documentos. Podés definir campos autocompletables vinculados a carpetas, contactos u otros recursos.
          </Typography>

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

          {loading ? (
            <CardsSkeleton count={2} />
          ) : userTemplates.length === 0 ? (
            <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ py: 6 }}>
              <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: "50%" }}>
                <ClipboardText size={32} style={{ color: theme.palette.text.secondary }} />
              </Box>
              <Typography color="textSecondary">Todavía no creaste ningún modelo propio.</Typography>
            </Stack>
          ) : (
            <Grid container spacing={2.5}>
              {userTemplates.map((tpl) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={tpl._id}>
                  <ModelCard template={tpl} onPreview={handlePreview} onUse={setCreateFromTemplate} />
                </Grid>
              ))}
            </Grid>
          )}
        </>
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

      <SupportModal
        open={requestModelOpen}
        onClose={() => setRequestModelOpen(false)}
        defaultSubject="Solicitud de nuevo modelo de documento"
      />
    </MainCard>
  );
};

export default ModelosPage;
