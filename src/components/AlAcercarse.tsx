// Monta a sus hijos recién cuando el usuario se acerca a ellos.
//
// La portada montaba nueve secciones de entrada aunque siete quedan muy por
// debajo del pliegue: 1.336 nodos y 943 ms de bloqueo del hilo antes de que la
// persona viera nada. Con esto, lo que está abajo se arma cuando falta poco
// para llegar. El alto mínimo evita que la página "salte" mientras tanto
// (2026-09-20, ver la-ads/analysis/2026-09-20-plan-velocidad-paginas-publicas.md).

import { ReactNode, Suspense, useEffect, useRef, useState } from "react";

interface Props {
	children: ReactNode;
	/** Cuánto antes de entrar en pantalla se empieza a montar. */
	margen?: string;
	/** Alto reservado mientras no está montado, para no mover el resto. */
	altoMinimo?: number;
}

const AlAcercarse = ({ children, margen = "700px", altoMinimo = 480 }: Props) => {
	const ref = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (visible) return;
		const nodo = ref.current;
		if (!nodo || typeof IntersectionObserver === "undefined") {
			setVisible(true);
			return;
		}
		const observador = new IntersectionObserver(
			(entradas) => {
				if (entradas.some((e) => e.isIntersecting)) {
					setVisible(true);
					observador.disconnect();
				}
			},
			{ rootMargin: `${margen} 0px` },
		);
		observador.observe(nodo);
		return () => observador.disconnect();
	}, [visible, margen]);

	return (
		<div ref={ref} style={visible ? undefined : { minHeight: altoMinimo }}>
			{visible ? <Suspense fallback={<div style={{ minHeight: altoMinimo }} />}>{children}</Suspense> : null}
		</div>
	);
};

export default AlAcercarse;
