import React from "react";
import {
  Autocomplete,
  Button,
  Chip,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import * as Yup from "yup";
import { useFormik, Form, FormikProvider } from "formik";
import { useEffect } from "react";
import { dispatch, useSelector } from "store";
import { createPostalTracking, updatePostalTracking } from "store/reducers/postalTracking";
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
  tags: Yup.array().of(Yup.string()),
});

const AddEditPostalTracking = ({ tracking, onCancel, showSnackbar }: Props) => {
  const isCreating = !tracking;
  const { folders } = useSelector((state) => state.folder);
  const { user } = useSelector((state) => state.auth);

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
      tags: tracking?.tags || [],
      folderId: tracking?.folderId || "",
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
              tags: values.tags.length > 0 ? values.tags : undefined,
              folderId: values.folderId || undefined,
            })
          );
        } else {
          result = await dispatch(
            updatePostalTracking(tracking._id, {
              label: values.label || null,
              tags: values.tags,
            })
          );
        }

        if (result.success) {
          resetForm();
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
            </>
          )}

          <Grid item xs={12}>
            <Stack spacing={1}>
              <InputLabel htmlFor="label">Etiqueta (opcional)</InputLabel>
              <TextField
                fullWidth
                id="label"
                placeholder="Ej: Cédula expediente 12345/24"
                {...getFieldProps("label")}
                error={Boolean(touched.label && errors.label)}
                helperText={touched.label && errors.label}
              />
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Stack spacing={1}>
              <InputLabel htmlFor="tags">Etiquetas</InputLabel>
              <Autocomplete
                multiple
                freeSolo
                id="tags"
                options={[]}
                value={values.tags}
                onChange={(_, newValue) => setFieldValue("tags", newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Escribí y presioná Enter para agregar"
                    size="small"
                  />
                )}
              />
            </Stack>
          </Grid>

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
