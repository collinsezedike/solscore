import { useSolana } from '@/components/solana/use-solana'
import { WalletDropdown } from '@/components/wallet-dropdown'
import { AppHero } from '@/components/app-hero'
import { SolscoreUiProgramExplorerLink } from './ui/solscore-ui-program-explorer-link'
import { SolscoreUiCreate } from './ui/solscore-ui-create'
import { SolscoreUiProgram } from '@/features/solscore/ui/solscore-ui-program'

export default function SolscoreFeature() {
  const { account } = useSolana()

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="hero py-[64px]">
          <div className="hero-content text-center">
            <WalletDropdown />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHero title="Solscore" subtitle={'Run the program by clicking the "Run program" button.'}>
        <p className="mb-6">
          <SolscoreUiProgramExplorerLink />
        </p>
        <SolscoreUiCreate />
      </AppHero>
      <SolscoreUiProgram />
    </div>
  )
}
