import PlantPhoto from "./plantPhoto"

export default function PhotoList({ capturas, selectedId, onSelect, carregando, erro }) {
    return (
        <div className="flex flex-col gap-2 overflow-y-auto">
            {carregando && (
                <p className="text-[#8A898B] text-sm text-center py-8">Carregando capturas…</p>
            )}

            {!carregando && erro && (
                <p className="text-[#C75050] text-sm text-center py-8">{erro}</p>
            )}

            {!carregando && !erro && capturas.length === 0 && (
                <p className="text-[#8A898B] text-sm text-center py-8">
                    Nenhuma captura encontrada com os filtros atuais.
                </p>
            )}

            {!carregando && !erro && capturas.map((captura) => (
                <PlantPhoto
                    key={captura.capturaId}
                    capturaId={captura.capturaId}
                    timestamp={captura.timestamp}
                    status={captura.status}
                    statusGeral={captura.statusGeral}
                    confiancaStatusGeral={captura.confiancaStatusGeral}
                    latitude={captura.latitude}
                    longitude={captura.longitude}
                    alertaEmitido={captura.alertaEmitido}
                    imagemUrl={captura.imagemUrl}
                    origem={captura.origem}
                    selected={selectedId === captura.capturaId}
                    onSelect={() => {
                        if (selectedId === captura.capturaId) {
                            onSelect(null)
                        } else {
                            onSelect(captura)
                        }
                    }}
                />
            ))}
        </div>
    )
}