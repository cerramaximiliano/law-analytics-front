import React from "react";
// Definición del enum para las categorías
enum Categoria {
	Cliente = "Cliente",
	Contrario = "Contrario",
	Mediador = "Mediador/Conciliador",
	Causante = "Causante",
	Abogado = "Abogado",
	Perito = "Perito",
	Entidad = "Entidad",
}

// Definición del enum para los tipos
enum Tipo {
	Fisica = "Física",
	Juridica = "Jurídica",
}

// Definición del enum para los estados civiles
enum EstadoCivil {
	Soltero = "Soltero",
	Casado = "Casado",
	Viudo = "Viudo",
	Divorciado = "Divorciado",
	Conviviente = "Conviviente",
}

// Definición del enum para las condiciones fiscales
enum CondicionFiscal {
	Monotributo = "Monotributo",
	ResponsableInscripto = "Responsable Inscripto",
	Exento = "Exento",
	Empleado = "Empleado",
	Jubilado = "Jubilado",
	Desocupado = "Desocupado",
}
enum Provincia {
	BuenosAires = "Buenos Aires",
	CABA = "CABA",
	Catamarca = "Catamarca",
	Chaco = "Chaco",
	Chubut = "Chubut",
	Cordoba = "Córdoba",
	Corrientes = "Corrientes",
	EntreRios = "Entre Ríos",
	Formosa = "Formosa",
	Jujuy = "Jujuy",
	LaPampa = "La Pampa",
	LaRioja = "La Rioja",
	Mendoza = "Mendoza",
	Misiones = "Misiones",
	Neuquen = "Neuquén",
	RioNegro = "Río Negro",
	Salta = "Salta",
	SanJuan = "San Juan",
	SanLuis = "San Luis",
	SantaCruz = "Santa Cruz",
	SantaFe = "Santa Fe",
	SantiagoDelEstero = "Santiago del Estero",
	TierraDelFuego = "Tierra del Fuego",
	Tucuman = "Tucumán",
}
// Definición de la interfaz Persona
interface Persona {
	nombre: string;
	apellido: string;
	categoria: Categoria;
	tipo: Tipo;
	domicilio: string;
	provincia: Provincia;
	localidad: string;
	codigoPostal: number;
	email: string;
	telefono: number;
	nacionalidad: string;
	documento: number;
	cuit: number;
	estadoCivil: EstadoCivil;
	profesion: string;
	empresa: string;
	condicionFiscal: CondicionFiscal;
}

export default Persona;
