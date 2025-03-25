import { useState, SyntheticEvent, ChangeEvent } from "react";
import axios from 'axios';

import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
  SelectChangeEvent
} from "@mui/material";
import MainCard from "components/MainCard";
import AnimateButton from "components/@extended/AnimateButton";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";

// Tipos para el formulario de soporte
export interface SupportFormData {
  name: string;
  email: string;
  subject: string;
  priority: string;
  message: string;
}

interface SupportModalProps {
  open: boolean;
  onClose: () => void;
}

// Lista de asuntos predefinidos
const subjectOptions = [
  'Consulta general',
  'Problema técnico',
  'Facturación',
  'Actualización de datos',
  'Recuperación de cuenta',
  'Otro'
];

// Lista de prioridades
const priorityOptions = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' }
];

const SupportModal = ({ open, onClose }: SupportModalProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  // Estado para los datos del formulario
  const [formData, setFormData] = useState<SupportFormData>({
    name: '',
    email: '',
    subject: '',
    priority: 'medium',
    message: ''
  });

  // Estado para los errores de validación
  const [errors, setErrors] = useState({
    name: false,
    email: false,
    subject: false,
    message: false
  });

  // Estado para mensaje de éxito
  const [submitted, setSubmitted] = useState(false);

  // Resetear el formulario cuando se abre
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      subject: '',
      priority: 'medium',
      message: ''
    });
    setErrors({
      name: false,
      email: false,
      subject: false,
      message: false
    });
    setSubmitted(false);
  };

  // Manejar cambios en campos de texto
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });

    // Limpiar error cuando el usuario empieza a escribir
    if (errors[event.target.name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [event.target.name]: false
      });
    }
  };

  // Manejar cambios en campo select de prioridad
  const handlePriorityChange = (event: SelectChangeEvent<string>) => {
    setFormData({
      ...formData,
      priority: event.target.value
    });
  };

  // Validar el formulario
  const validateForm = (): boolean => {
    const newErrors = {
      name: !formData.name.trim(),
      email: !formData.email.trim() || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email),
      subject: !formData.subject.trim(),
      message: !formData.message.trim()
    };

    setErrors(newErrors);

    return !Object.values(newErrors).some(error => error);
  };

  // Manejar envío del formulario
  const handleSubmit = async (event: SyntheticEvent) => {
    event.preventDefault();

    if (validateForm()) {
      try {

        const response = await axios.post(
          `${process.env.REACT_APP_BASE_URL}/api/support-contacts`,
          formData,
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        // Si la solicitud es exitosa
        if (response.data.success) {
          // Mostrar mensaje de éxito
          dispatch(
            openSnackbar({
              open: true,
              message: "Consulta enviada correctamente",
              variant: "alert",
              alert: {
                color: "success",
              },
              close: false,
            })
          );

          setSubmitted(true);

          // Cerrar el modal después de 3 segundos
          setTimeout(() => {
            onClose();
            resetForm();
          }, 3000);
        }
      } catch (error) {
        // Manejar diferentes tipos de errores
        let errorMessage = "Error al enviar la consulta. Inténtalo más tarde.";

        if (axios.isAxiosError(error)) {
          // Error de Axios
          if (error.response) {
            // El servidor respondió con un código de estado diferente de 2xx
            errorMessage = error.response.data.error || errorMessage;
          } else if (error.request) {
            // La solicitud se realizó pero no se recibió respuesta
            errorMessage = "No se pudo conectar con el servidor. Verifica tu conexión.";
          }
        }

        // Mostrar mensaje de error
        dispatch(
          openSnackbar({
            open: true,
            message: errorMessage,
            variant: "alert",
            alert: {
              color: "error",
            },
            close: false,
          })
        );

        console.error('Error de conexión:', error);
      }
    }
  };

  // Manejar cierre del modal
  const handleClose = () => {
    onClose();
    // Resetear el formulario después de cerrar
    setTimeout(resetForm, 300);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      sx={{ '& .MuiDialog-paper': { borderRadius: 2 } }}
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Contactar a Soporte</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {submitted ? (
          <MainCard>
            <Stack spacing={2} alignItems="center" sx={{ py: 3 }}>
              <Typography variant="h4" color="success.main">
                ¡Solicitud enviada!
              </Typography>
              <Typography align="center" color="text.secondary">
                Gracias por contactarnos. Responderemos a tu consulta en menos de 24 horas.
              </Typography>
            </Stack>
          </MainCard>
        ) : (
          <form onSubmit={handleSubmit}>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Nombre */}
              <TextField
                fullWidth
                label="Nombre"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                helperText={errors.name ? "El nombre es requerido" : ""}
              />

              {/* Email */}
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                helperText={errors.email ? "Ingresa un email válido" : ""}
              />

              {/* Asunto */}
              <TextField
                fullWidth
                label="Asunto"
                name="subject"
                select
                value={formData.subject}
                onChange={handleChange}
                error={errors.subject}
                helperText={errors.subject ? "Selecciona un asunto" : ""}
              >
                {subjectOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>

              {/* Prioridad */}
              <FormControl fullWidth>
                <InputLabel id="priority-label">Prioridad</InputLabel>
                <Select
                  labelId="priority-label"
                  value={formData.priority}
                  onChange={handlePriorityChange}
                  input={<OutlinedInput label="Prioridad" />}
                >
                  {priorityOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Mensaje */}
              <TextField
                fullWidth
                label="Mensaje"
                name="message"
                multiline
                rows={4}
                value={formData.message}
                onChange={handleChange}
                error={errors.message}
                helperText={errors.message ? "El mensaje es requerido" : ""}
              />

              {/* Botones */}
              <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
                <Button color="error" onClick={handleClose}>
                  Cancelar
                </Button>
                <AnimateButton>
                  <Button variant="contained" type="submit">
                    Enviar consulta
                  </Button>
                </AnimateButton>
              </Stack>
            </Stack>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SupportModal;