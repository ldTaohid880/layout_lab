import { ArrowLeft, ChevronRight, Lightbulb, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { LevelBadge } from '@/components/ui/level-badge'
import { CHALLENGES, CHALLENGES_BY_ID } from '@/content/challenges'
import { instantiate } from '@/content/instantiate'
import { LEVELS, LEVEL_LABELS, type Challenge, type Level } from '@/content/types'
import { cn } from '@/lib/utils'
import { useActiveSandbox, useStudio } from '@/store/studioStore'
import { ReferenceGallery, ReferenceThumb } from './Reference'

/**
 * Two levels: a list, and one challenge's view. Opening a challenge only *views* it (brief and
 * reference picture); Start / Continue in its header opens or creates its sandbox, and only then
 * do hints and the solution appear.
 */
export function ChallengesPanel() {
  const sandbox = useActiveSandbox()
  const activeChallengeId = sandbox.challengeId ?? null
  const [viewingId, setViewingId] = useState<string | null>(activeChallengeId)

  // Switching to a challenge's sandbox (e.g. from the sandbox tabs) shows that challenge.
  useEffect(() => {
    if (activeChallengeId) setViewingId(activeChallengeId)
  }, [activeChallengeId])

  const viewing = viewingId ? CHALLENGES_BY_ID.get(viewingId) : undefined
  if (viewing) {
    return <ChallengeView key={viewing.id} challenge={viewing} onBrowse={() => setViewingId(null)} />
  }
  return <ChallengeList onOpen={setViewingId} />
}

function ChallengeList({ onOpen }: { onOpen: (id: string) => void }) {
  const sandboxes = useStudio((s) => s.sandboxes)
  const started = new Set(Object.values(sandboxes).map((s) => s.challengeId))
  const [filter, setFilter] = useState<Level | 'all'>('all')
  const levels = filter === 'all' ? LEVELS : LEVELS.filter((l) => l === filter)

  return (
    <div className="h-full overflow-auto" data-testid="challenge-list">
      <p className="border-b px-3 py-2 text-2xs text-muted-foreground">
        Each challenge opens in its own sandbox. Style the starter to match the reference picture; compare with the
        target in the preview.
      </p>
      <LevelFilter value={filter} onChange={setFilter} />
      {levels.map((level) => (
        <section key={level} aria-labelledby={`challenges-${level}`}>
          <h3
            id={`challenges-${level}`}
            className="sticky top-0 z-[1] border-b bg-surface px-3 py-1.5 text-2xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            {LEVEL_LABELS[level]}
          </h3>
          <ul>
            {CHALLENGES.filter((c) => c.level === level).map((challenge) => (
              <li key={challenge.id} className="border-b">
                <button
                  type="button"
                  onClick={() => onOpen(challenge.id)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-muted/60"
                >
                  <ReferenceThumb challenge={challenge} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      <span className="text-xs font-medium">{challenge.title}</span>
                      <LevelBadge level={challenge.level} />
                      {started.has(challenge.id) && <InProgress />}
                    </span>
                    <span className="mt-0.5 block text-2xs text-muted-foreground">{challenge.summary}</span>
                  </span>
                  <ChevronRight aria-hidden className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function LevelFilter({ value, onChange }: { value: Level | 'all'; onChange: (value: Level | 'all') => void }) {
  const options: (Level | 'all')[] = ['all', ...LEVELS]
  return (
    <div role="radiogroup" aria-label="Filter by level" className="flex flex-wrap gap-1 border-b px-3 py-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={cn(
            'rounded-full border px-2 py-0.5 text-2xs text-muted-foreground hover:text-foreground',
            value === option && 'border-primary bg-primary/10 text-primary hover:text-primary',
          )}
        >
          {option === 'all' ? 'All' : LEVEL_LABELS[option]}
        </button>
      ))}
    </div>
  )
}

/** Small marker for a challenge that already has a sandbox. */
function InProgress() {
  return (
    <span className="flex items-center gap-1 text-2xs text-primary" data-testid="in-progress">
      <span aria-hidden className="size-1.5 rounded-full bg-primary" />
      In progress
    </span>
  )
}

function ChallengeView({ challenge, onBrowse }: { challenge: Challenge; onBrowse: () => void }) {
  const focusDoc = useStudio((s) => s.focusDoc)
  const replaceContent = useStudio((s) => s.replaceContent)
  const startChallenge = useStudio((s) => s.startChallenge)
  const hasSandbox = useStudio((s) => Object.values(s.sandboxes).some((sb) => sb.challengeId === challenge.id))
  const isOpen = useActiveSandbox().challengeId === challenge.id
  const [hintsShown, setHintsShown] = useState(0)
  const [solutionOpen, setSolutionOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="h-full overflow-auto" data-testid="active-challenge">
      <div className="space-y-3 p-3 text-xs">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBrowse}
            className="flex items-center gap-1 text-2xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" /> All challenges
          </button>
          {isOpen ? (
            <InProgress />
          ) : (
            <Button size="sm" onClick={() => startChallenge(challenge)}>
              {hasSandbox ? 'Continue' : 'Start challenge'}
            </Button>
          )}
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-semibold">{challenge.title}</h2>
            <LevelBadge level={challenge.level} />
          </div>
          <div className="mt-1.5 space-y-1.5 leading-relaxed text-foreground/90">
            {challenge.brief.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>

        <ReferenceGallery challenge={challenge} />

        {isOpen && (
          <section aria-labelledby="hints-heading">
            <h3
              id="hints-heading"
              className="mb-1.5 text-2xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Hints
            </h3>
            <ol className="space-y-1.5">
              {challenge.hints.slice(0, hintsShown).map((hint, i) => (
                <li key={hint} className="flex gap-1.5 leading-relaxed">
                  <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                  <span>
                    <span className="sr-only">Hint {i + 1}: </span>
                    {hint}
                  </span>
                </li>
              ))}
            </ol>
            {hintsShown < challenge.hints.length && (
              <Button size="sm" variant="outline" className="mt-1.5" onClick={() => setHintsShown(hintsShown + 1)}>
                <Lightbulb />
                Show hint {hintsShown + 1} of {challenge.hints.length}
              </Button>
            )}
          </section>
        )}

        <section>
          <h3 className="mb-1.5 text-2xs font-medium uppercase tracking-wider text-muted-foreground">Properties</h3>
          <div className="flex flex-wrap gap-1">
            {challenge.concepts.map((property) => (
              <button
                key={property}
                type="button"
                onClick={() => focusDoc(property)}
                aria-label={`Open docs for ${property}`}
                className="rounded border bg-background px-1.5 py-0.5 font-mono text-2xs text-primary hover:border-primary"
              >
                {property}
              </button>
            ))}
          </div>
        </section>

        {!isOpen && (
          <p className="border-t pt-3 text-2xs text-muted-foreground" data-testid="start-note">
            {hasSandbox
              ? 'Continue to reopen your sandbox for this challenge. Hints and the solution are there.'
              : 'Start the challenge to get your own sandbox, hints and the solution.'}
          </p>
        )}

        {isOpen && (
          <section className="space-y-2 border-t pt-3">
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSolutionOpen(!solutionOpen)}
                aria-expanded={solutionOpen}
              >
                {solutionOpen ? 'Hide solution' : 'Show solution'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmReset(true)}>
                <RotateCcw />
                Reset to starter
              </Button>
            </div>
            {solutionOpen && (
              <div className="space-y-2" data-testid="solution">
                <p className="leading-relaxed text-foreground/90">{challenge.solutionNotes}</p>
                <pre className="max-h-64 overflow-auto rounded-md bg-muted px-2 py-1.5 font-mono text-2xs leading-relaxed">
                  {challenge.solution.split('/* ---- Solution ---- */\n')[1] ?? challenge.solution}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    // The solution is written for the starter tree, so both are restored together.
                    replaceContent(`Solution: ${challenge.title}`, {
                      items: instantiate(challenge.items),
                      css: challenge.solution,
                    })
                  }
                >
                  Apply solution
                </Button>
              </div>
            )}
          </section>
        )}
      </div>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset this challenge?"
        description="The elements and CSS go back to the starter. You can undo right after."
        confirmLabel="Reset"
        onConfirm={() =>
          replaceContent(`Starter: ${challenge.title}`, { items: instantiate(challenge.items), css: challenge.css })
        }
      />
    </div>
  )
}
