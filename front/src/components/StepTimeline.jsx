import { AlertTriangle } from 'lucide-react'
import Icon from './Icon.jsx'
import StatusBadge, { stepStatus } from './StatusBadge.jsx'
import { formatDateTime } from '../lib/format.js'

// Saga steps in display order. API step names (SAD 3.4) are grouped under these labels.
const STAGES = [
  { key: 'FIGHTER', label: 'Fighter', match: (name) => name.startsWith('FIGHTER') },
  { key: 'VENUE', label: 'Venue', match: (name) => name === 'VENUE' },
  { key: 'REFEREE', label: 'Referee', match: (name) => name === 'REFEREE' },
  { key: 'INSURANCE', label: 'Insurance', match: (name) => name === 'INSURANCE' },
  { key: 'PAYMENT', label: 'Payment', match: (name) => name === 'PREAUTH' || name === 'PREAUTH_RENEWAL' },
  { key: 'CAPTURE', label: 'Capture', match: (name) => name === 'CAPTURE' },
  { key: 'RESULT', label: 'Result', match: (name) => name === 'RESULT' || name === 'PAYOUT' },
]

const SUFFIX = { FIGHTER_A: 'A', FIGHTER_B: 'B', PREAUTH_RENEWAL: 'renewal', PAYOUT: 'payout' }

// One row per API step; stages the API has not reported yet appear as "Not started".
function rows(steps) {
  return STAGES.flatMap((stage) => {
    const matching = steps.filter((step) => step.name && stage.match(step.name))
    if (!matching.length) return [{ id: stage.key, label: stage.label, status: 'NOT_STARTED' }]
    return matching.map((step) => ({
      ...step,
      id: step.name,
      label: SUFFIX[step.name] ? `${stage.label} ${SUFFIX[step.name]}` : stage.label,
    }))
  })
}

export default function StepTimeline({ steps = [] }) {
  return (
    <ol className="timeline">
      {rows(steps).map((step) => {
        const { tone, icon } = stepStatus(step.status)
        return (
          <li key={step.id} className={`timeline-step timeline-${tone}`}>
            <span className="timeline-marker" aria-hidden="true">
              <Icon as={icon} />
            </span>
            <div className="timeline-body">
              <div className="timeline-head">
                <h3 className="timeline-label">{step.label}</h3>
                <StatusBadge status={step.status} />
              </div>
              <dl className="timeline-meta">
                {step.updatedAt && (
                  <div>
                    <dt>Updated</dt>
                    <dd><time dateTime={step.updatedAt}>{formatDateTime(step.updatedAt)}</time></dd>
                  </div>
                )}
                {step.status === 'PENDING' && (
                  <div>
                    <dt>Deadline</dt>
                    <dd>
                      {step.deadline
                        ? <time dateTime={step.deadline}>{formatDateTime(step.deadline)}</time>
                        : '—'}
                    </dd>
                  </div>
                )}
              </dl>
              {step.reason && (
                <p className={step.status === 'FAILED' || step.status === 'EXPIRED' ? 'reason reason-danger' : 'reason'}>
                  {(step.status === 'FAILED' || step.status === 'EXPIRED') && <Icon as={AlertTriangle} />}
                  <span>{step.reason}</span>
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
