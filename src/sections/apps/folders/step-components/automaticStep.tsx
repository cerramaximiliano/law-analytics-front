import { Grid, Stack, InputLabel, DialogContent, Typography, Alert, MenuItem, Select, FormControl, SelectChangeEvent } from "@mui/material";
import { DocumentUpload } from "iconsax-react";
import { useTheme } from "@mui/material/styles";
import { useFormikContext } from "formik";
import InputField from "components/UI/InputField";
import { useState, useEffect, useRef } from "react";

const customInputStyles = {
  "& .MuiInputBase-root": {
    height: 39.91,
  },
  "& .MuiInputBase-input": {
    fontSize: 12,
  },
  "& input::placeholder": {
    color: "#000000",
    opacity: 0.6,
  },
};

// Lista de jurisdicciones del Poder Judicial de la Nación
const jurisdicciones = [
  {
    "value": "",
    "nombre": "Seleccione una jurisdicción"
  },
  {
    "value": "0",
    "nombre": "CSJ - Corte Suprema de Justicia de la Nación"
  },
  {
    "value": "1",
    "nombre": "CIV - Cámara Nacional de Apelaciones en lo Civil"
  },
  {
    "value": "2",
    "nombre": "CAF - Cámara Nacional de Apelaciones en lo Contencioso Administrativo Federal"
  },
  {
    "value": "3",
    "nombre": "CCF - Cámara Nacional de Apelaciones en lo Civil y Comercial Federal"
  },
  {
    "value": "4",
    "nombre": "CNE - Cámara Nacional Electoral"
  },
  {
    "value": "5",
    "nombre": "CSS - Camara Federal de la Seguridad Social"
  },
  {
    "value": "6",
    "nombre": "CPE - Cámara Nacional de Apelaciones en lo Penal Económico"
  },
  {
    "value": "7",
    "nombre": "CNT - Cámara Nacional de Apelaciones del Trabajo"
  },
  {
    "value": "8",
    "nombre": "CFP - Camara Criminal y Correccional Federal"
  },
  {
    "value": "9",
    "nombre": "CCC - Camara Nacional de Apelaciones en lo Criminal y Correccional"
  },
  {
    "value": "10",
    "nombre": "COM - Camara Nacional de Apelaciones en lo Comercial"
  },
  {
    "value": "11",
    "nombre": "CPF - Camara Federal de Casación Penal"
  },
  {
    "value": "12",
    "nombre": "CPN - Camara Nacional Casacion Penal"
  },
  {
    "value": "13",
    "nombre": "FBB - Justicia Federal de Bahia Blanca"
  },
  {
    "value": "14",
    "nombre": "FCR - Justicia Federal de Comodoro Rivadavia"
  },
  {
    "value": "15",
    "nombre": "FCB - Justicia Federal de Córdoba"
  },
  {
    "value": "16",
    "nombre": "FCT - Justicia Federal de Corrientes"
  },
  {
    "value": "17",
    "nombre": "FGR - Justicia Federal de General Roca"
  },
  {
    "value": "18",
    "nombre": "FLP - Justicia Federal de La Plata"
  },
  {
    "value": "19",
    "nombre": "FMP - Justicia Federal de Mar del Plata"
  },
  {
    "value": "20",
    "nombre": "FMZ - Justicia Federal de Mendoza"
  },
  {
    "value": "21",
    "nombre": "FPO - Justicia Federal de Posadas"
  },
  {
    "value": "22",
    "nombre": "FPA - Justicia Federal de Paraná"
  },
  {
    "value": "23",
    "nombre": "FRE - Justicia Federal de Resistencia"
  },
  {
    "value": "24",
    "nombre": "FSA - Justicia Federal de Salta"
  },
  {
    "value": "25",
    "nombre": "FRO - Justicia Federal de Rosario"
  },
  {
    "value": "26",
    "nombre": "FSM - Justicia Federal de San Martin"
  },
  {
    "value": "27",
    "nombre": "FTU - Justicia Federal de Tucuman"
  }
];

interface FormValues {
  folderJuris?: string;
  folderJurisItem?: string;
  folderJurisLabel?: string;
  expedientNumber?: string;
  expedientYear?: string;
  folderName?: string;
  materia?: string;
  orderStatus?: string;
  status?: string;
  description?: string;
  folderFuero?: string;
  source?: string;
  pjn?: boolean;
  initialDateFolder?: string;
}

const AutomaticStep = () => {
  const theme = useTheme();
  const formik = useFormikContext<FormValues>();
  const { setFieldValue, values, setFieldError, touched, setTouched } = formik;
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [yearError, setYearError] = useState("");
  const [jurisdictionError, setJurisdictionError] = useState("");
  const [numberError, setNumberError] = useState("");
  
  // Referencia para detectar el botón de siguiente
  const formSubmitAttempted = useRef<boolean>(false);

  // Función para validar el año
  const validateYear = (year: string | undefined) => {
    if (!year || year.trim() === '') {
      setYearError("El año es requerido");
      setFieldError("expedientYear", "El año es requerido");
      return false;
    }
    
    const currentYear = new Date().getFullYear();
    const yearNumber = parseInt(year);
    
    // Verificamos que tenga 4 dígitos
    if (year.length !== 4) {
      setYearError("El año debe tener 4 dígitos");
      setFieldError("expedientYear", "El año debe tener 4 dígitos");
      return false;
    }
    
    // Verificamos que esté en el rango correcto
    if (yearNumber < 2000 || yearNumber > currentYear) {
      setYearError(`El año debe estar entre 2000 y ${currentYear}`);
      setFieldError("expedientYear", `El año debe estar entre 2000 y ${currentYear}`);
      return false;
    }
    
    setYearError("");
    return true;
  };

  // Validar el número de expediente
  const validateExpedientNumber = (number: string | undefined) => {
    if (!number || number.trim() === '') {
      setNumberError("El número de expediente es requerido");
      setFieldError("expedientNumber", "El número de expediente es requerido");
      return false;
    }
    setNumberError("");
    return true;
  };

  // Validar la jurisdicción
  const validateJurisdiction = (jurisdiction: string | undefined) => {
    if (!jurisdiction || jurisdiction === "") {
      setJurisdictionError("Debe seleccionar una jurisdicción");
      setFieldError("folderJuris", "Debe seleccionar una jurisdicción");
      return false;
    }
    
    setJurisdictionError("");
    return true;
  };

  // Función para establecer los valores automáticamente
  const setAutomaticValues = () => {
    // Solo validamos la jurisdicción si se ha tocado o si se intenta enviar
    let jurisdictionValid = true;
    if (touched.folderJuris || formSubmitAttempted.current) {
      jurisdictionValid = validateJurisdiction(values.folderJuris);
    }
    
    if (values.folderJuris && values.expedientNumber && values.expedientYear) {
      // Solo validamos año y número si tienen valores
      const yearValid = values.expedientYear ? validateYear(values.expedientYear) : false;
      const numberValid = values.expedientNumber ? validateExpedientNumber(values.expedientNumber) : false;
      
      if (!yearValid || !jurisdictionValid || !numberValid) {
        setSuccess(false);
        return;
      }

      try {
        // Obtenemos el nombre de la jurisdicción seleccionada
        const jurisdiccionSeleccionada = jurisdicciones.find(j => j.value === values.folderJuris);
        const nombreJurisdiccion = jurisdiccionSeleccionada ? jurisdiccionSeleccionada.nombre : '';

        // Establecemos los valores requeridos
        setFieldValue("folderName", "Pendiente"); // Valor requerido
        setFieldValue("materia", values.folderJuris); // Materia igual al valor de jurisdicción
        setFieldValue("orderStatus", "No verificado"); // Valor requerido 
        setFieldValue("status", "Nueva"); // Valor requerido
        setFieldValue("description", `Expediente importado desde ${nombreJurisdiccion} - Poder Judicial de la Nación`);
        setFieldValue("folderFuero", "Civil");

        // También preparamos los datos para la integración con el sistema
        setFieldValue("folderJurisItem", values.folderJuris);
        setFieldValue("folderJurisLabel", nombreJurisdiccion);

        // Además de la info visible, vamos a cargar algunos datos básicos para los campos opcionales
        setFieldValue("initialDateFolder", new Date().toLocaleDateString("es-AR"));

        // Establecer pjn = true para indicar que los datos provienen del Poder Judicial de la Nación
        setFieldValue("pjn", true);
        setFieldValue("source", "auto");
        setFieldValue("expedientNumber", values.expedientNumber);
        setFieldValue("expedientYear", values.expedientYear);

        setSuccess(true);
        setError("");
      } catch (err) {
        setError("Error al procesar los datos del expediente.");
      }
    } else {
      setSuccess(false);
    }
  };

  // Validamos todos los campos cuando se intenta navegar al siguiente paso
  const validateAllFields = () => {
    // Marcamos todos los campos como tocados para mostrar errores
    setTouched({
      folderJuris: true,
      expedientNumber: true,
      expedientYear: true,
      ...touched
    });
    
    // Siempre validamos jurisdicción
    const jurisdictionValid = validateJurisdiction(values.folderJuris);
    
    // Solo validamos año y número si la jurisdicción es válida
    if (jurisdictionValid) {
      if (values.expedientNumber) validateExpedientNumber(values.expedientNumber);
      if (values.expedientYear) validateYear(values.expedientYear);
    }
  };

  // Efecto para monitorear cambios en los campos principales
  useEffect(() => {
    // Solo validamos la jurisdicción si ya se ha tocado el campo o si se ha intentado enviar
    if (touched.folderJuris || formSubmitAttempted.current) {
      validateJurisdiction(values.folderJuris);
    }
    setAutomaticValues();
  }, [values.folderJuris, values.expedientNumber, values.expedientYear, touched.folderJuris, formSubmitAttempted.current]);

  // Validar el año solo cuando cambia y se ha tocado
  useEffect(() => {
    if (values.expedientYear && touched.expedientYear) {
      validateYear(values.expedientYear);
    }
  }, [values.expedientYear, touched.expedientYear]);

  // Validar la jurisdicción solo cuando cambia y se ha tocado
  useEffect(() => {
    if (touched.folderJuris || formSubmitAttempted.current) {
      validateJurisdiction(values.folderJuris);
    }
  }, [values.folderJuris, touched.folderJuris, formSubmitAttempted.current]);

  // Validar el número solo cuando cambia y se ha tocado
  useEffect(() => {
    if (values.expedientNumber && touched.expedientNumber) {
      validateExpedientNumber(values.expedientNumber);
    }
  }, [values.expedientNumber, touched.expedientNumber]);
  
  // Método para interceptar la validación del formulario al hacer clic en Siguiente
  useEffect(() => {
    // Accedemos al nextButton que debería estar en algún lugar del DOM
    const nextButton = document.querySelector('[data-testid="next-button"]') || 
                       document.querySelector('.next-button') || 
                       document.querySelector('button[type="submit"]');

    if (nextButton) {
      const handleNextClick = (e: Event) => {
        // Marcamos todos los campos como tocados
        formSubmitAttempted.current = true;
        setTouched({
          folderJuris: true,
          expedientNumber: true,
          expedientYear: true,
          ...touched
        });
        
        // Validamos manualmente todos los campos
        validateAllFields();
      };

      nextButton.addEventListener('click', handleNextClick);
      
      return () => {
        nextButton.removeEventListener('click', handleNextClick);
      };
    }
  }, []);

  // Manejar cambio en el campo de año
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFieldValue("expedientYear", value);
    // Marcamos el campo como tocado para mostrar el error si existe
    setTouched({ ...touched, expedientYear: true });
  };

  // Manejar cambio en el campo de jurisdicción
  const handleJurisdictionChange = (e: SelectChangeEvent) => {
    const value = e.target.value as string;
    setFieldValue("folderJuris", value);
    setTouched({ ...touched, folderJuris: true });
    validateJurisdiction(value);
  };
  
  // No validamos los campos al iniciar el componente, solo después de interactuar
  
  // Manejar cambio en el campo de número de expediente
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFieldValue("expedientNumber", value);
    setTouched({ ...touched, expedientNumber: true });
    validateExpedientNumber(value);
  };

  return (
    <DialogContent sx={{ p: 2.5 }}>
      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <DocumentUpload size={24} color={theme.palette.primary.main} />
            <Typography variant="h6" color="textPrimary">
              Importar causa desde Poder Judicial de la Nación
            </Typography>
          </Stack>
        </Grid>

        {error && (
          <Grid item xs={12}>
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          </Grid>
        )}

        {success && (
          <Grid item xs={12}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Datos cargados exitosamente. Haga clic en el botón "Siguiente" para guardar o añadir información adicional.
            </Alert>
          </Grid>
        )}

        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Stack spacing={1.25}>
                <InputLabel htmlFor="folderJuris">Jurisdicción</InputLabel>
                <FormControl 
                  fullWidth 
                  style={{ maxHeight: "39.91px" }}
                  error={Boolean(jurisdictionError && (touched.folderJuris || formSubmitAttempted.current))}
                >
                  <Select
                    id="folderJuris"
                    name="folderJuris"
                    value={values.folderJuris || ""}
                    onChange={handleJurisdictionChange}
                    displayEmpty
                    size="small"
                    renderValue={(selected) => {
                      if (!selected) {
                        return <em>Seleccione una jurisdicción</em>;
                      }
                      const selectedJurisdiction = jurisdicciones.find(j => j.value === selected);
                      return selectedJurisdiction ? selectedJurisdiction.nombre : '';
                    }}
                    sx={{
                      "& .MuiInputBase-root": { height: 39.91 },
                      "& .MuiInputBase-input": { fontSize: 12 },
                      "& .MuiSelect-select.MuiSelect-outlined.MuiInputBase-input.MuiOutlinedInput-input.Mui-disabled": {
                        color: "text.disabled"
                      }
                    }}
                  >
                    <MenuItem value="" disabled>
                      <em>Seleccione una jurisdicción</em>
                    </MenuItem>
                    {jurisdicciones.filter(j => j.value !== "").map((jurisdiccion) => (
                      <MenuItem
                        key={jurisdiccion.value}
                        value={jurisdiccion.value}
                      >
                        {jurisdiccion.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                  {jurisdictionError && (touched.folderJuris || formSubmitAttempted.current) && (
                    <Typography color="error" variant="caption" sx={{ mt: 0.5 }}>
                      {jurisdictionError}
                    </Typography>
                  )}
                </FormControl>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Stack spacing={1.25}>
                <InputLabel htmlFor="expedientNumber">Número de Expediente</InputLabel>
                <InputField
                  fullWidth
                  sx={customInputStyles}
                  id="expedient-number"
                  placeholder="Ej. 123456"
                  name="expedientNumber"
                  type="number"
                  onChange={handleNumberChange}
                  error={Boolean(numberError && touched.expedientNumber)}
                  helperText={touched.expedientNumber ? numberError : ""}
                />
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Stack spacing={1.25}>
                <InputLabel htmlFor="expedientYear">Año</InputLabel>
                <InputField
                  fullWidth
                  sx={customInputStyles}
                  id="expedient-year"
                  placeholder="Ej. 2023"
                  name="expedientYear"
                  type="number"
                  onChange={handleYearChange}
                  error={Boolean(yearError && touched.expedientYear)}
                  helperText={touched.expedientYear ? yearError : ""}
                />
              </Stack>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </DialogContent>
  );
};

export default AutomaticStep;