import { Button } from '@/components/ui/button'
import { useGreetMutation } from '../data-access/use-greet-mutation'

export function SolscoreUiCreate() {
  const greetMutation = useGreetMutation()

  return (
    <Button onClick={() => greetMutation.mutateAsync()} disabled={greetMutation.isPending}>
      Run program{greetMutation.isPending && '...'}
    </Button>
  )
}
