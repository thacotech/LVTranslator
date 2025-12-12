import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { notification } from 'ant-design-vue'
import fc from 'fast-check'
import { notificationService, useNotification } from '@/services/notificationService'
import type { ErrorMessage } from '@/types/validation'

// **Feature: vuejs-refactor, Property 17: Notification system functionality**
// **Validates: Requirements 8.2**

// Mock Ant Design notification
vi.mock('ant-design-vue', () => ({
  notification: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    destroy: vi.fn(),
    config: vi.fn(),
  }
}))

const mockNotification = vi.mocked(notification)

// Create i18n instance for testing
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: {
      'notifications.success.title': 'Success',
      'notifications.error.title': 'Error',
      'notifications.warning.title': 'Warning',
      'notifications.info.title': 'Information',
      'test.message': 'Test message',
    }
  }
})

describe('Notification System Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('Property 17: For any user action requiring feedback, appropriate notifications should appear using Ant Design notification system', () => {
    fc.assert(fc.property(
      fc.constantFrom('success', 'error', 'warning', 'info'),
      fc.string({ minLength: 1, maxLength: 100 }),
      fc.option(fc.string({ minLength: 1, maxLength: 200 })),
      fc.option(fc.integer({ min: 1, max: 10 })),
      (severity, title, description, duration) => {
        // Test the notification service directly
        const options = {
          title,
          description: description || undefined,
          duration: duration || undefined,
        }

        // Call the appropriate notification method
        switch (severity) {
          case 'success':
            notificationService.success(options)
            expect(mockNotification.success).toHaveBeenCalledWith(
              expect.objectContaining({
                message: title,
                description: description || undefined,
                duration: duration ?? 4.5,
                placement: 'topRight',
                showProgress: true,
                closable: true,
              })
            )
            break
          case 'error':
            notificationService.error(options)
            expect(mockNotification.error).toHaveBeenCalledWith(
              expect.objectContaining({
                message: title,
                description: description || undefined,
                duration: duration ?? 0, // Errors don't auto-dismiss
                placement: 'topRight',
                showProgress: false,
                closable: true,
              })
            )
            break
          case 'warning':
            notificationService.warning(options)
            expect(mockNotification.warning).toHaveBeenCalledWith(
              expect.objectContaining({
                message: title,
                description: description || undefined,
                duration: duration ?? 4.5,
                placement: 'topRight',
                showProgress: true,
                closable: true,
              })
            )
            break
          case 'info':
            notificationService.info(options)
            expect(mockNotification.info).toHaveBeenCalledWith(
              expect.objectContaining({
                message: title,
                description: description || undefined,
                duration: duration ?? 4.5,
                placement: 'topRight',
                showProgress: true,
                closable: true,
              })
            )
            break
        }

        return true
      }
    ), { numRuns: 100 })
  })

  it('Property 17: For any ErrorMessage object, showErrorMessage should display appropriate notification based on severity', () => {
    fc.assert(fc.property(
      fc.constantFrom('success', 'error', 'warning', 'info'),
      fc.string({ minLength: 1, maxLength: 100 }),
      fc.string({ minLength: 1, maxLength: 200 }),
      fc.option(fc.string({ minLength: 1, maxLength: 50 })),
      (severity, title, description, action) => {
        const errorMessage: ErrorMessage = {
          title,
          description,
          action: action || undefined,
          severity: severity as 'success' | 'error' | 'warning' | 'info',
          timestamp: new Date(),
        }

        notificationService.showErrorMessage(errorMessage)

        // Verify the correct notification method was called
        switch (severity) {
          case 'success':
            expect(mockNotification.success).toHaveBeenCalledWith(
              expect.objectContaining({
                message: title,
                description,
                duration: 4.5,
              })
            )
            break
          case 'error':
            expect(mockNotification.error).toHaveBeenCalledWith(
              expect.objectContaining({
                message: title,
                description,
                duration: 0,
              })
            )
            break
          case 'warning':
            expect(mockNotification.warning).toHaveBeenCalledWith(
              expect.objectContaining({
                message: title,
                description,
                duration: 4.5,
              })
            )
            break
          case 'info':
            expect(mockNotification.info).toHaveBeenCalledWith(
              expect.objectContaining({
                message: title,
                description,
                duration: 4.5,
              })
            )
            break
        }

        return true
      }
    ), { numRuns: 100 })
  })

  it('Property 17: For any i18n key, useNotification composable should translate messages correctly', () => {
    fc.assert(fc.property(
      fc.constantFrom('success', 'error', 'warning', 'info'),
      fc.constantFrom('notifications.success.title', 'notifications.error.title', 'notifications.warning.title', 'notifications.info.title'),
      fc.option(fc.constantFrom('test.message')),
      (notificationType, titleKey, descriptionKey) => {
        // Create a test component that uses the notification composable
        const TestComponent = {
          template: '<div></div>',
          setup() {
            const { showSuccess, showError, showWarning, showInfo } = useNotification()
            
            // Call the appropriate method based on type
            switch (notificationType) {
              case 'success':
                showSuccess(titleKey, descriptionKey)
                break
              case 'error':
                showError(titleKey, descriptionKey)
                break
              case 'warning':
                showWarning(titleKey, descriptionKey)
                break
              case 'info':
                showInfo(titleKey, descriptionKey)
                break
            }
            
            return {}
          }
        }

        const wrapper = mount(TestComponent, {
          global: {
            plugins: [i18n]
          }
        })

        // Verify that the notification was called with translated text
        const expectedTitle = i18n.global.t(titleKey)
        const expectedDescription = descriptionKey ? i18n.global.t(descriptionKey) : undefined

        switch (notificationType) {
          case 'success':
            expect(mockNotification.success).toHaveBeenCalledWith(
              expect.objectContaining({
                message: expectedTitle,
                description: expectedDescription,
              })
            )
            break
          case 'error':
            expect(mockNotification.error).toHaveBeenCalledWith(
              expect.objectContaining({
                message: expectedTitle,
                description: expectedDescription,
              })
            )
            break
          case 'warning':
            expect(mockNotification.warning).toHaveBeenCalledWith(
              expect.objectContaining({
                message: expectedTitle,
                description: expectedDescription,
              })
            )
            break
          case 'info':
            expect(mockNotification.info).toHaveBeenCalledWith(
              expect.objectContaining({
                message: expectedTitle,
                description: expectedDescription,
              })
            )
            break
        }

        wrapper.unmount()
        return true
      }
    ), { numRuns: 100 })
  })

  it('Property 17: For any notification destroy operation, the correct Ant Design method should be called', () => {
    fc.assert(fc.property(
      fc.option(fc.string({ minLength: 1, maxLength: 20 })),
      (key) => {
        if (key) {
          notificationService.destroy(key)
          expect(mockNotification.destroy).toHaveBeenCalledWith(key)
        } else {
          notificationService.destroyAll()
          expect(mockNotification.destroy).toHaveBeenCalledWith()
        }

        return true
      }
    ), { numRuns: 100 })
  })
})