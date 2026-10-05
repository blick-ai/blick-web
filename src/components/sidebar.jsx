import { useNavigate } from "react-router"
import CarInfo from "./carInfo"
import Sweep from "./sweep"
import AffectedPlantsMap from "./affectedPlantsMap"
import logo from "../assets/images/logo-transparent.png"
import exit from "../assets/images/exit.png"

export default function Sidebar({
    resumo,
    carregandoResumo,
    capturaParaMapa,
    onSelecionarCapturaNoMapa,
    aberto = false,
    onOpenChange,
}) {
    const navigate = useNavigate()

    function fecharSidebar() {
        onOpenChange?.(false)
    }

    return (
        <>
            <button
                type="button"
                onClick={() => onOpenChange?.(true)}
                className="fixed left-4 top-4 z-50 rounded-lg border border-[#8A898B]/25 bg-[#1B2125] p-2 md:hidden"
                aria-label="Abrir menu"
            >
                <div className="flex flex-col gap-1">
                    <span className="block h-0.5 w-5 bg-white" />
                    <span className="block h-0.5 w-5 bg-white" />
                    <span className="block h-0.5 w-5 bg-white" />
                </div>
            </button>

            {aberto && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={fecharSidebar}
                />
            )}

            <aside
                className={`fixed left-0 top-0 z-50 flex h-screen w-80 shrink-0 flex-col transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-auto md:w-90 md:self-stretch md:translate-x-0 ${
                    aberto ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex h-16 w-full shrink-0 flex-row items-center justify-between border border-[#8A898B]/25 bg-[#1B2125] px-3 py-3 text-[#8A898B]">
                    <img src={logo} alt="Blick" className="h-auto w-24" />

                    <div className="flex flex-row items-center gap-2">
                        <button
                            type="button"
                            className="px-1 text-xl leading-none text-[#8A898B] hover:opacity-70 md:hidden"
                            onClick={fecharSidebar}
                            aria-label="Fechar menu"
                        >
                            ✕
                        </button>

                        <button
                            type="button"
                            className="hover:opacity-70"
                            onClick={() => navigate("/")}
                            aria-label="Sair"
                        >
                            <img src={exit} alt="" className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="flex min-h-0 w-full flex-1 flex-col gap-3 overflow-y-auto border border-[#8A898B]/25 bg-[#1B2125] px-3 py-3 text-[#8A898B]">
                    <CarInfo />
                    <Sweep resumo={resumo} carregando={carregandoResumo} />

                    <AffectedPlantsMap
                        capturaParaMapa={capturaParaMapa}
                        onSelecionarCaptura={onSelecionarCapturaNoMapa}
                    />
                </div>
            </aside>
        </>
    )
}