import { useState } from "react";
import { useNavigate } from "react-router";
import CarInfo from "./carInfo";
import CarRoute from "./carRoute";
import Sweep from "./sweep";
import Heatmap from "./heatmap";
import logo from "../assets/images/logo-transparent.png";
import exit from "../assets/images/exit.png";

export default function Sidebar({ resumo, carregandoResumo, pontosCalor, carregandoPontosCalor }) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="md:hidden fixed top-4 left-4 z-50 bg-[#1B2125] border border-[#8A898B]/25 rounded-lg p-2"
            >
                <div className="flex flex-col gap-1">
                    <span className="block w-5 h-0.5 bg-white"></span>
                    <span className="block w-5 h-0.5 bg-white"></span>
                    <span className="block w-5 h-0.5 bg-white"></span>
                </div>
            </button>
            {open && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setOpen(false)}
                />
            )}
            <div
                className={`
            fixed md:sticky md:top-0 top-0 left-0 z-50
            h-screen md:h-auto md:self-stretch
            flex flex-col w-80 md:w-90 shrink-0
            transition-transform duration-300 ease-in-out
            ${open ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0
        `}
            >
                <div className="bg-[#1B2125] border border-[#8A898B]/25 text-[#8A898B] flex flex-row h-16 w-full py-3 px-3 justify-between items-center shrink-0">
                    <img src={logo} className="w-24 h-auto" />
                    <div className="flex flex-row gap-2 items-center">
                        <button
                            type="button"
                            className="md:hidden hover:opacity-70 text-[#8A898B] text-xl leading-none px-1"
                            onClick={() => setOpen(false)}
                        >
                            ✕
                        </button>
                        <button
                            type="button"
                            className="hover:opacity-70"
                            onClick={() => navigate("/")}
                        >
                            <img src={exit} alt="Sair" className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                <div className="bg-[#1B2125] border border-[#8A898B]/25 text-[#8A898B] flex flex-col flex-1 min-h-0 w-full py-3 px-3 gap-2 overflow-y-auto">
                    <CarInfo />
                    <br />
                    <Sweep resumo={resumo} carregando={carregandoResumo} />
                    <br />
                    <Heatmap pontos={pontosCalor} carregando={carregandoPontosCalor} />
                </div>
            </div>
        </>
    );
}