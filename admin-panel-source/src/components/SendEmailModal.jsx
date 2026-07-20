import { useState } from "react"
import { X, Mail, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import emailjs from "@emailjs/browser"

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  || ""
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || ""
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  || ""

function buildMessage(name) {
  return `Hi ${name},\n\nGreat news! Your video shoutout submission to Hot FM 101.5 has been reviewed and approved by our team.\n\nYour shoutout will be featured on our station. Thank you for being part of the Hot FM 101.5 community!\n\nBest regards,\nHot FM 101.5 Team`
}

export default function SendEmailModal({ shoutout, onClose, onSent }) {
  const [toEmail, setToEmail] = useState(shoutout.email || "")
  const [subject, setSubject] = useState("Your Hot FM 101.5 Shoutout Has Been Approved!")
  const [message, setMessage] = useState(buildMessage(shoutout.name))
  const [status,  setStatus]  = useState("idle")
  const [errMsg,  setErrMsg]  = useState("")

  const isConfigured = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY)

  const handleSend = async () => {
    if (!toEmail.trim() || status !== "idle") return
    setStatus("sending")
    if (!isConfigured) {
      await new Promise(r => setTimeout(r, 1200))
      setStatus("success"); onSent(); return
    }
    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_ID,
        { to_email: toEmail.trim(), to_name: shoutout.name, from_name: "Hot FM 101.5", subject, message },
        PUBLIC_KEY)
      setStatus("success"); onSent()
    } catch (err) {
      setStatus("error"); setErrMsg(err?.text || "Failed to send email.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={status === "idle" ? onClose : undefined}>
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center"><Mail className="w-5 h-5 text-emerald-600" /></div>
            <div><div className="font-bold text-gray-900 text-sm">Send Approval Email</div><div className="text-xs text-gray-400">Notify the submitter their shoutout is approved</div></div>
          </div>
          <button onClick={onClose} disabled={status === "sending"} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 rounded-lg flex items-center justify-center transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        <div className="px-6 pt-4 pb-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${shoutout.gradient} flex items-center justify-center shrink-0`}><span className="text-white font-bold text-sm">{shoutout.name?.[0]?.toUpperCase()}</span></div>
            <div><div className="font-semibold text-sm text-gray-900">{shoutout.name}</div><div className="text-xs text-gray-400">{shoutout.location}</div></div>
            <span className="ml-auto text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">Approved</span>
          </div>
        </div>

        {status === "idle" && (
          <div className="px-6 pb-6 space-y-4">
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">To</label><input type="email" value={toEmail} onChange={e => setToEmail(e.target.value)} placeholder="recipient@email.com" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400" /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Subject</label><input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400" /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Message</label><textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none leading-relaxed" /></div>
            {!isConfigured && (
              <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">EmailJS not configured â€” emails are <strong>simulated</strong>. Add <code className="bg-amber-100 px-1 rounded">VITE_EMAILJS_*</code> keys to <code className="bg-amber-100 px-1 rounded">.env</code> to send real emails (free at emailjs.com).</p>
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSend} disabled={!toEmail.trim()} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-300 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"><Send className="w-4 h-4" /> Send Email</button>
            </div>
          </div>
        )}

        {status === "sending" && (
          <div className="px-6 pb-10 pt-4 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
            <div className="font-bold text-gray-900 text-lg">Sendingâ€¦</div>
          </div>
        )}

        {status === "success" && (
          <div className="px-6 pb-10 pt-4 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center"><CheckCircle2 className="w-8 h-8 text-emerald-600" /></div>
            <div><div className="font-bold text-gray-900 text-lg">Email Sent!</div><div className="text-sm text-gray-500 mt-1">Delivered to <span className="font-medium text-gray-700">{toEmail}</span></div></div>
            <button onClick={onClose} className="px-8 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors">Done</button>
          </div>
        )}

        {status === "error" && (
          <div className="px-6 pb-6 pt-4 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center"><AlertCircle className="w-8 h-8 text-red-500" /></div>
            <div><div className="font-bold text-gray-900 text-lg">Email Failed</div><div className="text-sm text-red-500 mt-1 max-w-xs">{errMsg}</div></div>
            <div className="flex gap-3 w-full">
              <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50">Close</button>
              <button onClick={() => { setStatus("idle"); setErrMsg("") }} className="flex-1 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-500 flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Retry</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
