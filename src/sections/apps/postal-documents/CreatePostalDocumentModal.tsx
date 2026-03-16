import { useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
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
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Profile2User, Save2 } from "iconsax-react";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import { dispatch, useSelector } from "store";
import { fetchPdfTemplates, createPostalDocument, updatePostalDocument } from "store/reducers/postalDocuments";
import { getContactsByUserId, addContact, updateContact } from "store/reducers/contacts";
import { createPostalTracking } from "store/reducers/postalTracking";
import { getFoldersByUserId } from "store/reducers/folder";
import { fetchPostalTrackings } from "store/reducers/postalTracking";
import { PdfTemplate, PdfTemplateField } from "types/postal-document";
import { Contact } from "types/contact";
import { FolderData } from "types/folder";
import { PostalTrackingType } from "types/postal-tracking";

// ── Tipos ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  handleClose: () => void;
  prefilledTrackingId?: string | null;
  preselectedTemplate?: PdfTemplate | null;
  showSnackbar: (msg: string, sev: "success" | "error") => void;
}

type ContactGroupKey = "destinatario" | "remitente" | "poderdante";

interface SaveContactDialogState {
  open: boolean;
  group: ContactGroupKey | null;
  contactType: "Humana" | "Jurídica";
  role: string;
}

// ── Constantes ───────────────────────────────────────────────────────────────

const VALID_CODE_IDS = [
  "CC","CD","CL","CM","CO","CP","DE","DI","EC","EE","EO","EP","GC","GD","GE","GF",
  "GO","GR","GS","HC","HD","HE","HO","HU","HX","IN","IS","JP","LC","LS","ND","MD",
  "ME","MC","MS","MU","MX","OL","PC","PP","RD","RE","RP","RR","SD","SL","SP","SR",
  "ST","TC","TD","TL","UP",
];

const GROUP_LABELS: Record<string, string> = {
  destinatario: "DESTINATARIO",
  remitente: "REMITENTE",
  poderdante: "PODERDANTE (quien otorga el poder)",
  apoderado: "APODERADO (letrado)",
  cuerpo: "CUERPO DEL TELEGRAMA",
  tipo: "TIPO DE COMUNICACIÓN",
};

const RADIO_OPTION_LABELS: Record<string, string> = {
  Opción1: "1 - Comunicación de renuncia",
  Opción2: "2 - Comunicación de ausencia",
  Opción3: "3 - Otro tipo de comunicación",
};

// Grupos que admiten selección / guardado de contacto
const CONTACT_GROUPS: ContactGroupKey[] = ["destinatario", "remitente", "poderdante"];

// Pares de checkboxes mutuamente excluyentes (radio behavior)
const EXCLUSIVE_CHECKBOX_PAIRS: [string, string][] = [
  ["suscribe_sexo_f", "suscribe_sexo_m"],
];

// Datos de prueba por plantilla (solo DEV)
const DEV_FILL_DATA: Record<string, { title: string; fields: Record<string, string> }> = {
  carta_poder_srt: {
    title: "Test Carta Poder SRT",
    fields: {
      suscribe_nombre:    "García Juan Carlos",
      suscribe_tipo_doc:  "DNI",
      suscribe_doc:       "30.123.456",
      suscribe_sexo_m:    "X",
      suscribe_domicilio: "Av. Corrientes 1234",
      suscribe_cp:        "1043",
      suscribe_email:     "juan@email.com",
      suscribe_telefono:  "+54 11 5555-1234",
      apoderado_nombre:     "López María Beatriz",
      apoderado_tipo_doc:   "CUIT",
      apoderado_doc:        "27-28765432-1",
      apoderado_parentesco: "Letrado apoderado",
      apoderado_matricula:  "T54 F321",
      apoderado_domicilio:  "Florida 890 piso 3",
      apoderado_cp:         "1005",
      apoderado_email:      "mlopez@estudio.com",
      apoderado_telefono:   "+54 11 4444-5678",
    },
  },
  telegrama_laboral: {
    title: "Test Telegrama Laboral",
    fields: {
      dest_nombre:    "ACME S.A.",
      dest_ramo:      "Comercio",
      dest_domicilio: "Av. Corrientes 1234",
      dest_cp:        "1043",
      dest_localidad: "Buenos Aires",
      dest_provincia: "CABA",
      rem_nombre:     "García Juan Carlos",
      rem_dni:        "30.123.456",
      rem_fecha:      "2024-03-14",
      rem_domicilio:  "Av. de Mayo 123",
      rem_cp:         "1002",
      rem_localidad:  "Buenos Aires",
      rem_provincia:  "CABA",
      cuerpo: "Por la presente me dirijo a Ud. a fin de comunicarle mi renuncia al cargo desempeñado, con efectos a partir de la fecha.",
      tipo: "Opción1",
    },
  },
  cedula_notificacion_22172: {
    title: "Test Cédula 22.172 (interjurisdiccional)",
    fields: {
      tribunal:          "Juzgado Nacional Civil Nro. 82 - Sec. 163",
      juzgado_domicilio: "Av. de los Inmigrantes 1950, CABA",
      destinatario_nombre:    "Pérez Roberto Daniel",
      destinatario_domicilio: "Corrientes 3456 Piso 2 Dto. B, Rosario",
      tipo_domicilio:         "constituido",
      caracter:       "urgente",
      observaciones:  "",
      tabla_orden:        "001",
      tabla_exp_nro:      "12345/2024",
      tabla_zona:         "1",
      tabla_fuero:        "CIV",
      tabla_juzgado:      "82",
      tabla_secretaria:   "163",
      tabla_copias:       "1",
      tabla_personal:     "",
      tabla_observaciones:"",
      expediente_caratulado: "García c/ Pérez s/ daños y perjuicios",
      resolucion:            "Córrase traslado de la demanda por el término de ley.",
      notificado_genero:     "o",
      fecha_dia:  "15",
      fecha_mes:  "marzo",
      fecha_anio: "25",
    },
  },
  cedula_notificacion_com: {
    title: "Test Cédula de Notificación Comercial",
    fields: {
      juzgado_nro:       "12",
      secretaria_nro:    "23",
      juzgado_domicilio: "Av. Corrientes 330",
      destinatario_nombre:    "Sociedad Anónima Industrial S.A.",
      destinatario_domicilio: "Av. Córdoba 1234 Piso 5, CABA",
      tipo_domicilio:         "constituido",
      caracter:       "urgente",
      observaciones:  "",
      tabla_orden:        "001",
      tabla_exp_nro:      "22567/2024",
      tabla_zona:         "1",
      tabla_fuero:        "COM",
      tabla_juzgado:      "12",
      tabla_secretaria:   "23",
      tabla_copias:       "1",
      tabla_personal:     "",
      tabla_observaciones:"",
      expediente_caratulado: "Empresa SA c/ Otra Empresa SA s/ ordinario cobro de pesos",
      resolucion:            "Córrase traslado de la demanda por el término de ley.",
      notificado_genero:     "o",
      fecha_dia:  "15",
      fecha_mes:  "marzo",
      fecha_anio: "25",
    },
  },
  cedula_notificacion: {
    title: "Test Cédula de Notificación",
    fields: {
      juzgado_nro:       "82",
      secretaria_nro:    "163",
      juzgado_domicilio: "Av. de los Inmigrantes 1950",
      destinatario_nombre:    "Pérez Roberto Daniel",
      destinatario_domicilio: "Corrientes 3456 Piso 2 Dto. B, CABA",
      tipo_domicilio:         "constituido",
      caracter:       "urgente",
      observaciones:  "Urgente. Habilitación de día y hora inhábil.",
      tabla_orden:        "001",
      tabla_exp_nro:      "12345/2024",
      tabla_zona:         "1",
      tabla_fuero:        "CIV",
      tabla_juzgado:      "82",
      tabla_secretaria:   "163",
      tabla_copias:       "1",
      tabla_personal:     "",
      tabla_observaciones:"",
      expediente_caratulado: "García Rodríguez Juan Carlos c/ Pérez Martínez Roberto Daniel s/ daños y perjuicios derivados de accidente de tránsito",
      resolucion:            "Córrase traslado de la demanda por el término de ley. Asimismo, fíjase audiencia para el día 20 de abril de 2025 a las 10:00 hs.",
      notificado_genero:     "o",
      fecha_dia:  "15",
      fecha_mes:  "marzo",
      fecha_anio: "25",
    },
  },
};

// ── Mapeo Contact → campos del formulario ────────────────────────────────────

function contactToFormValues(
  contact: Contact,
  group: ContactGroupKey
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
  if (group === "remitente") {
    return {
      rem_nombre: fullName,
      rem_dni: contact.document || "",
      rem_domicilio: contact.address || "",
      rem_cp: contact.zipCode || "",
      rem_localidad: contact.city || "",
      rem_provincia: contact.state || "",
    };
  }
  // poderdante
  return {
    suscribe_nombre: fullName,
    suscribe_doc: contact.document || "",
    suscribe_domicilio: contact.address || "",
    suscribe_cp: contact.zipCode || "",
    suscribe_email: contact.email || "",
    suscribe_telefono: contact.phone || "",
  };
}

// ── Mapeo campos del formulario → Contact ────────────────────────────────────

function formValuesToContact(
  values: Record<string, string>,
  group: ContactGroupKey,
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
  if (group === "remitente") {
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
  // poderdante
  const raw = values.suscribe_nombre || "";
  const parts = raw.trim().split(/\s+/);
  return {
    name: parts[0] || raw,
    lastName: parts.slice(1).join(" ") || "-",
    document: values.suscribe_doc || "",
    address: values.suscribe_domicilio || "",
    zipCode: values.suscribe_cp || "",
    email: values.suscribe_email || "",
    phone: values.suscribe_telefono || "",
    type: contactType,
    role,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitialFormValues(fields: PdfTemplateField[]): Record<string, string> {
  return fields.reduce((acc, f) => { acc[f.name] = ""; return acc; }, {} as Record<string, string>);
}

function hasGroupData(formValues: Record<string, string>, group: ContactGroupKey): boolean {
  const nameKey = group === "destinatario" ? "dest_nombre"
    : group === "remitente" ? "rem_nombre"
    : "suscribe_nombre";
  return !!(formValues[nameKey]?.trim());
}

/** Groups consecutive checkbox fields into sub-arrays for inline rendering */
function groupFieldsForRender(fields: PdfTemplateField[]): (PdfTemplateField | PdfTemplateField[])[] {
  const result: (PdfTemplateField | PdfTemplateField[])[] = [];
  let i = 0;
  while (i < fields.length) {
    if (fields[i].type === "checkbox") {
      const group: PdfTemplateField[] = [fields[i]];
      while (i + 1 < fields.length && fields[i + 1].type === "checkbox") {
        i++;
        group.push(fields[i]);
      }
      result.push(group);
    } else {
      result.push(fields[i]);
    }
    i++;
  }
  return result;
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
  preselectedTemplate,
  showSnackbar,
}: Props) {
  // Redux state
  const allContacts: Contact[] = useSelector((state: any) => state.contacts?.contacts || []);
  const allFolders: FolderData[] = useSelector((state: any) => state.folder?.folders || []);
  const allTrackings: PostalTrackingType[] = useSelector((state: any) => state.postalTracking?.trackings || []);
  const userId = useSelector((state: any) => state.auth?.user?._id);
  const user = useSelector((state: any) => state.auth?.user);

  // Modal state
  const [step, setStep] = useState<0 | 1>(0);
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PdfTemplate | null>(null);
  const [templateTab, setTemplateTab] = useState<0 | 1>(0);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);

  // Linking — carpeta
  const [linkedFolder, setLinkedFolder] = useState<FolderData | null>(null);

  // Linking — seguimiento: modo "vincular existente" vs "crear nuevo"
  const [trackingMode, setTrackingMode] = useState<"link" | "create">("link");
  const [linkedTracking, setLinkedTracking] = useState<PostalTrackingType | null>(null);
  const [newTrackingCodeId, setNewTrackingCodeId] = useState("TC");
  const [newTrackingNumberId, setNewTrackingNumberId] = useState("");
  const [newTrackingLabel, setNewTrackingLabel] = useState("");

  // Contact selected per group (null = manual entry)
  const [selectedContacts, setSelectedContacts] = useState<Record<ContactGroupKey, Contact | null>>({
    destinatario: null,
    remitente: null,
    poderdante: null,
  });

  // Save-as-contact dialog
  const [saveDialog, setSaveDialog] = useState<SaveContactDialogState>({
    open: false,
    group: null,
    contactType: "Humana",
    role: "",
  });
  const [savingContact, setSavingContact] = useState(false);

  // Limit error modal
  const [limitErrorOpen, setLimitErrorOpen] = useState(false);
  const [limitErrorMessage, setLimitErrorMessage] = useState("");
  const [limitErrorInfo, setLimitErrorInfo] = useState<any>(null);

  // ── Load templates + contacts on open ──────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    // Si viene una plantilla preseleccionada, saltar al paso 1 directamente
    if (preselectedTemplate) {
      setSelectedTemplate(preselectedTemplate);
      setFormValues(getInitialFormValues(preselectedTemplate.fields));
      setStep(1);
    } else {
      setLoadingTemplates(true);
      dispatch(fetchPdfTemplates()).then((res: any) => {
        if (res.success) setTemplates(res.templates || []);
        setLoadingTemplates(false);
      });
    }
    if (userId && allContacts.length === 0) {
      dispatch(getContactsByUserId(userId));
    }
    if (userId && allFolders.length === 0) {
      dispatch(getFoldersByUserId(userId) as any);
    }
    if (allTrackings.length === 0) {
      dispatch(fetchPostalTrackings({ limit: 200 }) as any);
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
    setLinkedFolder(null);
    setTrackingMode("link");
    setLinkedTracking(null);
    setNewTrackingCodeId("TC");
    setNewTrackingNumberId("");
    setNewTrackingLabel("");
    setSelectedContacts({ destinatario: null, remitente: null, poderdante: null });
    setSaveDialog({ open: false, group: null, contactType: "Humana", role: "" });
    setTemplateTab(0);
  };

  const handleClose_ = () => { resetState(); handleClose(); };
  const handleBack  = () => {
    setStep(0);
    setSelectedTemplate(null);
    setFormValues({});
    setTitle("");
    setDescription("");
    setLinkedFolder(null);
    setTrackingMode("link");
    setLinkedTracking(null);
    setNewTrackingCodeId("TC");
    setNewTrackingNumberId("");
    setNewTrackingLabel("");
  };

  // ── Template selection ────────────────────────────────────────────────────

  const handleSelectTemplate = (tpl: PdfTemplate) => {
    setSelectedTemplate(tpl);
    setFormValues(getInitialFormValues(tpl.fields));
    setStep(1);
  };

  // ── Form field helpers ────────────────────────────────────────────────────

  const handleFieldChange = (name: string, value: string) =>
    setFormValues((prev) => {
      const updated = { ...prev, [name]: value };
      // Mutual exclusion for paired checkboxes
      if (value === "X") {
        for (const pair of EXCLUSIVE_CHECKBOX_PAIRS) {
          if (pair.includes(name)) {
            for (const other of pair) {
              if (other !== name) updated[other] = "";
            }
          }
        }
      }
      return updated;
    });

  const applyContact = (contact: Contact | null, group: ContactGroupKey) => {
    setSelectedContacts((prev) => ({ ...prev, [group]: contact }));
    if (contact) {
      const mapped = contactToFormValues(contact, group);
      setFormValues((prev) => ({ ...prev, ...mapped }));
    }
  };

  const applyUserToApoderado = () => {
    if (!user) return;
    const skill = user.skill?.[0];
    const fullName = `${user.lastName || ""} ${user.firstName || user.name || ""}`.trim();
    setFormValues((prev) => ({
      ...prev,
      apoderado_nombre: fullName,
      apoderado_tipo_doc: skill?.taxCode ? "CUIT" : "",
      apoderado_doc: skill?.taxCode ? String(skill.taxCode) : "",
      apoderado_matricula: skill?.registrationNumber || "",
      apoderado_domicilio: user.address || "",
      apoderado_cp: user.zipCode || "",
      apoderado_email: user.email || "",
      apoderado_telefono: user.contact || user.phone || "",
    }));
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const newTrackingNumberIdValid = /^\d{9}$/.test(newTrackingNumberId);
  const willCreateTracking =
    selectedTemplate?.supportsTracking &&
    !prefilledTrackingId &&
    !linkedTracking &&
    trackingMode === "create" &&
    newTrackingNumberIdValid;

  const handleSubmit = async () => {
    if (!selectedTemplate) return;
    setGenerating(true);

    const result = await dispatch(
      createPostalDocument({
        pdfTemplateId: selectedTemplate._id,
        title,
        description,
        formData: formValues,
        linkedTrackingId: prefilledTrackingId || linkedTracking?._id || null,
        linkedFolderId: linkedFolder?._id || null,
      })
    );

    if (result.success && willCreateTracking) {
      const docId = result.document?._id;
      const trackingResult = await dispatch(
        createPostalTracking({
          codeId: newTrackingCodeId,
          numberId: newTrackingNumberId,
          label: newTrackingLabel || title,
          documentId: docId,
          ...(linkedFolder?._id ? { folderId: linkedFolder._id } : {}),
        }) as any
      );
      if (trackingResult?.id && docId) {
        await dispatch(updatePostalDocument(docId, { linkedTrackingId: trackingResult.id }) as any);
      }
    }

    setGenerating(false);
    if (result.success) {
      showSnackbar("Documento generado exitosamente", "success");
      resetState();
      handleClose();
    } else if ((result as any).limitInfo) {
      setLimitErrorMessage(result.error || "Has alcanzado el límite de escritos para tu plan actual");
      setLimitErrorInfo((result as any).limitInfo);
      setLimitErrorOpen(true);
    } else {
      showSnackbar(result.error || "Error al generar", "error");
    }
  };

  // ── Update existing contact ───────────────────────────────────────────────

  const handleUpdateContact = async (group: ContactGroupKey) => {
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

  const openSaveDialog = (group: ContactGroupKey) => {
    const defaultType: "Humana" | "Jurídica" = group === "destinatario" ? "Jurídica" : "Humana";
    const defaultRole = group === "destinatario" ? "Empleador"
      : group === "remitente" ? "Trabajador" : "Poderdante";
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
    if (field.type === "checkbox") {
      return (
        <FormControlLabel
          key={field.name}
          control={
            <Checkbox
              size="small"
              checked={formValues[field.name] === "X"}
              onChange={(e) => handleFieldChange(field.name, e.target.checked ? "X" : "")}
            />
          }
          label={field.label}
        />
      );
    }
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
    const isContactGroup = (CONTACT_GROUPS as string[]).includes(groupKey);
    const group = groupKey as ContactGroupKey;
    const activeContacts = allContacts.filter((c: Contact) => c.status !== "archived");

    // ── Apoderado: auto-fill from user profile ────────────────────────────────
    if (groupKey === "apoderado") {
      return (
        <Box key={groupKey}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" color="primary" fontWeight={700}>
              {GROUP_LABELS[groupKey]}
            </Typography>
            <Tooltip title="Completar automáticamente con tus datos profesionales del perfil">
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<Profile2User size={14} />}
                onClick={applyUserToApoderado}
                sx={{ fontSize: "0.7rem", py: 0.25 }}
              >
                Mis datos
              </Button>
            </Tooltip>
          </Stack>
          <Stack spacing={1.5}>
            {groupFieldsForRender(fields).map((item, i) =>
              Array.isArray(item) ? (
                <Stack key={i} direction="row" flexWrap="wrap" useFlexGap>
                  {item.map((f) => renderField(f))}
                </Stack>
              ) : (
                renderField(item)
              )
            )}
          </Stack>
        </Box>
      );
    }

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
              <Tooltip title={`Guardar datos de ${GROUP_LABELS[group] || group} como nuevo contacto`}>
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
            value={selectedContacts[group] ?? null}
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
                placeholder={`Buscar contacto para ${GROUP_LABELS[group] || group}...`}
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

        {/* Fields — consecutive checkboxes are grouped inline */}
        <Stack spacing={1.5}>
          {groupFieldsForRender(fields).map((item, i) =>
            Array.isArray(item) ? (
              <Stack key={i} direction="row" flexWrap="wrap" useFlexGap>
                {item.map((f) => renderField(f))}
              </Stack>
            ) : (
              renderField(item)
            )
          )}
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
              ) : (
                <>
                  <Tabs
                    value={templateTab}
                    onChange={(_e, v) => setTemplateTab(v)}
                    sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
                  >
                    <Tab label="Modelos del sistema" />
                    <Tab label="Mis modelos" />
                  </Tabs>
                  {(() => {
                    const filtered = templates.filter((t) =>
                      templateTab === 0 ? t.source !== "user" : t.source === "user"
                    );
                    if (filtered.length === 0) {
                      return (
                        <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                          {templateTab === 0
                            ? "No hay modelos del sistema disponibles."
                            : "Todavía no creaste ningún modelo propio."}
                        </Typography>
                      );
                    }
                    return (
                      <Grid container spacing={2}>
                        {filtered.map((tpl) => (
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
                    );
                  })()}
                </>
              )}
            </>
          )}

          {/* ── Step 1: form ── */}
          {step === 1 && selectedTemplate && (
            <Stack spacing={2.5} sx={{ mt: 0.5 }}>
              {/* Document metadata */}
              <Grid container spacing={2} alignItems="center">
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
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Descripción (opcional)"
                    size="small"
                    fullWidth
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Grid>
                {import.meta.env.DEV && selectedTemplate.slug && DEV_FILL_DATA[selectedTemplate.slug] && (
                  <Grid item xs={12} sm={1}>
                    <Tooltip title="[DEV] Rellenar todos los campos con datos de prueba">
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        fullWidth
                        onClick={() => {
                          const dev = DEV_FILL_DATA[selectedTemplate!.slug!];
                          setFormValues((prev) => ({ ...prev, ...dev.fields }));
                          if (!title) setTitle(dev.title);
                        }}
                        sx={{ fontSize: "0.65rem", py: 0.75, whiteSpace: "nowrap" }}
                      >
                        DEV Fill
                      </Button>
                    </Tooltip>
                  </Grid>
                )}
              </Grid>

              <Divider />

              {/* Template fields grouped */}
              {(() => {
                const { groups, groupOrder } = (() => {
                  const gs: Record<string, PdfTemplateField[]> = {};
                  const go: string[] = [];
                  [...selectedTemplate.fields].sort((a, b) => a.order - b.order).forEach((f) => {
                    // Skip internal rendering fields (not user-facing)
                    if (f.group === '__system' || f.type === 'flow-section') return;
                    if (!gs[f.group]) { gs[f.group] = []; go.push(f.group); }
                    gs[f.group].push(f);
                  });
                  return { groups: gs, groupOrder: go };
                })();
                return groupOrder.map((gk) => (
                  <Box key={gk}>
                    {renderGroup(gk, groups[gk])}
                    {CONTACT_GROUPS.includes(gk as ContactGroupKey) && gk !== groupOrder[groupOrder.length - 1] && (
                      <Divider sx={{ mt: 2 }} />
                    )}
                  </Box>
                ));
              })()}

              {/* ── Vincular ── */}
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mb: 1.5 }}>
                  VINCULAR (opcional)
                </Typography>
                <Stack spacing={1.5}>
                  <Autocomplete
                    size="small"
                    options={allFolders.filter((f) => f.status !== "archived")}
                    value={linkedFolder}
                    getOptionLabel={(f: FolderData) => f.folderName || f.folderId || ""}
                    isOptionEqualToValue={(opt, val) => opt._id === val._id}
                    onChange={(_e, val) => setLinkedFolder(val)}
                    renderOption={(props, f: FolderData) => (
                      <Box component="li" {...props} key={f._id}>
                        <Stack>
                          <Typography variant="body2" fontWeight={500}>{f.folderName}</Typography>
                          {f.folderFuero && (
                            <Typography variant="caption" color="textSecondary">{f.folderFuero}</Typography>
                          )}
                        </Stack>
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField {...params} label="Vincular con carpeta" placeholder="Buscar carpeta..." />
                    )}
                    noOptionsText="Sin carpetas disponibles"
                  />
                  {selectedTemplate.supportsTracking && !prefilledTrackingId && (
                    <Box>
                      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                        <Button
                          size="small"
                          variant={trackingMode === "link" ? "contained" : "outlined"}
                          onClick={() => setTrackingMode("link")}
                          sx={{ fontSize: "0.7rem" }}
                        >
                          Vincular existente
                        </Button>
                        <Button
                          size="small"
                          variant={trackingMode === "create" ? "contained" : "outlined"}
                          onClick={() => setTrackingMode("create")}
                          sx={{ fontSize: "0.7rem" }}
                        >
                          Crear seguimiento
                        </Button>
                      </Stack>

                      {trackingMode === "link" && (
                        <Autocomplete
                          size="small"
                          options={allTrackings}
                          value={linkedTracking}
                          getOptionLabel={(t: PostalTrackingType) => t.label || `${t.codeId} ${t.numberId}`.trim()}
                          isOptionEqualToValue={(opt, val) => opt._id === val._id}
                          onChange={(_e, val) => setLinkedTracking(val)}
                          renderOption={(props, t: PostalTrackingType) => (
                            <Box component="li" {...props} key={t._id}>
                              <Stack>
                                <Typography variant="body2" fontWeight={500}>
                                  {t.label || `${t.codeId} ${t.numberId}`}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {t.trackingStatus || t.processingStatus}
                                </Typography>
                              </Stack>
                            </Box>
                          )}
                          renderInput={(params) => (
                            <TextField {...params} label="Buscar seguimiento..." placeholder="Buscar seguimiento..." />
                          )}
                          noOptionsText="Sin seguimientos disponibles"
                        />
                      )}

                      {trackingMode === "create" && (
                        <Stack spacing={1.5}>
                          <Stack direction="row" spacing={1.5}>
                            <FormControl size="small" sx={{ minWidth: 80 }}>
                              <InputLabel>Prefijo</InputLabel>
                              <Select
                                label="Prefijo"
                                value={newTrackingCodeId}
                                onChange={(e) => setNewTrackingCodeId(e.target.value)}
                              >
                                {VALID_CODE_IDS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                              </Select>
                            </FormControl>
                            <TextField
                              size="small"
                              label="Número (9 dígitos)"
                              fullWidth
                              value={newTrackingNumberId}
                              onChange={(e) => setNewTrackingNumberId(e.target.value.replace(/\D/g, "").slice(0, 9))}
                              error={newTrackingNumberId.length > 0 && !newTrackingNumberIdValid}
                              helperText={newTrackingNumberId.length > 0 && !newTrackingNumberIdValid ? "9 dígitos exactos" : ""}
                              inputProps={{ inputMode: "numeric" }}
                            />
                          </Stack>
                          <TextField
                            size="small"
                            label="Etiqueta del seguimiento (opcional)"
                            fullWidth
                            value={newTrackingLabel}
                            placeholder={title || "Se usará el título del documento"}
                            onChange={(e) => setNewTrackingLabel(e.target.value)}
                          />
                        </Stack>
                      )}
                    </Box>
                  )}
                  {prefilledTrackingId && selectedTemplate.supportsTracking && (
                    <Typography variant="caption" color="textSecondary">
                      Seguimiento postal vinculado automáticamente.
                    </Typography>
                  )}
                </Stack>
              </Box>
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
                saveDialog.group === "destinatario" ? formValues.dest_nombre || ""
                : saveDialog.group === "remitente" ? formValues.rem_nombre || ""
                : formValues.suscribe_nombre || ""
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

      <LimitErrorModal
        open={limitErrorOpen}
        onClose={() => setLimitErrorOpen(false)}
        message={limitErrorMessage}
        limitInfo={limitErrorInfo}
        upgradeRequired
      />
    </>
  );
}
