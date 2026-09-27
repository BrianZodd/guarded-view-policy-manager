import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export default function Dashboard({ session }: { session: Session }) {
  return (
    <>
      <header className="topbar">
        <div>
          <strong>Guarded View</strong> <span className="muted">Policy Manager</span>
        </div>
        <div className="user">
          <span className="muted">{session.user.email}</span>
          <button onClick={() => supabase.auth.signOut()}>Log out</button>
        </div>
      </header>
      <main className="content">
        <p>Signed in.</p>
      </main>
    </>
  )
}
