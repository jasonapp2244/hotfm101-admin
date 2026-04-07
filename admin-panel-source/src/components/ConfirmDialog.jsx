import Modal from './Modal'

export default function ConfirmDialog({ isOpen, onConfirm, onCancel, title = 'Confirm', message, confirmLabel = 'Delete', variant = 'danger' }) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 rounded-xl text-sm font-medium text-white ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-accent hover:bg-accent-hover'}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
