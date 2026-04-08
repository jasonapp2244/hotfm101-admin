import { useState, useEffect, useRef } from 'react'
import { X, Mail, Send, CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react'
import { collection, addDoc, onSnapshot, doc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'

const DEFAULT_SUBJECT = 'Your Hot FM 101.5 Shoutout Has Been Approved! 🎉'

function buildDefaultMessage(name) {
  return `Hi ${name},

Great news! Your video shoutout submission to Hot FM 101.5 has been reviewed and approved by our team.

Your shoutout will be featured on our station. We'll notify you when it goes live on air!

Thank you for being an amazing part of the Hot FM 101.5 community. Keep the music love going!

Best regards,
Hot FM 101.5 Team`
}

// Status display config
const STATUS_UI = {
  queued: {
    icon:  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />,
    bg:    'bg-blue-50',
    title: 'Email Queued',
    desc:  'Your email is being sent by Firebase…',
  },
  sent: {
    icon:  <CheckCircle2 className="w-8 h-8 text-emerald-600" />,
    bg:    'bg-emerald-50',
    title: 'Email Sent!',
    desc:  null,
  },
  failed: {
    icon:  <AlertCircle className="w-8 h-8 text-red-500" />,
    bg:    'bg-red-50',
    title: 'Email Failed',
    desc:  null,
  },
}

export default function SendEmailModal({ shoutout, onClose, onSent }) {
  const [toEmail, setToEmail]     = useState(shoutout.email || '')
  const [subject, setSubject]     = useState(DEFAULT_SUBJECT)
  const [message, setMessage]     = useState(buildDefaultMessage(shoutout.name))
  const [status, setStatus]       = useState('idle')  // idle | queued | sent | failed
  const [errorMsg, setErrorMsg]   = useState('')
  const [queueDocId, setQueueDocId] = useState(null)
  const unsubRef = useRef(null)

  // Real-time listener: watch the emailQueue doc for Cloud Function status update
  useEffect(() => {
    if (!queueDocId) return

    const unsub = onSnapshot(doc(db, 'emailQueue', queueDocId), (snap) => {
      if (!snap.exists()) return
      const data = snap.data()

      if (data.status === 'sent') {
        setStatus('sent')
        onSent()
      } else if (data.status === 'failed') {
        setStatus('failed')
        setErrorMsg(data.error || 'The server could not send the email.')
      }
    })

    unsubRef.current = unsub

    // Timeout: if Cloud Function hasn't responded in 30s, show actionable error
    const timer = setTimeout(() => {
      setStatus('failed')
      setErrorMsg(
        'Cloud Function did not respond. Make sure the Firebase project is on the Blaze plan and the sendApprovalEmail function is deployed.'
      )
      unsub()
    }, 30000)

    return () => {
      unsub()
      clearTimeout(timer)
    }
  }, [queueDocId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async () => {
    if (!toEmail.trim() || status !== 'idle') return
    setStatus('queued')
    setErrorMsg('')

    try {
      const docRef = await addDoc(collection(db, 'emailQueue'), {
        to:         toEmail.trim(),
        toName:     shoutout.name,
        subject,
        message,
        shoutoutId: shoutout.id,
        status:     'pending',
        createdAt:  Timestamp.now(),
      })
      setQueueDocId(docRef.id)
    } catch (err) {
      console.error('emailQueue write error:', err)
      setStatus('failed')
      if (err?.code === 'permission-denied') {
        setErrorMsg('Permission denied. Firestore rules may not be deployed yet — run: firebase deploy --only firestore:rules')
      } else if (err?.code === 'unavailable' || err?.message?.includes('network')) {
        setErrorMsg('Could not reach Firebase. Check your connection.')
      } else {
        setErrorMsg(err?.message || 'Failed to queue email. Please try again.')
      }
    }
  }

  const handleRetry = () => {
    if (unsubRef.current) unsubRef.current()
    setQueueDocId(null)
    setStatus('idle')
    setErrorMsg('')
  }

  const isBusy = status === 'queued'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={status === 'idle' ? onClose : undefined}
    >
      <div
        className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm">Send Approval Email</div>
              <div className="text-xs text-gray-400">Sent via Firebase Cloud Functions</div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isBusy}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 rounded-lg flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Submitter badge */}
        <div className="px-6 pt-4 pb-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${shoutout.gradient} flex items-center justify-center shrink-0`}>
              <span className="text-white font-bold text-sm">{shoutout.name?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <div className="font-semibold text-sm text-gray-900">{shoutout.name}</div>
              <div className="text-xs text-gray-400">{shoutout.location}</div>
            </div>
            <span className="ml-auto text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
              Approved
            </span>
          </div>
        </div>

        {/* ── Form (idle state) ── */}
        {status === 'idle' && (
          <div className="px-6 pb-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">To</label>
              <input
                type="email"
                value={toEmail}
                onChange={e => setToEmail(e.target.value)}
                placeholder="recipient@email.com"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={7}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent resize-none leading-relaxed"
              />
            </div>

            {/* Firebase badge */}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-[8px] font-bold text-white">F</div>
              Sent via Firebase Cloud Functions · Gmail SMTP
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!toEmail.trim()}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-300 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-4 h-4" /> Send Email
              </button>
            </div>
          </div>
        )}

        {/* ── Status states (queued / sent / failed) ── */}
        {status !== 'idle' && (
          <div className="px-6 pb-8 pt-4 flex flex-col items-center text-center gap-4">
            <div className={`w-16 h-16 ${STATUS_UI[status]?.bg} rounded-full flex items-center justify-center`}>
              {STATUS_UI[status]?.icon}
            </div>
            <div>
              <div className="font-bold text-gray-900 text-lg">{STATUS_UI[status]?.title}</div>
              {status === 'queued' && (
                <div className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Waiting for Firebase to deliver to <span className="font-medium text-gray-700 ml-1">{toEmail}</span>
                </div>
              )}
              {status === 'sent' && (
                <div className="text-sm text-gray-500 mt-1">
                  Approval notification delivered to <span className="font-medium text-gray-700">{toEmail}</span>
                </div>
              )}
              {status === 'failed' && (
                <div className="text-sm text-red-500 mt-1 max-w-xs">{errorMsg}</div>
              )}
            </div>

            {status === 'sent' && (
              <button
                onClick={onClose}
                className="mt-2 px-8 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors"
              >
                Done
              </button>
            )}
            {status === 'failed' && (
              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleRetry}
                  className="flex-1 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-500 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Retry
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
