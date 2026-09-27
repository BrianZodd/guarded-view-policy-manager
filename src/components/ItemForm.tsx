import { useState, type FormEvent } from 'react'
import { supabase, type RestrictionType, type SharedItem } from '../lib/supabase'
import { RESTRICTIONS } from '../lib/restrictions'

type Props = {
  item: SharedItem | null
  onSaved: () => void
  onCancel: () => void
}

type Selection = Partial<Record<RestrictionType, string>>

function initialSelection(item: SharedItem | null): Selection {
  const sel: Selection = {}
  item?.item_restrictions.forEach((r) => {
    sel[r.restriction_type] = r.value
  })
  return sel
}

export default function ItemForm({ item, onSaved, onCancel }: Props) {
  const [title, setTitle] = useState(item?.title ?? '')
  const [recipient, setRecipient] = useState(item?.recipient ?? '')
  const [content, setContent] = useState(item?.content ?? '')
  const [selection, setSelection] = useState<Selection>(() => initialSelection(item))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(type: RestrictionType) {
    setSelection((prev) => {
      const next = { ...prev }
      if (type in next) delete next[type]
      else next[type] = ''
      return next
    })
  }

  function validate(): string | null {
    const chosen = Object.entries(selection) as [RestrictionType, string][]
    if (chosen.length === 0) return 'Pick at least one viewing restriction.'
    for (const [type, value] of chosen) {
      const def = RESTRICTIONS.find((r) => r.type === type)!
      if (def.input === 'number') {
        const n = Number(value)
        if (!Number.isInteger(n) || n < 1) return `${def.label} needs a whole number of at least 1.`
      }
      if (def.input === 'text' && !value.trim()) return `${def.label} needs a value.`
    }
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    setError(null)

    const fields = { title: title.trim(), recipient: recipient.trim(), content }
    let itemId = item?.id

    if (itemId) {
      const { error } = await supabase.from('shared_items').update(fields).eq('id', itemId)
      if (error) return fail(error.message)
      const { error: delError } = await supabase.from('item_restrictions').delete().eq('item_id', itemId)
      if (delError) return fail(delError.message)
    } else {
      const { data, error } = await supabase.from('shared_items').insert(fields).select('id').single()
      if (error) return fail(error.message)
      itemId = data.id
    }

    const rows = (Object.entries(selection) as [RestrictionType, string][]).map(([restriction_type, value]) => ({
      item_id: itemId,
      restriction_type,
      value: value.trim(),
    }))
    const { error: insError } = await supabase.from('item_restrictions').insert(rows)
    if (insError) return fail(insError.message)

    setBusy(false)
    onSaved()
  }

  function fail(message: string) {
    setError(message)
    setBusy(false)
  }

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <h2>{item ? 'Edit shared item' : 'New shared item'}</h2>
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} placeholder="Vacation photo" />
      </label>
      <label>
        Recipient
        <input value={recipient} onChange={(e) => setRecipient(e.target.value)} required maxLength={120} placeholder="Alice" />
      </label>
      <label>
        Message or description
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} placeholder="Only open this when you're alone." />
      </label>

      <fieldset>
        <legend>Viewing restrictions</legend>
        {RESTRICTIONS.map((def) => {
          const checked = def.type in selection
          return (
            <div key={def.type} className={checked ? 'restriction on' : 'restriction'}>
              <label className="check">
                <input type="checkbox" checked={checked} onChange={() => toggle(def.type)} />
                <span>
                  <strong>{def.label}</strong> <code>{def.type}</code>
                  <br />
                  <small className="muted">{def.help}</small>
                </span>
              </label>
              {checked && def.input !== 'none' && (
                <input
                  className="value"
                  type={def.input === 'number' ? 'number' : 'text'}
                  min={def.input === 'number' ? 1 : undefined}
                  value={selection[def.type] ?? ''}
                  placeholder={def.placeholder}
                  onChange={(e) => setSelection((prev) => ({ ...prev, [def.type]: e.target.value }))}
                />
              )}
              {checked && def.note && <p className="note">{def.note}</p>}
            </div>
          )
        })}
      </fieldset>

      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="primary" disabled={busy}>
          {busy ? 'Saving…' : item ? 'Save changes' : 'Create item'}
        </button>
      </div>
    </form>
  )
}
