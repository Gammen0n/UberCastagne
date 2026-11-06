import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../components/Button.jsx'
import Icon from '../components/Icon.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { EmptyState, ErrorBanner } from '../components/states.jsx'
import { useApi } from '../lib/api.js'
import { formatCode, formatDateTime, formatMoney } from '../lib/format.js'

export default function Orders() {
  const { status, data, error, reload } = useApi('/api/orders')
  const orders = data?.items ?? []

  return (
    <>
      <PageHeader
        title="My orders"
        subtitle="Follow each order step by step, and see why a step failed."
        count={status === 'ready' ? orders.length : undefined}
      />

      <section className="page-section" aria-label="Order list" aria-busy={status === 'loading'}>
        {status === 'loading' && (
          <div className="panel" role="status" aria-label="Loading orders">
            <span className="skeleton skeleton-block" />
            <span className="skeleton skeleton-block" />
          </div>
        )}
        {status === 'error' && (
          <ErrorBanner
            title="Could not load your orders"
            message={error}
            onRetry={reload}
            action={<Button variant="ghost" size="sm" to="/orders/demo">See a demo order</Button>}
          />
        )}
        {status === 'ready' && orders.length === 0 && (
          <EmptyState
            title="You have no orders yet"
            message="Pick a fighter and a venue to book your first supervised fight."
            action={<Button to="/fighters">Browse fighters</Button>}
          />
        )}
        {status === 'ready' && orders.length > 0 && (
          <ul className="order-list">
            {orders.map((order) => (
              <li key={order.id}>
                <Link to={`/orders/${order.id}`} className="order-row">
                  <span className="order-package">{formatCode(order.package)}</span>
                  <span className="order-date">{formatDateTime(order.fightAt)}</span>
                  <span className="order-price">{formatMoney(order.price?.total)}</span>
                  <StatusBadge status={order.status} kind="order" />
                  <Icon as={ChevronRight} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
