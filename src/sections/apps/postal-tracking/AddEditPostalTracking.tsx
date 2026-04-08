import React, { useRef } from "react";
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { CloseCircle, DocumentUpload, InfoCircle } from "iconsax-react";
import * as Yup from "yup";
import { useFormik, Form, FormikProvider } from "formik";
import { useEffect, useState } from "react";
import { dispatch, useSelector } from "store";
import { createPostalTracking, updatePostalTracking, uploadAttachment } from "store/reducers/postalTracking";
import { getFoldersByUserId } from "store/reducers/folder";
import { Add } from "iconsax-react";
import { PostalTrackingType } from "types/postal-tracking";

const VALID_CODE_IDS = [
  "CC", "CD", "CL", "CM", "CO", "CP", "DE", "DI", "EC", "EE", "EO", "EP",
  "GC", "GD", "GE", "GF", "GO", "GR", "GS", "HC", "HD", "HE", "HO", "HU",
  "HX", "IN", "IS", "JP", "LC", "LS", "ND", "MD", "ME", "MC", "MS", "MU",
  "MX", "OL", "PC", "PP", "RD", "RE", "RP", "RR", "SD", "SL", "SP", "SR",
  "ST", "TC", "TD", "TL", "UP",
];

interface Props {
  tracking?: PostalTrackingType;
  onCancel: () => void;
  showSnackbar: (message: string, severity: "success" | "error") => void;
}

const CreateSchema = Yup.object().shape({
  codeId: Yup.string().required("El tipo de envío es requerido"),
  numberId: Yup.string()
    .matches(/^\d{9}$/, "Debe tener exactamente 9 dígitos numéricos")
    .required("El número de envío es requerido"),
  label: Yup.string(),
  folderId: Yup.string(),
});

const EditSchema = Yup.object().shape({
  label: Yup.string(),
});

const AddEditPostalTracking = ({ tracking, onCancel, showSnackbar }: Props) => {
  const isCreating = !tracking;
  const { folders } = useSelector((state) => state.folder);
  const { user } = useSelector((state) => state.auth);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (folders.length === 0 && user?._id) {
      dispatch(getFoldersByUserId(user._id));
    }
  }, [folders.length, user?._id]);

  const formik = useFormik({
    initialValues: {
      codeId: tracking?.codeId || "CD",
      numberId: tracking?.numberId || "",
      label: tracking?.label || "",
      folderId: tracking?.folderId || "",
      screenshotEnabled: false,
    },
    validationSchema: isCreating ? CreateSchema : EditSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        let result;
        if (isCreating) {
          result = await dispatch(
            createPostalTracking({
              codeId: values.codeId,
              numberId: values.numberId,
              label: values.label || undefined,
              folderId: values.folderId || undefined,
              screenshotEnabled: values.screenshotEnabled,
            })
          );
        } else {
          result = await dispatch(
            updatePostalTracking(tracking._id, {
              label: values.label || null,
            })
          );
        }

        if (result.success) {
          // Subir adjunto si hay archivo seleccionado
          const uploadId = isCreating ? (result as any).id : tracking?._id;
          if (attachmentFile && uploadId) {
            const uploadResult = await dispatch(uploadAttachment(uploadId, attachmentFile));
            if (!uploadResult.success) {
              showSnackbar(
                (isCreating ? "Seguimiento creado" : "Seguimiento actualizado") +
                  ", pero falló la subida del adjunto: " + (uploadResult.error || ""),
                "error"
              );
              resetForm();
              setAttachmentFile(null);
              onCancel();
              return;
            }
          }
          resetForm();
          setAttachmentFile(null);
          onCancel();
          showSnackbar(
            isCreating ? "Seguimiento creado exitosamente" : "Seguimiento actualizado exitosamente",
            "success"
          );
        } else {
          showSnackbar(result.error || "Error al procesar el seguimiento", "error");
        }
      } catch {
        showSnackbar("Error al procesar el seguimiento", "error");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const { errors, touched, values, isSubmitting, handleSubmit, getFieldProps, setFieldValue } = formik;

  return (
    <FormikProvider value={formik}>
      <Form autoComplete="off" noValidate onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {isCreating && (
            <>
              <Grid item xs={12} sm={4}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="codeId">Tipo de envío</InputLabel>
                  <FormControl fullWidth error={Boolean(touched.codeId && errors.codeId)}>
                    <Select id="codeId" {...getFieldProps("codeId")}>
                      {VALID_CODE_IDS.map((code) => (
                        <MenuItem key={code} value={code}>
                          {code}
                        </MenuItem>
                      ))}
                    </Select>
                    {touched.codeId && errors.codeId && (
                      <FormHelperText>{errors.codeId}</FormHelperText>
                    )}
                  </FormControl>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={8}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="numberId">Número de envío (9 dígitos)</InputLabel>
                  <TextField
                    fullWidth
                    id="numberId"
                    placeholder="123456789"
                    inputProps={{ maxLength: 9 }}
                    {...getFieldProps("numberId")}
                    error={Boolean(touched.numberId && errors.numberId)}
                    helperText={touched.numberId && errors.numberId}
                  />
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="folderId">Carpeta vinculada (opcional)</InputLabel>
                  <FormControl fullWidth>
                    <Select
                      id="folderId"
                      {...getFieldProps("folderId")}
                      displayEmpty
                      renderValue={(selected) => {
                        if (!selected) return <em style={{ color: "#919EAB" }}>Sin carpeta vinculada</em>;
                        const f = folders?.find((f: any) => f._id === selected);
                        return f ? f.folderName : "";
                      }}
                    >
                      <MenuItem value=""><em>Sin carpeta vinculada</em></MenuItem>
                      {folders?.map((folder: any) => (
                        <MenuItem key={folder._id} value={folder._id}>
                          {folder.folderName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" alignItems="center" justifyContent="space-between"
                  sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, px: 2, py: 1.5 }}
                >
                  <Stack spacing={0.25}>
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <Typography variant="body2" fontWeight={500}>Captura de pantalla</Typography>
                      <Tooltip title="Si está activado, el sistema tomará una captura de pantalla del estado del envío en el sitio del Correo Argentino.">
                        <InfoCircle size={15} style={{ cursor: "help", opacity: 0.5 }} />
                      </Tooltip>
                    </Stack>
                    <Typography variant="caption" color="textSecondary">
                      Guardar imagen del estado del envío
                    </Typography>
                  </Stack>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={values.screenshotEnabled}
                        onChange={(e) => setFieldValue("screenshotEnabled", e.target.checked)}
                        size="small"
                      />
                    }
                    label=""
                    sx={{ m: 0 }}
                  />
                </Stack>
              </Grid>

            </>
          )}

          <Grid item xs={12}>
            <Stack spacing={1}>
              <InputLabel htmlFor="label">Etiqueta (opcional)</InputLabel>
              <TextField
                fullWidth
                id="label"
                placeholder="Ej: Telegrama TCL 1234/2026"
                {...getFieldProps("label")}
                error={Boolean(touched.label && errors.label)}
                helperText={
                  (touched.label && errors.label) ||
                  "Usá la etiqueta para identificar, filtrar y ordenar los seguimientos en la tabla."
                }
              />
            </Stack>
          </Grid>

          {tracking?.processingStatus !== "not_found" && (
            <Grid item xs={12}>
              <Stack spacing={1}>
                <InputLabel>Adjunto {tracking?.attachmentKey ? "(reemplazar)" : "(opcional)"}</InputLabel>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setAttachmentFile(file);
                    e.target.value = "";
                  }}
                />
                {attachmentFile ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      px: 1.5,
                      py: 1,
                    }}
                  >
                    <DocumentUpload size={16} style={{ opacity: 0.6, flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {attachmentFile.name}
                    </Typography>
                    <IconButton size="small" onClick={() => setAttachmentFile(null)} sx={{ p: 0.25 }}>
                      <CloseCircle size={16} />
                    </IconButton>
                  </Box>
                ) : (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DocumentUpload size={16} />}
                      onClick={() => fileInputRef.current?.click()}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      {tracking?.attachmentKey ? "Cambiar adjunto" : "Adjuntar imagen o PDF"}
                    </Button>
                    {tracking?.attachmentKey && (
                      <Typography variant="caption" color="success.main">
                        Tiene adjunto cargado
                      </Typography>
                    )}
                  </Stack>
                )}
                <Typography variant="caption" color="textSecondary">
                  JPG, PNG, WEBP o PDF · Máx. 10 MB
                </Typography>
              </Stack>
            </Grid>
          )}


          <Grid item xs={12}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button color="error" onClick={onCancel}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={isCreating ? <Add /> : null}
              >
                {isCreating ? "Crear seguimiento" : "Actualizar"}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Form>
    </FormikProvider>
  );
};

export default AddEditPostalTracking;
