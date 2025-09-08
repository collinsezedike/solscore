import { useSolscoreProgramId } from '@/features/solscore/data-access/use-solscore-program-id'
import { AppExplorerLink } from '@/components/app-explorer-link'
import { ellipsify } from '@wallet-ui/react'

export function SolscoreUiProgramExplorerLink() {
  const programId = useSolscoreProgramId()

  return <AppExplorerLink address={programId.toString()} label={ellipsify(programId.toString())} />
}
