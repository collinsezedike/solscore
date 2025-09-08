import { useSolana } from '@/components/solana/use-solana'
import { useMemo } from 'react'
import { getSolscoreProgramId } from '@project/anchor'

export function useSolscoreProgramId() {
  const { cluster } = useSolana()

  return useMemo(() => getSolscoreProgramId(cluster.id), [cluster])
}
