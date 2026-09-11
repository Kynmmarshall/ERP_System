import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { fetchMyNotifications, markNotificationRead } from '@/services/hrService'

export function NotificationsSection() {
  const queryClient = useQueryClient()
  const notificationsQuery = useQuery({ queryKey: ['my-notifications'], queryFn: fetchMyNotifications })

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-notifications'] }),
  })

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-text">Notifications</h2>
      <div className="mt-3">
        {notificationsQuery.isError ? (
          <ErrorState message="Could not load your notifications." />
        ) : notificationsQuery.isPending ? (
          <Skeleton className="h-16 w-full" />
        ) : notificationsQuery.data.length === 0 ? (
          <EmptyState title="No notifications" message="Updates about your requests appear here." />
        ) : (
          <div className="flex flex-col gap-2">
            {notificationsQuery.data.map((notification) => (
              <div key={notification.id} className="rounded-lg border border-border bg-surface p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-sm ${notification.readAt ? 'text-muted' : 'text-text'}`}>
                    {notification.message}
                  </p>
                  {!notification.readAt ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      isLoading={markReadMutation.isPending}
                      onClick={() => markReadMutation.mutate(notification.id)}
                    >
                      Mark read
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
