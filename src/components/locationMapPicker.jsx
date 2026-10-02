import { useCallback, useState } from "react"
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api"

const CHAVE_API = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// centro padrao do mapa quando ainda nao ha nenhuma coordenada escolhida
// (regiao da faculdade/plantacao, so pra abrir num lugar util)
const CENTRO_PADRAO = { lat: -23.647060187045568, lng: -46.573974440978745 }

const ESTILO_MAPA_ESCURO = [
    { elementType: "geometry", stylers: [{ color: "#1B2125" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1B2125" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#8A898B" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#2A2D31" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#16191C" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#232629" }] },
]

export default function LocationMapPicker({ latitude, longitude, onSelecionar }) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: "blick-google-maps",
        googleMapsApiKey: CHAVE_API || "",
    })

    const [posicao, setPosicao] = useState(() => {
        const lat = Number(latitude)
        const lng = Number(longitude)
        if (!Number.isNaN(lat) && !Number.isNaN(lng) && latitude !== "" && longitude !== "") {
            return { lat, lng }
        }
        return CENTRO_PADRAO
    })

    const atualizarPosicao = useCallback((lat, lng) => {
        setPosicao({ lat, lng })
        onSelecionar(lat, lng)
    }, [onSelecionar])

    function handleClickNoMapa(evento) {
        atualizarPosicao(evento.latLng.lat(), evento.latLng.lng())
    }

    function handleArrastarMarcador(evento) {
        atualizarPosicao(evento.latLng.lat(), evento.latLng.lng())
    }

    if (!CHAVE_API) {
        return (
            <div className="bg-[#16191C] border border-[#8A898B]/25 rounded-lg p-4 text-center">
                <p className="text-[#8A898B] text-xs">
                    Mapa indisponível — configure <code className="text-[10px]">VITE_GOOGLE_MAPS_API_KEY</code> pra habilitar essa opção.
                </p>
            </div>
        )
    }

    if (loadError) {
        return (
            <div className="bg-[#16191C] border border-[#C75050]/40 rounded-lg p-4 text-center">
                <p className="text-[#C75050] text-xs">Não foi possível carregar o mapa. Preencha a coordenada manualmente.</p>
            </div>
        )
    }

    if (!isLoaded) {
        return (
            <div className="bg-[#16191C] border border-[#8A898B]/25 rounded-lg p-4 text-center">
                <p className="text-[#8A898B] text-xs">Carregando mapa…</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-1">
            <div className="rounded-lg overflow-hidden border border-[#8A898B]/25">
                <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "220px" }}
                    center={posicao}
                    zoom={17}
                    onClick={handleClickNoMapa}
                    options={{
                        mapTypeId: "hybrid", // satelite + nomes de rua — mais util pra achar um ponto na plantacao do que o mapa de ruas comum
                        styles: ESTILO_MAPA_ESCURO, // só tem efeito no modo "mapa" comum; nao se aplica a imagem de satelite
                        mapTypeControl: true, // deixa o usuario alternar entre satelite/mapa se preferir
                        mapTypeControlOptions: { position: window.google?.maps?.ControlPosition?.TOP_RIGHT },
                        fullscreenControl: false,
                        streetViewControl: false,
                        zoomControl: true,
                        clickableIcons: false,
                    }}
                >
                    <Marker position={posicao} draggable onDragEnd={handleArrastarMarcador} />
                </GoogleMap>
            </div>
            <p className="text-[#8A898B] text-[10px]">Clique no mapa ou arraste o marcador pra ajustar a coordenada.</p>
        </div>
    )
}