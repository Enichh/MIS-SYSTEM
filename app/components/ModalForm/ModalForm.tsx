'use client'

import { useEffect } from 'react'
import { PROJECT_STATUS, PROJECT_PRIORITY, TASK_STATUS, TASK_PRIORITY } from '@/lib/constants'

type FieldConfig = {
  name: string
  label: string
  type: string
  required: boolean
  options?: string[]
  min?: number
  max?: number
}

type FormConfig = {
  employee: FieldConfig[]
  project: FieldConfig[]
  task: FieldConfig[]
}

const formConfigs: FormConfig = {
  employee: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'role', label: 'Role', type: 'text', required: true },
    { name: 'department', label: 'Department', type: 'text', required: true },
    { name: 'skills', label: 'Skills (comma-separated)', type: 'text', required: false },
  ],
  project: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea', required: false },
    { name: 'status', label: 'Status', type: 'select', options: [...PROJECT_STATUS], required: true },
    { name: 'priority', label: 'Priority', type: 'select', options: [...PROJECT_PRIORITY], required: true },
    { name: 'progress', label: 'Progress (%)', type: 'number', required: true, min: 0, max: 100 },
    { name: 'startDate', label: 'Start Date', type: 'date', required: false },
    { name: 'endDate', label: 'End Date', type: 'date', required: false },
  ],
  task: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea', required: false },
    { name: 'status', label: 'Status', type: 'select', options: [...TASK_STATUS], required: true },
    { name: 'priority', label: 'Priority', type: 'select', options: [...TASK_PRIORITY], required: true },
    { name: 'projectId', label: 'Project ID', type: 'text', required: true },
    { name: 'assignedTo', label: 'Assigned To (Employee ID)', type: 'text', required: false },
    { name: 'dueDate', label: 'Due Date', type: 'date', required: false },
  ],
}

export default function ModalForm() {
  useEffect(() => {
    const modalOverlay = document.getElementById('modal-overlay')
    const modalForm = document.getElementById('modal-form')
    const modalTitle = document.getElementById('modal-title')
    const modalClose = document.getElementById('modal-close')
    const notification = document.getElementById('notification')

    if (!modalOverlay || !modalForm || !modalTitle || !modalClose || !notification) return

    // Open modal for create actions
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.dataset.action === 'create') {
        const entity = target.dataset.entity as keyof typeof formConfigs
        if (entity && formConfigs[entity]) {
          modalTitle.textContent = `Add ${entity.charAt(0).toUpperCase() + entity.slice(1)}`
          generateForm(entity)
          modalOverlay.classList.remove('hidden')
        }
      }
    }

    document.addEventListener('click', handleClick)

    // Close modal
    const handleCloseClick = () => {
      modalOverlay!.classList.add('hidden')
      modalForm!.innerHTML = ''
    }
    modalClose.addEventListener('click', handleCloseClick)

    // Close modal on overlay click
    const handleOverlayClick = (e: Event) => {
      if (e.target === modalOverlay) {
        modalOverlay!.classList.add('hidden')
        modalForm!.innerHTML = ''
      }
    }
    modalOverlay.addEventListener('click', handleOverlayClick)

    function generateForm(entity: keyof typeof formConfigs) {
      modalForm!.innerHTML = ''
      const fields = formConfigs[entity]

      fields.forEach((field) => {
        const wrapper = document.createElement('div')
        wrapper.className = 'form-group'

        const label = document.createElement('label')
        label.textContent = field.label
        label.htmlFor = field.name

        let input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

        if (field.type === 'select') {
          input = document.createElement('select')
          field.options?.forEach((option) => {
            const opt = document.createElement('option')
            opt.value = option
            opt.textContent = option
            input.appendChild(opt)
          })
          if (field.name === 'status') input.value = entity === 'project' ? 'active' : 'pending'
          if (field.name === 'priority') input.value = 'medium'
        } else if (field.type === 'textarea') {
          input = document.createElement('textarea')
          input.rows = 3
        } else {
          input = document.createElement('input')
          input.type = field.type
          if (field.min !== undefined) input.min = field.min.toString()
          if (field.max !== undefined) input.max = field.max.toString()
        }

        input.id = field.name
        input.name = field.name
        if (field.required) input.required = true

        wrapper.appendChild(label)
        wrapper.appendChild(input)
        modalForm!.appendChild(wrapper)
      })

      const submitButton = document.createElement('button')
      submitButton.type = 'submit'
      submitButton.className = 'btn-primary'
      submitButton.textContent = 'Submit'
      modalForm!.appendChild(submitButton)

      // Handle form submission
      modalForm!.addEventListener('submit', async (e) => {
        e.preventDefault()
        const formData = new FormData(modalForm! as HTMLFormElement)
        const data: Record<string, unknown> = {}

        for (const [key, value] of formData.entries()) {
          if (key === 'skills' && value) {
            data[key] = (value as string).split(',').map((s) => s.trim())
          } else if (key === 'progress' && value) {
            data[key] = parseInt(value as string, 10)
          } else if (key === 'assignedTo' && value === '') {
            data[key] = null
          } else {
            data[key] = value
          }
        }

        try {
          const response = await fetch(`/api/${entity}s`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })

          const result = await response.json()

          if (response.ok) {
            showNotification(`${entity.charAt(0).toUpperCase() + entity.slice(1)} created successfully!`, 'success')
            modalOverlay!.classList.add('hidden')
            modalForm!.innerHTML = ''
            window.location.reload()
          } else {
            showNotification(`Error: ${result.message || 'Failed to create'}`, 'error')
          }
        } catch (error) {
          showNotification('Error: Failed to connect to server', 'error')
        }
      })
    }

    function showNotification(message: string, type: 'success' | 'error') {
      notification!.textContent = message
      notification!.className = `notification ${type}`
      notification!.classList.remove('hidden')

      setTimeout(() => {
        notification!.classList.add('hidden')
      }, 3000)
    }

    // Cleanup event listeners on unmount
    return () => {
      document.removeEventListener('click', handleClick)
      modalClose.removeEventListener('click', handleCloseClick)
      modalOverlay.removeEventListener('click', handleOverlayClick)
    }
  }, [])

  return null
}
