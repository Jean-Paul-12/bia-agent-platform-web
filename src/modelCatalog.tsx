import type {CatalogModel} from './types'

export function ModelPicker({
  models,
  value,
  onChange,
}: {
  models: CatalogModel[]
  value: string
  onChange: (id: string) => void
}) {
  const selected = models.find(m => m.id === value) ?? models.find(m => m.selectable && m.active)
  return (
    <div className="model-picker">
      <label className="model-picker-label">
        Modelo del agente
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
        >
          {models.map(m => (
            <option key={m.id} value={m.id} disabled={!!m.coming_soon || !m.selectable}>
              {m.ui_label || m.id}
              {m.coming_soon ? ' — Próximamente' : ''}
            </option>
          ))}
        </select>
      </label>
      {selected && (
        <p className="model-hint">
          {selected.coming_soon ? (
            <span className="badge warning">Próximamente</span>
          ) : (
            <span className="badge success">Disponible</span>
          )}
          {selected.ui_hint || selected.description}
        </p>
      )}
    </div>
  )
}
