import { useEffect, useRef, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastProvider,
  ToastTitle,
  ToastDescription,
  ToastViewport,
} from "@/components/ui/toast"
import { internalPathFromLocation } from "@/lib/opaque-routes"
import "./feedback-popup.css"

const LEGACY_TOAST_ROUTES = new Set(["/spin-wheel", "/checkin"])

function getCurrentRoutePath() {
  if (typeof window === "undefined") return "/"
  return internalPathFromLocation(window.location)
}

function useCurrentRoutePath() {
  const [path, setPath] = useState(getCurrentRoutePath)

  useEffect(() => {
    const updatePath = () => setPath(getCurrentRoutePath())
    window.addEventListener("hashchange", updatePath)
    window.addEventListener("popstate", updatePath)
    return () => {
      window.removeEventListener("hashchange", updatePath)
      window.removeEventListener("popstate", updatePath)
    }
  }, [])

  return path
}

export function Toaster() {
  const { toasts, dismiss } = useToast()
  const routePath = useCurrentRoutePath()
  const keepLegacyToast = LEGACY_TOAST_ROUTES.has(routePath)
  const activeToast = toasts.find((toast) => toast.open)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (keepLegacyToast || !activeToast) {
      if (dialog.open) dialog.close()
      return
    }

    if (!dialog.open) dialog.showModal()
  }, [activeToast, keepLegacyToast])

  const dismissActiveToast = () => {
    if (activeToast) dismiss(activeToast.id)
  }

  return (
    <>
      {keepLegacyToast && (
        <ToastProvider>
          {toasts.map(function ({ id, title, description, variant, action, ...props }) {
            return (
              <Toast key={id} variant={variant} duration={3500} {...props}>
                <div className="flex-1 min-w-0">
                  {title && <ToastTitle>{title}</ToastTitle>}
                  {description && <ToastDescription>{description}</ToastDescription>}
                  {action}
                </div>
                <ToastClose />
              </Toast>
            )
          })}
          <ToastViewport />
        </ToastProvider>
      )}
      <dialog
        ref={dialogRef}
        className="ielp-message-popup"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={!keepLegacyToast && activeToast?.title ? "ielp-message-popup-title" : undefined}
        aria-describedby={!keepLegacyToast && activeToast?.description ? "ielp-message-popup-description" : undefined}
        aria-label={!keepLegacyToast && !activeToast?.title ? "Message" : undefined}
        onCancel={(event) => {
          event.preventDefault()
          dismissActiveToast()
        }}
        data-testid="dialog-feedback-message"
      >
        {!keepLegacyToast && activeToast && (
          <>
            <div className="ielp-message-popup__message">
              {activeToast.title && <h2 id="ielp-message-popup-title">{activeToast.title}</h2>}
              {activeToast.description && (
                <p
                  id="ielp-message-popup-description"
                  className={!activeToast.title ? "ielp-message-popup__first-description" : undefined}
                >
                  {activeToast.description}
                </p>
              )}
              {activeToast.action}
            </div>
            <div className="ielp-message-popup__actions">
              <button
                type="button"
                autoFocus
                onClick={dismissActiveToast}
                data-testid="button-close-feedback-message"
              >
                OK
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  )
}
