import WalletButton from './WalletButton'
import { ModeToggle } from './components/mode-toggle'

const Navbar = () => {
  return (
    <div className='w-full'>
      <nav className='flex items-center justify-end gap-4'>
           
        <div>
          <WalletButton />
        </div>

        <div>
          <ModeToggle />
                  
        </div>
      </nav>
    </div>
  )
};

export default Navbar
