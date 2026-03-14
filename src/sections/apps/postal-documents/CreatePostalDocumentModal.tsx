import { useEffect, useState } from "react";
import {
  Autocomplete,
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
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Profile2User, Save2 } from "iconsax-react";
import { dispatch, useSelector } from "store";
import { fetchPdfTemplates, createPostalDocument } from "store/reducers/postalDocuments";
import { getContactsByUserId, addContact, updateContact } from "store/reducers/contacts";
import { PdfTemplate, PdfTemplateField } from "types/postal-document";
import { Contact } from "types/contact";

// ── Tipos ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  handleClose: () => void;
  prefilledTrackingId?: string | null;
  showSnackbar: (msg: string, sev: "success" | "error") => void;
}

interface SaveContactDialogState {
  open: boolean;
  group: "destinatario" | "remitente" | null;
  contactType: "Humana" | "Jurídica";
  role: string;
}

// ── Constantes ───────────────────────────────────────────────────────────────

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

// Grupos que admiten selección / guardado de contacto
const CONTACT_GROUPS = ["destinatario", "remitente"];

// ── Mapeo Contact → campos del formulario ────────────────────────────────────

function contactToFormValues(
  contact: Contact,
  group: "destinatario" | "remitente"
): Record<string, string> {
  const fullName =
    group === "destinatario" && contact.type === "Jurídica"
      ? contact.company || `${contact.name} ${contact.lastName || ""}`.trim()
      : `${contact.name} ${contact.lastName || ""}`.trim();

  if (group === "destinatario") {
    return {
      dest_nombre: fullName,
      dest_ramo: contact.activity || "",
      dest_domicilio: contact.address || "",
      dest_cp: contact.zipCode || "",
      dest_localidad: contact.city || "",
      dest_provincia: contact.state || "",
    };
  }
  // remitente
  return {
    rem_nombre: fullName,
    rem_dni: contact.document || "",
    rem_domicilio: contact.address || "",
    rem_cp: contact.zipCode || "",
    rem_localidad: contact.city || "",
    rem_provincia: contact.state || "",
  };
}

// ── Mapeo campos del formulario → Contact ────────────────────────────────────

function formValuesToContact(
  values: Record<string, string>,
  group: "destinatario" | "remitente",
  contactType: "Humana" | "Jurídica",
  role: string
): Partial<Contact> {
  if (group === "destinatario") {
    const raw = values.dest_nombre || "";
    const parts = raw.trim().split(/\s+/);
    return {
      name: parts[0] || raw,
      lastName: parts.slice(1).join(" ") || "-",
      ...(contactType === "Jurídica" ? { company: raw } : {}),
      activity: values.dest_ramo || "",
      address: values.dest_domicilio || "",
      zipCode: values.dest_cp || "",
      city: values.dest_localidad || "",
      state: values.dest_provincia || "",
      type: contactType,
      role,
    };
  }
  // remitente
  const raw = values.rem_nombre || "";
  const parts = raw.trim().split(/\s+/);
  return {
    name: parts[0] || raw,
    lastName: parts.slice(1).join(" ") || "-",
    document: values.rem_dni || "",
    address: values.rem_domicilio || "",
    zipCode: values.rem_cp || "",
    city: values.rem_localidad || "",
    state: values.rem_provincia || "",
    type: contactType,
    role,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitialFormValues(fields: PdfTemplateField[]): Record<string, string> {
  return fields.reduce((acc, f) => { acc[f.name] = ""; return acc; }, {} as Record<string, string>);
}

function hasGroupData(formValues: Record<string, string>, group: "destinatario" | "remitente"): boolean {
  const prefix = group === "destinatario" ? "dest_" : "rem_";
  const nameKey = group === "destinatario" ? "dest_nombre" : "rem_nombre";
  return !!(formValues[nameKey]?.trim());
}

function getContactLabel(c: Contact): string {
  const name = `${c.name} ${c.lastName || ""}`.trim();
  const company = c.company ? ` (${c.company})` : "";
  return `${name}${company}`;
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function CreatePostalDocumentModal({
  open,
  handleClose,
  prefilledTrackingId,
  showSnackbar,
}: Props) {
  // Redux state
  const allContacts: Contact[] = useSelector((state: any) => state.contacts?.contacts || []);
  const userId = useSelector((state: any) => state.auth?.user?._id);

  // Modal state
  const [step, setStep] = useState<0 | 1>(0);
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PdfTemplate | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);

  // Contact selected per group (null = manual entry)
  const [selectedContacts, setSelectedContacts] = useState<Record<"destinatario" | "remitente", Contact | null>>({
    destinatario: null,
    remitente: null,
  });

  // Save-as-contact dialog
  const [saveDialog, setSaveDialog] = useState<SaveContactDialogState>({
    open: false,
    group: null,
    contactType: "Humana",
    role: "",
  });
  const [savingContact, setSavingContact] = useState(false);

  // ── Load templates + contacts on open ──────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    setLoadingTemplates(true);
    dispatch(fetchPdfTemplates()).then((res: any) => {
      if (res.success) setTemplates(res.templates || []);
      setLoadingTemplates(false);
    });
    if (userId && allContacts.length === 0) {
      dispatch(getContactsByUserId(userId));
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reset ─────────────────────────────────────────────────────────────────

  const resetState = () => {
    setStep(0);
    setSelectedTemplate(null);
    setFormValues({});
    setTitle("");
    setDescription("");
    setGenerating(false);
    setSelectedContacts({ destinatario: null, remitente: null });
    setSaveDialog({ open: false, group: null, contactType: "Humana", role: "" });
  };

  const handleClose_ = () => { resetState(); handleClose(); };
  const handleBack  = () => { setStep(0); setSelectedTemplate(null); setFormValues({}); setTitle(""); setDescription(""); };

  // ── Template selection ────────────────────────────────────────────────────

  const handleSelectTemplate = (tpl: PdfTemplate) => {
    setSelectedTemplate(tpl);
    setFormValues(getInitialFormValues(tpl.fields));
    setStep(1);
  };

  // ── Form field helpers ────────────────────────────────────────────────────

  const handleFieldChange = (name: string, value: string) =>
    setFormValues((prev) => ({ ...prev, [name]: value }));

  const applyContact = (contact: Contact | null, group: "destinatario" | "remitente") => {
    setSelectedContacts((prev) => ({ ...prev, [group]: contact }));
    if (contact) {
      const mapped = contactToFormValues(contact, group);
      setFormValues((prev) => ({ ...prev, ...mapped }));
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────

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

  // ── Update existing contact ───────────────────────────────────────────────

  const handleUpdateContact = async (group: "destinatario" | "remitente") => {
    const contact = selectedContacts[group];
    if (!contact?._id) return;
    setSavingContact(true);
    const contactData = formValuesToContact(formValues, group, contact.type as "Humana" | "Jurídica", Array.isArray(contact.role) ? contact.role[0] : contact.role || "");
    try {
      const result = await dispatch(updateContact(contact._id, contactData));
      if (result?.success !== false) {
        showSnackbar("Contacto actualizado exitosamente", "success");
      } else {
        showSnackbar("Error al actualizar el contacto", "error");
      }
    } catch {
      showSnackbar("Error al actualizar el contacto", "error");
    }
    setSavingContact(false);
  };

  // ── Save as contact ───────────────────────────────────────────────────────

  const openSaveDialog = (group: "destinatario" | "remitente") => {
    const defaultType: "Humana" | "Jurídica" = group === "destinatario" ? "Jurídica" : "Humana";
    const defaultRole = group === "destinatario" ? "Empleador" : "Trabajador";
    setSaveDialog({ open: true, group, contactType: defaultType, role: defaultRole });
  };

  const handleSaveContact = async () => {
    if (!saveDialog.group) return;
    setSavingContact(true);
    const contactData = formValuesToContact(
      formValues,
      saveDialog.group,
      saveDialog.contactType,
      saveDialog.role
    );
    try {
      const result = await dispatch(addContact(contactData as Contact));
      if (result?.success !== false) {
        showSnackbar("Contacto guardado exitosamente", "success");
        setSaveDialog({ open: false, group: null, contactType: "Humana", role: "" });
      } else {
        showSnackbar("Error al guardar el contacto", "error");
      }
    } catch {
      showSnackbar("Error al guardar el contacto", "error");
    }
    setSavingContact(false);
  };

  // ── Field renderer ────────────────────────────────────────────────────────

  const renderField = (field: PdfTemplateField) => {
    if (field.type === "radio") {
      return (
        <FormControl key={field.name} fullWidth sx={{ mt: 1 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
            {field.label}
            {field.required && <Typography component="span" color="error" sx={{ ml: 0.25 }}>*</Typography>}
          </Typography>
          <RadioGroup
            row
            value={formValues[field.name] || ""}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          >
            {(field.options || []).map((opt) => (
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
        />
      );
    }
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
      />
    );
  };

  // ── Group renderer ────────────────────────────────────────────────────────

  const renderGroup = (groupKey: string, fields: PdfTemplateField[]) => {
    const isContactGroup = CONTACT_GROUPS.includes(groupKey);
    const group = groupKey as "destinatario" | "remitente";
    const activeContacts = allContacts.filter((c: Contact) => c.status !== "archived");

    return (
      <Box key={groupKey}>
        {/* Group header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="subtitle2" color="primary" fontWeight={700}>
            {GROUP_LABELS[groupKey] || groupKey.toUpperCase()}
          </Typography>
          {isContactGroup && hasGroupData(formValues, group) && (
            selectedContacts[group] ? (
              <Tooltip title={`Actualizar contacto "${getContactLabel(selectedContacts[group]!)}" con los datos actuales`}>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  startIcon={savingContact ? <CircularProgress size={14} color="inherit" /> : <Save2 size={14} />}
                  onClick={() => handleUpdateContact(group)}
                  disabled={savingContact}
                  sx={{ fontSize: "0.7rem", py: 0.25 }}
                >
                  Actualizar contacto
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title={`Guardar datos de ${GROUP_LABELS[group]} como nuevo contacto`}>
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  startIcon={<Save2 size={14} />}
                  onClick={() => openSaveDialog(group)}
                  sx={{ fontSize: "0.7rem", py: 0.25 }}
                >
                  Guardar como contacto
                </Button>
              </Tooltip>
            )
          )}
        </Stack>

        {/* Contact autocomplete selector */}
        {isContactGroup && (
          <Autocomplete
            size="small"
            options={activeContacts}
            value={selectedContacts[group]}
            getOptionLabel={(c: Contact) => getContactLabel(c)}
            isOptionEqualToValue={(opt, val) => opt._id === val._id}
            renderOption={(props, c: Contact) => (
              <Box component="li" {...props} key={c._id}>
                <Stack>
                  <Typography variant="body2" fontWeight={500}>{getContactLabel(c)}</Typography>
                  {c.role && (
                    <Typography variant="caption" color="textSecondary">
                      {Array.isArray(c.role) ? c.role.join(", ") : c.role}
                      {c.city ? ` · ${c.city}` : ""}
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}
            onChange={(_e, contact) => applyContact(contact, group)}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={`Buscar contacto para ${GROUP_LABELS[group]}...`}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <Profile2User size={16} style={{ marginRight: 6, opacity: 0.5 }} />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
            sx={{ mb: 1.5 }}
            noOptionsText="Sin contactos — podés completar manualmente"
          />
        )}

        {/* Fields */}
        <Stack spacing={1.5}>
          {fields.map((field) => renderField(field))}
        </Stack>
      </Box>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Dialog open={open} onClose={handleClose_} maxWidth="md" fullWidth>
        <DialogTitle>
          {step === 0 ? "Seleccioná una plantilla" : `Completar formulario — ${selectedTemplate?.name}`}
        </DialogTitle>

        <DialogContent dividers>
          {/* ── Step 0: template selection ── */}
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
                              <Typography variant="subtitle1" fontWeight={600}>{tpl.name}</Typography>
                              <Typography variant="body2" color="textSecondary">{tpl.description}</Typography>
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

          {/* ── Step 1: form ── */}
          {step === 1 && selectedTemplate && (
            <Stack spacing={2.5} sx={{ mt: 0.5 }}>
              {/* Document metadata */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={7}>
                  <TextField
                    label="Título del documento"
                    required
                    size="small"
                    fullWidth
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField
                    label="Descripción (opcional)"
                    size="small"
                    fullWidth
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Grid>
              </Grid>

              <Divider />

              {/* Template fields grouped */}
              {(() => {
                const { groups, groupOrder } = (() => {
                  const gs: Record<string, PdfTemplateField[]> = {};
                  const go: string[] = [];
                  [...selectedTemplate.fields].sort((a, b) => a.order - b.order).forEach((f) => {
                    if (!gs[f.group]) { gs[f.group] = []; go.push(f.group); }
                    gs[f.group].push(f);
                  });
                  return { groups: gs, groupOrder: go };
                })();
                return groupOrder.map((gk) => (
                  <Box key={gk}>
                    {renderGroup(gk, groups[gk])}
                    {CONTACT_GROUPS.includes(gk) && gk !== groupOrder[groupOrder.length - 1] && (
                      <Divider sx={{ mt: 2 }} />
                    )}
                  </Box>
                ));
              })()}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          {step === 0 && (
            <Button onClick={handleClose_} color="secondary" variant="outlined">Cancelar</Button>
          )}
          {step === 1 && (
            <>
              <Button onClick={handleBack} color="secondary" variant="outlined">Volver</Button>
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

      {/* ── Save as contact dialog ── */}
      <Dialog open={saveDialog.open} onClose={() => setSaveDialog((s) => ({ ...s, open: false }))} maxWidth="xs" fullWidth>
        <DialogTitle>
          Guardar como contacto
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Los datos de{" "}
              <strong>{saveDialog.group ? GROUP_LABELS[saveDialog.group] : ""}</strong>{" "}
              se guardarán como un nuevo contacto.
            </Typography>

            {/* Preview name */}
            <TextField
              size="small"
              label="Nombre del contacto"
              disabled
              fullWidth
              value={
                saveDialog.group === "destinatario"
                  ? formValues.dest_nombre || ""
                  : formValues.rem_nombre || ""
              }
            />

            <FormControl size="small" fullWidth>
              <InputLabel>Tipo de contacto</InputLabel>
              <Select
                label="Tipo de contacto"
                value={saveDialog.contactType}
                onChange={(e) =>
                  setSaveDialog((s) => ({
                    ...s,
                    contactType: e.target.value as "Humana" | "Jurídica",
                  }))
                }
              >
                <MenuItem value="Humana">Persona física</MenuItem>
                <MenuItem value="Jurídica">Persona jurídica / Empresa</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Rol / Relación"
              fullWidth
              placeholder="Ej: Empleador, Trabajador, Cliente..."
              value={saveDialog.role}
              onChange={(e) => setSaveDialog((s) => ({ ...s, role: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setSaveDialog((s) => ({ ...s, open: false }))}
            color="secondary"
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveContact}
            variant="contained"
            disabled={savingContact || !saveDialog.role.trim()}
            startIcon={savingContact ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            Guardar contacto
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
