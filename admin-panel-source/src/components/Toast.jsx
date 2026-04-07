import { useToast } from '../contexts/ToastContext'
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'

const icons = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
}

const borders = {
  success: 'border-l-emerald-500',
  error: 'border-l-red-500',
  info: 'border-l-blue-500',
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`bg-white rounded-xl shadow-lg border border-gray-100 border-l-4 ${borders[t.type]} px-4 py-3 flex items-center gap-3 min-w-72 animate-[slideIn_0.2s_ease-out]`}>
          {icons[t.type]}
          <span className="text-sm text-gray-700 flex-1">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
