export default function PhotoHeader({filtroSlot }) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex flex-col gap-1">
                    <p className="text-white font-bold text-xl">CAPTURAS ANALISADAS</p>
                </div>
                {filtroSlot}
            </div>
        </div>
    )
}