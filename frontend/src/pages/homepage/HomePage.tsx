import { DashboardLayout } from '@/components/DashboardLayout'
import { HomeCarousel } from './components/HomeCarousel'
import { MarketCard } from '../market/components/MarketCard'
import { useGetAllMarkets } from '@/program-hooks/get-market'

const HomePage = () => {
  const { markets } = useGetAllMarkets();
  const activeMarkets = markets.filter((market) => {
      return market.account.isResolved === false;
  });
  const showThreeActiveMarkets = activeMarkets.slice(0, 3);
  
  return (
    <DashboardLayout>
      <div className='w-full'>
        <HomeCarousel />

        <div className='text-left mt-5 mb-3'>
          <span className='text-2xl font-bold'>Active Markets</span>
        </div>
        {showThreeActiveMarkets.map((market) => {
          return (
             <MarketCard 
          key={market.publicKey} 
          publicKey={market.publicKey}
          account={market.account}
        />
          )
         })}
      </div>
    </DashboardLayout>
  )
}

export default HomePage