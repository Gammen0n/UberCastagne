import { RotateCcw, X } from 'lucide-react'
import Button from './Button.jsx'
import Icon from './Icon.jsx'

// fields: [{ name, label, type: 'select' | 'text' | 'number', options?: [{ value, label }], placeholder? }]
// `values` holds the current value of each field; '' means "not set".
export default function FilterBar({ fields, values, onChange, onReset, describe }) {
  const active = fields.filter((field) => field.removable !== false && values[field.name] !== '')

  return (
    <section className="filters" aria-label="Filters">
      <div className="filter-fields">
        {fields.map((field) => (
          <label key={field.name} className="field">
            <span className="field-label">{field.label}</span>
            {field.type === 'select' ? (
              <select
                className="field-control"
                value={values[field.name]}
                onChange={(event) => onChange(field.name, event.target.value)}
              >
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : (
              <input
                className="field-control"
                type={field.type}
                inputMode={field.type === 'number' ? 'numeric' : undefined}
                min={field.min}
                placeholder={field.placeholder}
                value={values[field.name]}
                onChange={(event) => onChange(field.name, event.target.value)}
              />
            )}
          </label>
        ))}
        <Button variant="ghost" icon={RotateCcw} onClick={onReset} disabled={!active.length} className="filter-reset">
          Reset
        </Button>
      </div>

      {active.length > 0 && (
        <ul className="filter-pills" aria-label="Active filters">
          {active.map((field) => (
            <li key={field.name}>
              <button
                type="button"
                className="pill"
                onClick={() => onChange(field.name, '')}
                aria-label={`Remove filter ${field.label}: ${describe(field, values[field.name])}`}
              >
                <span>{field.label}: {describe(field, values[field.name])}</span>
                <Icon as={X} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
