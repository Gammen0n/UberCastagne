import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Info } from 'lucide-react'
import Button from '../components/Button.jsx'
import Icon from '../components/Icon.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import StepTimeline from '../components/StepTimeline.jsx'
import { ErrorBanner } from '../components/states.jsx'
import { useApi } from '../lib/api.js'
import { EMPTY, formatCode, formatDateTime, formatMoney } from '../lib/format.js'
import { demoOrder } from './demoOrder.js'

const REFRESH_MS = 5000

function Summary({ order }) {
  const fighters = order.fighters?.map((fighter) => fighter.displayName).join(' vs ') || EMPTY
  const venue = order.venue ? [order.venue.name, order.venue.city].filter(Boolean).join(', ') : EMPTY

  return (
    <section className="panel summary" aria-label="Order summary">
      <div className="summary-head">
        <h2 className="section-title">Summary</h2>
        <StatusBadge status={order.status} kind="order" />
      </div>
      <dl className="summary-grid">
        <div><dt>Package</dt><dd>{formatCode(order.package)}</dd></div>
        <div><dt>Fighters</dt><dd>{fighters}</dd></div>
        <div><dt>Venue</dt><dd>{venue}</dd></div>
        <div><dt>Date</dt><dd>{formatDateTime(order.fightAt)}</dd></div>
        <div className="summary-total"><dt>Total</dt><dd>{formatMoney(order.price?.total)}</dd></div>
      </dl>
    </section>
  )
}

function SummarySkeleton() {
  return (
    <div className="panel" role="status" aria-label="Loading order">
      <span className="skeleton skeleton-line skeleton-line-md" />
      <span className="skeleton skeleton-block" />
      <span className="skeleton skeleton-block" />
    </div>
  )
}

export default function OrderTracking() {
  const { id } = useParams()
  const isDemo = id === 'demo'
  const demoLoader = useCallback(() => demoOrder(), [])
  const { status, data: order, error, reload } = useApi(`/api/orders/${encodeURIComponent(id)}`, {
    loader: isDemo ? demoLoader : undefined,
    refreshMs: isDemo ? undefined : REFRESH_MS,
  })

  return (
    <>
      <PageHeader
        title="Order tracking"
        subtitle={isDemo ? 'Example order: a Show where one fighter declined.' : `Order ${id} · refreshed every 5 seconds`}
      />

      {isDemo && (
        <div className="banner banner-info" role="note">
          <Icon as={Info} size="md" className="banner-icon" />
          <div className="banner-body">
            <p className="banner-title">Demo data</p>
            <p className="banner-message">
              This page shows a fictitious order. Real orders will appear here once the Order service is available.
            </p>
          </div>
        </div>
      )}

      {status === 'loading' && <SummarySkeleton />}
      {status === 'error' && (
        <ErrorBanner
          title="Could not load this order"
          message={error}
          onRetry={reload}
          action={<Button variant="ghost" size="sm" to="/orders/demo">See a demo order</Button>}
        />
      )}
      {order && (
        <div className="tracking">
          <Summary order={order} />
          <section className="panel" aria-labelledby="steps-title">
            <h2 id="steps-title" className="section-title">Steps</h2>
            <StepTimeline steps={order.steps} />
          </section>
        </div>
      )}
    </>
  )
}
