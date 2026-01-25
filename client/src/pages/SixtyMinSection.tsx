import { ChevronRight } from "lucide-react";
import heroVideo from "@assets/Untitled_design_(4)_1765414167200.mp4";

interface SixtyMinSectionProps {
    onExplore?: () => void;
}

export default function SixtyMinSection({ onExplore }: SixtyMinSectionProps) {
    return (
        <section className="w-full overflow-hidden">
            <div
                className="relative w-full cursor-pointer overflow-hidden"
                style={{ aspectRatio: "430 / 215.89" }}
                onClick={onExplore}
            >
                <video
                    src={heroVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <button
                        className="group flex items-center gap-1.5 px-4 py-2 text-[#F5E9DB] shadow-xl hover-elevate active-elevate-2 transition-all duration-300 translate-y-17"
                        style={{
                            backgroundColor: "#06352A",
                            fontFamily: "Sweet Sans Pro",
                            fontSize: "12px",
                            fontWeight: 700,
                            borderRadius: "16px",
                        }}
                    >
                        60-minute Delivery
                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </button>
                </div>
            </div>
        </section>
    );
}
