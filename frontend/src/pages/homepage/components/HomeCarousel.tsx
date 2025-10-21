import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export function HomeCarousel() {
  return (
    <Carousel
      opts={{
        align: "start",
      }}
      className="w-screen"
    >
      <CarouselContent className="-ml-2 md:-ml-4 w-full">
        {Array.from({ length: 5 }).map((_, index) => (
          <CarouselItem key={index} className="pl-2 md:pl-4">
            <Card>
              <CardContent className="flex items-center justify-center p-6 h-48 sm:h-56 md:h-64 lg:h-72">
                <span className="text-3xl font-semibold">{index + 1}</span>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
 <CarouselPrevious className="hidden md:flex" />
      <CarouselNext className="hidden md:flex" />
    </Carousel>
  )
}