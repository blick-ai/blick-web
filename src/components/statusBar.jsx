import { statusInfo, paraPercentual } from "../utils/status"

export default function StatusBar({ statusGeral, confianca, size = "sm" }) {
    const { label, color } = statusInfo(statusGeral)
    const percentual = paraPercentual(confianca)

    if (size === "lg") {
        return (
            <div className="flex flex-col gap-2 flex-1 justify-center">
                <div className="flex flex-row items-baseline gap-2">
                    <p className="text-3xl font-extrabold" style={{ color }}>
                        {percentual !== null ? `${percentual}%` : "-"}
                    </p>
                    <p className="text-sm font-bold" style={{ color }}>{label}</p>
                </div>
                <div className="bg-[#2A2D31] rounded-full w-full h-2 overflow-hidden">
                    <div
                        className="h-full rounded-full"
                        style={{ width: `${percentual ?? 0}%`, backgroundColor: color }}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-row items-center gap-3 w-full">
            {percentual !== null && (
                <p className="text-lg font-extrabold shrink-0" style={{ color }}>{percentual}%</p>
            )}
            <div className="bg-[#2A2D31] rounded-full flex-1 h-2 overflow-hidden">
                <div
                    className="h-full rounded-full"
                    style={{ width: `${percentual ?? 0}%`, backgroundColor: color }}
                />
            </div>
            <p className="text-[10px] font-bold shrink-0" style={{ color }}>{label}</p>
        </div>
    )
}