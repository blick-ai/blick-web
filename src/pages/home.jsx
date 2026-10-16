import { useNavigate } from "react-router"
import Header from "../components/header"
import Showcase from "../components/showcase"
import Step from "../components/step"
import car from "../assets/images/car.png"
import chip from "../assets/images/chip.png"
import diagnosis from "../assets/images/diagnosis.png"
import recommendation from "../assets/images/recommendation.png"

export default function Home() {
    const navigate = useNavigate()

    return (
        <div className='flex flex-col min-h-screen bg-[#16191C]'>
            <Header />
            <div className="flex flex-col p-4 sm:p-6 items-center text-center mt-20 sm:mt-25">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white w-full sm:w-4/5 md:w-3/5 mb-6 sm:mb-8">
                    DIAGNÓSTICO CONTÍNUO DA SAÚDE DA SUA PLANTAÇÃO
                </h1>
                <p className="text-[#8A898B] text-base sm:text-lg md:text-xl lg:text-2xl w-full sm:w-4/5 md:w-3/5 mb-8 sm:mb-10">
                    O Blick combina um veículo terrestre com modelo embarcado, visão computacional e um dashboard clínico para classificar o estado fitossanitário de cada planta: saudável ou não saudável, antes que o problema se espalhe pela lavoura.
                </p>
                <button
                    className="btn bg-[#4A9B9A] hover:bg-[#316868] font-semibold py-3 px-6 sm:py-4 sm:px-8 rounded text-black text-sm sm:text-base mb-12 sm:mb-20"
                    onClick={() => navigate("/login")}
                >
                    COMEÇAR AGORA →
                </button>
                <div className="flex flex-col sm:flex-row flex-wrap justify-center items-stretch gap-4 sm:gap-8 w-full mb-4 sm:mb-8">
                    <Showcase path={car} title={"VEÍCULO AUTÔNOMO"} description={"Um veículo com modelo embarcado percorre a plantação, capturando imagens de cada planta e decidindo em campo quando registrar uma captura válida."} />
                    <Showcase path={chip} title={"VISÃO COMPUTACIONAL"} description={"Modelos de deep learning analisam cada imagem e classificam a planta como saudável ou não saudável."} />
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap justify-center items-stretch gap-4 sm:gap-8 w-full mb-8">
                    <Showcase path={diagnosis} title={"DIAGNÓSTICO EM TEMPO REAL"} description={"Acompanhe a distribuição de saúde da plantação e as áreas mais afetadas num mapa de calor."} />
                    <Showcase path={recommendation} title={"ALERTAS DIRECIONADOS"} description={"Receba um alerta sempre que uma planta não saudável for detectada, apontando exatamente onde a lavoura precisa de atenção."} />
                </div>
            </div>
            <div className="items-center bg-[#1B2125] flex flex-col w-screen border-y py-12 sm:py-20 px-4 sm:px-10 md:px-20 lg:px-30 gap-6 sm:gap-8 border-[#8A898B]/25 mb-4">
                <p className="font-bold text-white text-2xl sm:text-3xl md:text-4xl text-center">COMO FUNCIONA</p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 md:gap-8 w-full">
                    <Step id={"01"} title={"INSPEÇÃO"} description={"O veículo percorre a plantação em rota autônoma e fotografa cada planta individualmente, com apoio de um modelo embarcado."} />
                    <Step id={"02"} title={"DIAGNÓSTICO"} description={"A IA classifica cada planta como saudável ou não saudável, com base na imagem capturada."} />
                    <Step id={"03"} title={"MANEJO"} description={"Você visualiza os pontos críticos no dashboard e no mapa de calor, priorizando onde agir primeiro na lavoura."} />
                </div>
            </div>
            <div className="text-center text-[#8A898B] text-xs sm:text-sm px-4 mb-16 sm:mb-32 md:mb-50">
                <p>Blick - Trabalho de Conclusão de Curso ● Saúde Vegetal ● Modelo Embarcado ● Visão Computacional</p>
            </div>
        </div>
    )
}