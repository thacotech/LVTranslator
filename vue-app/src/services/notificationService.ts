import { notification } from 'ant-design-vue'
import type { ErrorMessage } from '@/types/validation'
import { useI18n } from 'vue-i18n'

export interface NotificationOptions {
  title: string
  description?: string
  duration?: number
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  showProgress?: boolean
  closable?: boolean
  onClick?: () => void
  onClose?: () => void
}

export interface NotificationService {
  success(options: NotificationOptions): void
  error(options: NotificationOptions): void
  warning(options: NotificationOptions): void
  info(options: NotificationOptions): void
  showErrorMessage(errorMessage: ErrorMessage): void
  destroy(key?: string): void
  destroyAll(): void
}

class NotificationServiceImpl implements NotificationService {
  private defaultDuration = 4.5 // seconds
  private defaultPlacement: 'topRight' = 'topRight'

  success(options: NotificationOptions): void {
    notification.success({
      message: options.title,
      description: options.description,
      duration: options.duration ?? this.defaultDuration,
      placement: options.placement ?? this.defaultPlacement,
      showProgress: options.showProgress ?? true,
      closable: options.closable ?? true,
      onClick: options.onClick,
      onClose: options.onClose,
    })
  }

  error(options: NotificationOptions): void {
    notification.error({
      message: options.title,
      description: options.description,
      duration: options.duration ?? 0, // Don't auto-dismiss errors
      placement: options.placement ?? this.defaultPlacement,
      showProgress: options.showProgress ?? false,
      closable: options.closable ?? true,
      onClick: options.onClick,
      onClose: options.onClose,
    })
  }

  warning(options: NotificationOptions): void {
    notification.warning({
      message: options.title,
      description: options.description,
      duration: options.duration ?? this.defaultDuration,
      placement: options.placement ?? this.defaultPlacement,
      showProgress: options.showProgress ?? true,
      closable: options.closable ?? true,
      onClick: options.onClick,
      onClose: options.onClose,
    })
  }

  info(options: NotificationOptions): void {
    notification.info({
      message: options.title,
      description: options.description,
      duration: options.duration ?? this.defaultDuration,
      placement: options.placement ?? this.defaultPlacement,
      showProgress: options.showProgress ?? true,
      closable: options.closable ?? true,
      onClick: options.onClick,
      onClose: options.onClose,
    })
  }

  showErrorMessage(errorMessage: ErrorMessage): void {
    const options: NotificationOptions = {
      title: errorMessage.title,
      description: errorMessage.description,
      duration: errorMessage.severity === 'error' ? 0 : this.defaultDuration,
    }

    switch (errorMessage.severity) {
      case 'error':
        this.error(options)
        break
      case 'warning':
        this.warning(options)
        break
      case 'info':
        this.info(options)
        break
      case 'success':
        this.success(options)
        break
      default:
        this.error(options)
    }
  }

  destroy(key?: string): void {
    if (key) {
      notification.destroy(key)
    } else {
      notification.destroy()
    }
  }

  destroyAll(): void {
    notification.destroy()
  }
}

// Create singleton instance
export const notificationService = new NotificationServiceImpl()

// Composable for use in Vue components
export function useNotification() {
  const { t } = useI18n()

  const showSuccess = (titleKey: string, descriptionKey?: string, options?: Partial<NotificationOptions>) => {
    notificationService.success({
      title: t(titleKey),
      description: descriptionKey ? t(descriptionKey) : undefined,
      ...options,
    })
  }

  const showError = (titleKey: string, descriptionKey?: string, options?: Partial<NotificationOptions>) => {
    notificationService.error({
      title: t(titleKey),
      description: descriptionKey ? t(descriptionKey) : undefined,
      ...options,
    })
  }

  const showWarning = (titleKey: string, descriptionKey?: string, options?: Partial<NotificationOptions>) => {
    notificationService.warning({
      title: t(titleKey),
      description: descriptionKey ? t(descriptionKey) : undefined,
      ...options,
    })
  }

  const showInfo = (titleKey: string, descriptionKey?: string, options?: Partial<NotificationOptions>) => {
    notificationService.info({
      title: t(titleKey),
      description: descriptionKey ? t(descriptionKey) : undefined,
      ...options,
    })
  }

  const showErrorMessage = (errorMessage: ErrorMessage) => {
    notificationService.showErrorMessage(errorMessage)
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showErrorMessage,
    destroy: notificationService.destroy,
    destroyAll: notificationService.destroyAll,
  }
}

// Global notification configuration
export function configureNotifications() {
  notification.config({
    placement: 'topRight',
    top: '24px',
    duration: 4.5,
    rtl: false,
    maxCount: 5,
  })
}