import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { dispatch } from "store";
import { fetchPdfTemplates, createPostalDocument } from "store/reducers/postalDocuments";
import { PdfTemplate, PdfTemplateField } from "types/postal-document";

interface Props {
  open: boolean;
  handleClose: () => void;
  prefilledTrackingId?: string | null;
  showSnackbar: (msg: string, sev: "success" | "error") => void;
}

const GROUP_LABELS: Record<string, string> = {
  destinatario: "DESTINATARIO",
  remitente: "REMITENTE",
  cuerpo: "CUERPO DEL TELEGRAMA",
  tipo: "TIPO DE COMUNICACIÓN",
};

const RADIO_OPTION_LABELS: Record<string, string> = {
  Opción1: "1 - Comunicación de renuncia",
  Opción2: "2 - Comunicación de ausencia",
  Opción3: "3 - Otro tipo de comunicación",
};

function getInitialFormValues(fields: PdfTemplateField[]): Record<string, string> {
  return fields.reduce((acc, field) => {
    acc[field.name] = "";
    return acc;
  }, {} as Record<string, string>);
}

export default function CreatePostalDocumentModal({ open, handleClose, prefilledTrackingId, showSnackbar }: Props) {
  const [step, setStep] = useState<0 | 1>(0);
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PdfTemplate | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);

  const resetState = () => {
    setStep(0);
    setSelectedTemplate(null);
    setFormValues({});
    setTitle("");
    setDescription("");
    setGenerating(false);
  };

  useEffect(() => {
    if (open) {
      setLoadingTemplates(true);
      dispatch(fetchPdfTemplates()).then((res: any) => {
        if (res.success) {
          setTemplates(res.templates || []);
        }
        setLoadingTemplates(false);
      });
    }
  }, [open]);

  const handleSelectTemplate = (template: PdfTemplate) => {
    setSelectedTemplate(template);
    setFormValues(getInitialFormValues(template.fields));
    setStep(1);
  };

  const handleBack = () => {
    setStep(0);
    setSelectedTemplate(null);
    setFormValues({});
    setTitle("");
    setDescription("");
  };

  const handleClose_ = () => {
    resetState();
    handleClose();
  };

  const handleFieldChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedTemplate) return;
    setGenerating(true);
    const result = await dispatch(
      createPostalDocument({
        pdfTemplateId: selectedTemplate._id,
        title,
        description,
        formData: formValues,
        linkedTrackingId: prefilledTrackingId || null,
      })
    );
    setGenerating(false);
    if (result.success) {
      showSnackbar("Documento generado exitosamente", "success");
      resetState();
      handleClose();
    } else {
      showSnackbar(result.error || "Error al generar", "error");
    }
  };

  // Group fields by group, maintaining order within group
  const getGroupedFields = (fields: PdfTemplateField[]) => {
    const groups: Record<string, PdfTemplateField[]> = {};
    const groupOrder: string[] = [];
    [...fields].sort((a, b) => a.order - b.order).forEach((field) => {
      if (!groups[field.group]) {
        groups[field.group] = [];
        groupOrder.push(field.group);
      }
      groups[field.group].push(field);
    });
    return { groups, groupOrder };
  };

  const renderField = (field: PdfTemplateField) => {
    if (field.type === "radio") {
      const options = field.options || [];
      return (
        <FormControl key={field.name} fullWidth sx={{ mt: 1 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
            {field.label}
            {field.required && (
              <Typography component="span" color="error" sx={{ ml: 0.25 }}>
                *
              </Typography>
            )}
          </Typography>
          <RadioGroup
            value={formValues[field.name] || ""}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          >
            {options.map((opt) => (
              <FormControlLabel
                key={opt}
                value={opt}
                control={<Radio size="small" />}
                label={RADIO_OPTION_LABELS[opt] || opt}
              />
            ))}
          </RadioGroup>
        </FormControl>
      );
    }

    if (field.type === "multiline") {
      return (
        <TextField
          key={field.name}
          label={field.label}
          required={field.required}
          placeholder={field.placeholder}
          multiline
          rows={6}
          size="small"
          fullWidth
          value={formValues[field.name] || ""}
          onChange={(e) => handleFieldChange(field.name, e.target.value)}
          sx={{ mt: 1 }}
        />
      );
    }

    if (field.type === "date") {
      return (
        <TextField
          key={field.name}
          label={field.label}
          required={field.required}
          type="date"
          size="small"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={formValues[field.name] || ""}
          onChange={(e) => handleFieldChange(field.name, e.target.value)}
          sx={{ mt: 1 }}
        />
      );
    }

    // default: text
    return (
      <TextField
        key={field.name}
        label={field.label}
        required={field.required}
        placeholder={field.placeholder}
        size="small"
        fullWidth
        value={formValues[field.name] || ""}
        onChange={(e) => handleFieldChange(field.name, e.target.value)}
        sx={{ mt: 1 }}
      />
    );
  };

  return (
    <Dialog open={open} onClose={handleClose_} maxWidth="md" fullWidth>
      <DialogTitle>
        {step === 0 ? "Seleccioná una plantilla" : `Completar formulario — ${selectedTemplate?.name}`}
      </DialogTitle>

      <DialogContent dividers>
        {step === 0 && (
          <>
            {loadingTemplates ? (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                <CircularProgress />
              </Stack>
            ) : templates.length === 0 ? (
              <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                No hay plantillas disponibles en este momento.
              </Typography>
            ) : (
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                {templates.map((tpl) => (
                  <Grid item xs={12} sm={6} md={4} key={tpl._id}>
                    <Card variant="outlined" sx={{ height: "100%" }}>
                      <CardActionArea onClick={() => handleSelectTemplate(tpl)} sx={{ height: "100%" }}>
                        <CardContent>
                          <Stack spacing={1}>
                            <Chip label={tpl.category} size="small" color="primary" variant="outlined" sx={{ alignSelf: "flex-start" }} />
                            <Typography variant="subtitle1" fontWeight={600}>
                              {tpl.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {tpl.description}
                            </Typography>
                          </Stack>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}

        {step === 1 && selectedTemplate && (
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Título del documento"
              required
              size="small"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
              label="Descripción (opcional)"
              size="small"
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Divider />

            {(() => {
              const { groups, groupOrder } = getGroupedFields(selectedTemplate.fields);
              return groupOrder.map((groupKey) => (
                <Box key={groupKey}>
                  <Typography variant="subtitle2" color="primary" sx={{ mb: 0.5 }}>
                    {GROUP_LABELS[groupKey] || groupKey.toUpperCase()}
                  </Typography>
                  <Stack spacing={1.5}>
                    {groups[groupKey].map((field) => renderField(field))}
                  </Stack>
                </Box>
              ));
            })()}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {step === 0 && (
          <Button onClick={handleClose_} color="secondary" variant="outlined">
            Cancelar
          </Button>
        )}
        {step === 1 && (
          <>
            <Button onClick={handleBack} color="secondary" variant="outlined">
              Volver
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={generating || !title.trim()}
              startIcon={generating ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              Generar documento
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
