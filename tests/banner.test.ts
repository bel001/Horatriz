import { describe, expect, it } from "vitest";
import { parseTexto, filaASesion } from "@/lib/parser";
import { agruparEnCursos } from "@/lib/groups";
import { esFormatoBanner } from "@/lib/banner";

const TEXTO_BANNER = `Examinar clases
Resultados de la búsqueda
Periodo: 2026-II (PREGRADO)Materia: ING SISTEM E INTELIG ARTIFIC
Título	Descripción de materia	Número de curso	Sección	Horas	NRC	Periodo	Instructor	Horas de reunión	Campus	Estatus	Tipo de horario	Atributo	Secciones ligadas	
ARQUITECTURA DE SISTEMAS	ING SISTEM E INTELIG ARTIFIC	112	J02	0	5038	2026-II (PREGRADO)	CABALLERO ALVARADO, ARMANDO (Principal)
Lunes 18:00 - 19:45
Tipo: Class Edificio: Ninguno Salón: Ninguno
CAMPUS PRINCIPAL TRUJILLO	50 de 50 lugares disponibles. LIGADAS PRÁCTICA

CUSTOMER DEVELOPMENT	ING SISTEM E INTELIG ARTIFIC	113	J01	3	5041	2026-II (PREGRADO)	CALDERON SEDANO, JOSE (Principal)
Viernes 07:00 - 08:45
Tipo: Class Edificio: PABELLÓN G Salón: G702
CAMPUS PRINCIPAL TRUJILLO	50 de 50 lugares disponibles. LIGADAS TEORÍA`;

const TEXTO_BANNER_91 = `Examinar clases
Resultados de la búsqueda 91 Clases
Periodo: 2026-II (PREGRADO)Materia: ING.COMPUTACIÓN Y SISTEMAS
Título	Descripción de materia	Número de curso	Sección	Horas	NRC	Periodo	Instructor	Horas de reunión	Campus	Estatus	Tipo de horario	Atributo	Secciones ligadas	
ALGORITMIA Y PROGRAMACION	ING.COMPUTACIÓN Y SISTEMAS	506	J01	4	4907	2026-II (PREGRADO)	LAZO AGUIRRE, WALTER (Principal)
Martes 07:00 - 08:45
Tipo: Class Edificio: PABELLÓN G Salón: G704 Fecha de inicio: 31-Ago-2026 Fecha de fin: 23-Dic-2026
CAMPUS PRINCIPAL TRUJILLO	COMPLETO: 0 de 50 lugares disponibles. LIGADAS TEORÍA

ALGORITMIA Y PROGRAMACION	ING.COMPUTACIÓN Y SISTEMAS	506	J02	0	4908	2026-II (PREGRADO)	LAZO AGUIRRE, WALTER (Principal)
Miércoles 10:40 - 14:15
Tipo: Class Edificio: PABELLÓN F Salón: F407 Fecha de inicio: 31-Ago-2026 Fecha de fin: 23-Dic-2026
CAMPUS PRINCIPAL TRUJILLO	COMPLETO: 0 de 20 lugares disponibles. LIGADAS LABORATORIO

PROGRAMACION ORIENTADA A OBJETOS	ING.COMPUTACIÓN Y SISTEMAS	509	J01	4	4945	2026-II (PREGRADO)	INFANTES QUIROZ, FREDDY (Principal)
Lunes 14:20 - 16:05
Tipo: Class Edificio: PABELLÓN G Salón: G604 Fecha de inicio: 31-Ago-2026 Fecha de fin: 23-Dic-2026
CAMPUS PRINCIPAL TRUJILLO	50 de 50 lugares disponibles. LIGADAS TEORÍA

PROGRAMACION ORIENTADA A OBJETOS	ING.COMPUTACIÓN Y SISTEMAS	509	J09	4	12058	2026-II (PREGRADO)	CASTAÑEDA SALDAÑA, JOSE (Principal)
Miércoles 14:20 - 16:05
Tipo: Class Edificio: PABELLÓN G Salón: G704 Fecha de inicio: 31-Ago-2026 Fecha de fin: 23-Dic-2026
CAMPUS PRINCIPAL TRUJILLO	50 de 50 lugares disponibles. LIGADAS TEORÍA

PROGRAMACION ORIENTADA A OBJETOS	ING.COMPUTACIÓN Y SISTEMAS	509	J10	0	12059	2026-II (PREGRADO)	INFANTES QUIROZ, FREDDY (Principal)
Jueves 18:00 - 21:35
Tipo: Class Edificio: PABELLÓN F Salón: Ninguno Fecha de inicio: 31-Ago-2026 Fecha de fin: 23-Dic-2026
CAMPUS PRINCIPAL TRUJILLO	17 de 17 lugares disponibles. LIGADAS LABORATORIO

SISTEMAS DE GESTION DE BASE DE DATO	ING.COMPUTACIÓN Y SISTEMAS	521	J01	4	5013	2026-II (PREGRADO)	ABANTO CABRERA, HEBER (Principal)
Lunes 07:00 - 08:45
Tipo: Class Edificio: PABELLÓN G Salón: G504 Fecha de inicio: 31-Ago-2026 Fecha de fin: 23-Dic-2026
CAMPUS PRINCIPAL TRUJILLO	50 de 50 lugares disponibles. LIGADAS TEORÍA

DEONTOLOGIA PROFESIONAL	ING.COMPUTACIÓN Y SISTEMAS	546	J01	2	5052	2026-II (PREGRADO)	VALVERDE VELA, SHEYLI (Principal)
Miércoles 08:50 - 09:40
Tipo: Class Edificio: Ninguno Salón: Ninguno Fecha de inicio: 31-Ago-2026 Fecha de fin: 23-Dic-2026
CAMPUS PRINCIPAL TRUJILLO	50 de 50 lugares disponibles. LIGADAS TEORÍA

GESTION DE PROYECTOS DE SISTEMAS DE INFORMACION	ING.COMPUTACIÓN Y SISTEMAS	678	J01	4	5054	2026-II (PREGRADO)	HUAPAYA ESCOBEDO, JORGE (Principal)
Lunes 16:10 - 17:55
Tipo: Class Edificio: PABELLÓN G Salón: G704 Fecha de inicio: 31-Ago-2026 Fecha de fin: 23-Dic-2026
CAMPUS PRINCIPAL TRUJILLO	52 de 52 lugares disponibles. LIGADAS TEORÍA

SISTEMAS DE INFORMACION INTEGRADOS	ING.COMPUTACIÓN Y SISTEMAS	679	J01	4	5061	2026-II (PREGRADO)		
Martes 17:05 - 18:50
Tipo: Class Edificio: Ninguno Salón: Ninguno Fecha de inicio: 31-Ago-2026 Fecha de fin: 23-Dic-2026
CAMPUS PRINCIPAL TRUJILLO	50 de 50 lugares disponibles. LIGADAS TEORÍA NO PRESENCIAL`;

describe("Formato Banner UPAO (Examinar clases / Self-Service)", () => {
  it("detecta el formato Banner UPAO", () => {
    expect(esFormatoBanner(TEXTO_BANNER)).toBe(true);
  });

  it("parsea las filas de la oferta básica", () => {
    const res = parseTexto(TEXTO_BANNER);
    expect(res.modo).toBe("bannerupao");
    expect(res.filas).toHaveLength(2);
  });

  it("parsea materia ING.COMPUTACIÓN Y SISTEMAS con 91 clases y materias con punto", () => {
    const res = parseTexto(TEXTO_BANNER_91);
    expect(res.modo).toBe("bannerupao");
    expect(res.filas).toHaveLength(9);

    const algo1 = res.filas[0];
    expect(algo1.curso).toBe("ALGORITMIA Y PROGRAMACION");
    expect(algo1.codigo).toBe("506");
    expect(algo1.esLleno).toBe(true);
    expect(algo1.dia).toBe("MAR");
    expect(algo1.inicio).toBe(7 * 60);

    const sis = res.filas.find((f) => f.codigo === "679");
    expect(sis).toBeDefined();
    expect(sis?.curso).toBe("SISTEMAS DE INFORMACION INTEGRADOS");
    expect(sis?.docente).toBe("");
    expect(sis?.dia).toBe("MAR");
  });
});
