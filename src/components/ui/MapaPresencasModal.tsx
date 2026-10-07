"use client";

import { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";
import "leaflet/dist/leaflet.css";

export type PontoPresenca = {
  id: number;
  nome: string;
  latitude: number;
  longitude: number;
  hora?: string | null;
};

type Props = {
  open: boolean;
  titulo: string;
  pontos: PontoPresenca[];
  onClose: () => void;
};

export default function MapaPresencasModal({
  open,
  titulo,
  pontos,
  onClose,
}: Props) {
  const mapaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !mapaRef.current || pontos.length === 0) return;

    let map: any;
    let cancelado = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelado || !mapaRef.current) return;

      map = L.map(mapaRef.current);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);

      // Pino desenhado em CSS (evita o problema dos ícones padrão do Leaflet no Next)
      const icone = L.divIcon({
        className: "",
        html: '<div style="width:16px;height:16px;border-radius:50%;background:#dc2626;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5)"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      // Com muitos pontos, o nome aparece só ao passar o mouse/tocar (evita sobreposição)

      pontos.forEach((p) => {
        const rotulo = document.createElement("div");
        const nome = document.createElement("strong");
        nome.textContent = p.nome;
        rotulo.appendChild(nome);
        if (p.hora) {
          rotulo.appendChild(document.createElement("br"));
          rotulo.appendChild(document.createTextNode(p.hora));
        }

        L.marker([p.latitude, p.longitude], { icon: icone })
          .addTo(map)
          // Aparece ao passar o mouse por cima
          .bindTooltip(rotulo.cloneNode(true) as HTMLElement, {
            direction: "top",
            offset: [0, -8],
          })
          // Aparece ao clicar (ou tocar) no ícone
          .bindPopup(rotulo, {
            offset: [0, -8],
            closeButton: false,
          });
      });

      if (pontos.length === 1) {
        map.setView([pontos[0].latitude, pontos[0].longitude], 17);
      } else {
        map.fitBounds(
          pontos.map((p) => [p.latitude, p.longitude] as [number, number]),
          { padding: [40, 40], maxZoom: 17 },
        );
      }
    })();

    return () => {
      cancelado = true;
      map?.remove();
    };
  }, [open, pontos]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        background: "rgba(15, 23, 42, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 900,
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
          padding: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <h2 style={{ fontSize: 16, margin: 0 }}>
            {titulo}
            {pontos.length > 1 ? ` (${pontos.length})` : ""}
          </h2>
          <FiX size={20} style={{ cursor: "pointer" }} onClick={onClose} />
        </div>

        {pontos.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: "#888" }}>
            Nenhuma presença com localização registrada.
          </div>
        ) : (
          <div
            ref={mapaRef}
            style={{
              width: "100%",
              height: "65vh",
              borderRadius: 10,
              border: "1px solid #d1d5db",
            }}
          />
        )}

        <div style={{ textAlign: "right", marginTop: 12 }}>
          <button onClick={onClose} className="btnUsuarioCancel">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
