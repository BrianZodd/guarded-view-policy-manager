import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, type SharedItem } from '../lib/supabase'
import { describeRestriction } from '../lib/restrictions'
import ItemForm from './ItemForm'

type Editing = { mode: 'closed' } | { mode: 'new' } | { mode: 'edit'; item: SharedItem }

export default function Dashboard({ session }: { session: Session }) {
  const [items, setItems] = useState<SharedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Editing>({ mode: 'closed' })
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setError(null)
    const { data, error } = await supabase
      .from('shared_items')
      .select('*, item_restrictions(*)')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setItems(data as SharedItem[])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleDelete(item: SharedItem) {
    if (!window.confirm(`Delete "${item.title}" and its restrictions?`)) return
    const { error } = await supabase.from('shared_items').delete().eq('id', item.id)
    if (error) setError(error.message)
    else setItems((prev) => prev.filter((i) => i.id !== item.id))
  }

  function handleSaved() {
    setEditing({ mode: 'closed' })
    load()
  }

  const q = search.trim().toLowerCase()
  const visible = q
    ? items.filter((i) => i.title.toLowerCase().includes(q) || i.recipient.toLowerCase().includes(q))
    : items

  return (
    <>
      <header className="topbar">
        <div>
          <strong>Guarded View</strong> <span className="muted">Policy Manager</span>
        </div>
        <div className="user">
          <span className="muted email">{session.user.email}</span>
          <button onClick={() => supabase.auth.signOut()}>Log out</button>
        </div>
      </header>

      <main className="content">
        {editing.mode !== 'closed' ? (
          <ItemForm
            key={editing.mode === 'edit' ? editing.item.id : 'new'}
            item={editing.mode === 'edit' ? editing.item : null}
            onSaved={handleSaved}
            onCancel={() => setEditing({ mode: 'closed' })}
          />
        ) : (
          <>
            <div className="toolbar">
              <h2>My shared items</h2>
              <div className="toolbar-right">
                <input
                  className="search"
                  placeholder="Search title or recipient"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button className="primary" onClick={() => setEditing({ mode: 'new' })}>
                  + New item
                </button>
              </div>
            </div>

            {error && <p className="error">{error}</p>}
            {loading ? (
              <p className="muted">Loading…</p>
            ) : visible.length === 0 ? (
              <div className="empty">
                {items.length === 0
                  ? 'Nothing shared yet. Create an item and attach the viewing restrictions the recipient has to meet.'
                  : 'No items match your search.'}
              </div>
            ) : (
              <ul className="items">
                {visible.map((item) => (
                  <li key={item.id} className="item">
                    <div className="item-head">
                      <div>
                        <h3>{item.title}</h3>
                        <p className="muted">
                          To {item.recipient} · updated {new Date(item.updated_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="item-actions">
                        <button onClick={() => setEditing({ mode: 'edit', item })}>Edit</button>
                        <button className="danger" onClick={() => handleDelete(item)}>
                          Delete
                        </button>
                      </div>
                    </div>
                    {item.content && <p className="item-content">{item.content}</p>}
                    <div className="chips">
                      {item.item_restrictions.map((r) => (
                        <span key={r.id} className="chip" title={r.restriction_type}>
                          {describeRestriction(r.restriction_type, r.value)}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </>
  )
}
