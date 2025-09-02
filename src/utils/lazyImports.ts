// Lazy imports para bibliotecas pesadas que no son críticas en la carga inicial

// ApexCharts - Solo cargar cuando se necesite
export const loadApexCharts = () => import("react-apexcharts");

// Emoji Picker - Solo cargar cuando se abra
export const loadEmojiPicker = () => import("emoji-picker-react");

// Draft.js - Solo cargar en editores
export const loadDraftJs = () => import("draft-js");

// React PDF - Solo cargar cuando se necesite ver PDFs
export const loadReactPdf = () => import("@react-pdf/renderer");
