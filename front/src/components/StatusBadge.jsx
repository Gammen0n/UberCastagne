import { Ban, CheckCircle2, Circle, CircleDashed, Clock, RotateCcw, TimerOff, XCircle } from 'lucide-react'
import Icon from './Icon.jsx'

// Each status has an icon and a word, so colour is never the only signal.
const STEP_STATUS = {
  NOT_STARTED: { tone: 'neutral', icon: CircleDashed, text: 'Not started' },
  PENDING: { tone: 'warning', icon: Clock, text: 'Pending' },
  DONE: { tone: 'success', icon: CheckCircle2, text: 'Done' },
  FAILED: { tone: 'danger', icon: XCircle, text: 'Failed' },
  EXPIRED: { tone: 'neutral', icon: TimerOff, text: 'Expired' },
  COMPENSATED: { tone: 'info', icon: RotateCcw, text: 'Compensated' },
}

const ORDER_STATUS = {
  CREATED: { tone: 'neutral', icon: Circle, text: 'Created' },
  IN_PROGRESS: { tone: 'warning', icon: Clock, text: 'In progress' },
  PAYMENT_PENDING: { tone: 'warning', icon: Clock, text: 'Payment pending' },
  CONFIRMED: { tone: 'success', icon: CheckCircle2, text: 'Confirmed' },
  PAID: { tone: 'success', icon: CheckCircle2, text: 'Paid' },
  COMPLETED: { tone: 'success', icon: CheckCircle2, text: 'Completed' },
  CANCELLED: { tone: 'neutral', icon: Ban, text: 'Cancelled' },
  FAILED: { tone: 'danger', icon: XCircle, text: 'Failed' },
}

const UNKNOWN = { tone: 'neutral', icon: Circle }

export function stepStatus(status) {
  return STEP_STATUS[status] ?? { ...UNKNOWN, text: status ?? 'Unknown' }
}

export default function StatusBadge({ status, kind = 'step' }) {
  const config = (kind === 'order' ? ORDER_STATUS[status] : STEP_STATUS[status]) ?? {
    ...UNKNOWN,
    text: status ?? 'Unknown',
  }
  return (
    <span className={`badge badge-${config.tone}`}>
      <Icon as={config.icon} />
      {config.text}
    </span>
  )
}
