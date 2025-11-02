import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import Autoplay from "embla-carousel-autoplay";


const carouselData = [
  {
    id: 1,
    gradient: "bg-gradient-to-br from-orange-500 via-red-500 to-pink-500",
    title: "Bet Smart, Win Big",
    description: "Place your predictions on championship winners. Back your favorite team and earn massive rewards!",
    cta: "Start Betting",
    link: "/markets",
  },
  {
    id: 2,
    gradient: "bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600",
    title: "Explore Live Markets",
    description: "Browse active prediction markets across top leagues. Find the perfect opportunity to showcase your sports knowledge.",
    cta: "View Markets",
    link: "/markets",
  },
  {
    id: 3,
    gradient: "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600",
    title: "Track Your Wins",
    description: "Monitor all your bets in real-time. Claim payouts instantly when your predictions come true!",
    cta: "My Bets",
    link: "/bets",
  },
];

export function HomeCarousel() {
  const navigate = useNavigate();
  const carouselRef = useRef<any>(null);
   const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  // Autoplay functionality
  useEffect(() => {
    const interval = setInterval(() => {
      if (carouselRef.current?.scrollNext) {
        carouselRef.current.scrollNext();
      }
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full overflow-hidden px-2 sm:px-0">
      <Carousel
        opts={{
        align: "center",
        loop: true,
      }}
      plugins={[plugin.current]}
      className="w-full max-w-full"
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
      >
        <CarouselContent className="ml-0">
          {carouselData.map((item) => {
            return (
              <CarouselItem key={item.id} className="pl-0 basis-full">
                <Card className={`border-none overflow-hidden ${item.gradient}`}>
                  <CardContent className="relative flex flex-col justify-between p-4 sm:p-6 md:p-8 lg:p-10 h-44 sm:h-52 md:h-60 lg:h-72 text-white">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    
                    {/* Content */}
                    <div className="relative z-10 space-y-2 sm:space-y-3 md:space-y-4">
                      <div>
                        <h3 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 leading-tight">
                          {item.title}
                        </h3>
                        <p className="text-xs sm:text-sm md:text-base text-white/90 leading-relaxed line-clamp-2 sm:line-clamp-none">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div className="relative z-10 mt-3 sm:mt-4">
                      <Button
                        onClick={() => navigate(item.link)}
                        size="sm"
                        className="bg-white text-gray-900 hover:bg-white/90 font-semibold group text-xs sm:text-sm md:text-base h-8 sm:h-9 md:h-10 px-3 sm:px-4 md:px-6"
                      >
                        {item.cta}
                        <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="hidden lg:flex" />
        <CarouselNext className="hidden lg:flex" />
      </Carousel>
    </div>
  );
}