import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const WelcomeCard = () => {
  return (
    <Card className="w-full max-w-md mx-auto text-left overflow-hidden relative">
      {/* Gradient overlay from top right */}
      <div className="absolute inset-0 bg-gradient-to-bl from-orange-500 opacity-20 pointer-events-none" />
     
      <CardHeader className="relative z-10">
        <CardTitle className="text-xl font-bold">
          Welcome Back,
        </CardTitle>
      </CardHeader>
     
      <CardContent className="relative z-10">
        <p className="mb-6 text-2xl sm:text-3xl break-all">
          0x5545jntl9g8urir4wvtgb
        </p>
        <Button className="w-full bg-purple-600 hover:bg-purple-700">
          Get Started
        </Button>
      </CardContent>
    </Card>
  )
}

export default WelcomeCard