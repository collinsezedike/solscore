import { DashboardLayout } from '@/components/DashboardLayout'
import WelcomeCard from './components/WelcomeCard'
import { HomeCarousel } from './components/HomeCarousel'

const HomePage = () => {
  return (
    <DashboardLayout>
      <div className='w-full px-4 sm:px-6 lg:px-8 space-y-6'>
        {/* <HomeCarousel /> */}
        <WelcomeCard />
      </div>
    </DashboardLayout>
  )
}

export default HomePage
