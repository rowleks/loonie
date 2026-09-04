import { InviteCleanerForm } from '@/app/(admin)/admin/_components/invite-cleaner-form'
import { setCleanerActiveAction } from '@/app/actions/cleaners'
import { ActionForm } from '@/app/components/action-form'
import { requireRole } from '@/lib/auth'
import { getCleanersForAdmin } from '@/lib/booking-queries'

export default async function AdminCleanersPage() {
  const admin = await requireRole('admin')
  const cleaners = await getCleanersForAdmin(admin.orgId)

  return (
    <div>
      <h1 className="page-title">Cleaners</h1>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        Deactivated cleaners can&rsquo;t sign in and won&rsquo;t appear in
        assignment dropdowns. Their past jobs are kept for history.
      </p>

      <section className="mt-6">
        <h2 className="font-display text-lg font-bold">Team</h2>
        {cleaners.length === 0 ? (
          <div className="card mt-4 p-6">
            <p className="text-sm text-muted-foreground">
              No cleaners yet — add your first one below.
            </p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {cleaners.map((cleaner) => {
              const active = cleaner.deactivatedAt === null
              return (
                <div
                  key={cleaner.id}
                  className="card flex flex-wrap items-center justify-between gap-4 p-4"
                >
                  <div>
                    <div className="font-semibold">{cleaner.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {cleaner.email}
                      {cleaner.phone && ` · ${cleaner.phone}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {active ? 'Active' : 'Deactivated'}
                    </span>
                    <ActionForm
                      action={setCleanerActiveAction}
                      hidden={{ userId: cleaner.id, active: active ? '0' : '1' }}
                      label={active ? 'Deactivate' : 'Reactivate'}
                      pendingLabel='Saving…'
                      className={active ? 'btn-destructive' : 'btn-secondary'}
                      confirmMessage={
                        active
                          ? `Deactivate ${cleaner.name}? They will no longer be able to sign in.`
                          : undefined
                      }
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-bold">Add a cleaner</h2>
        <div className="mt-4">
          <InviteCleanerForm />
        </div>
      </section>
    </div>
  )
}
