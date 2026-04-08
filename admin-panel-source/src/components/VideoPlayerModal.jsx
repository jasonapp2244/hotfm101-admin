import { useRef, useState, useEffect, useCallback } from 'react'
import { X, CheckCircle2, XCircle, Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react'
import { formatRelativeTime } from '../utils/formatters'

const statusBadge = {
  pending:  'bg-amber-400/80 text-amber-900',
  approved: 'bg-emerald-400/80 text-emerald-900',
  rejected: 'bg-red-400/80 text-white',
}

function formatTime(sec) {
  if (!isFinite(sec) || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function VideoPlayerModal({ shoutout, onClose, onApprove, onReject }) {
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted]     = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [confirming, setConfirming] = useState(null) // 'approve' | 'reject' | null

  const isPending = shoutout.status === 'pending'

  // Auto-play when modal opens
  useEffect(() => {
    const vid = videoRef.current
    if (vid && shoutout.videoUrl) {
      vid.play().then(() => setPlaying(true)).catch(() => {})
    }
  }, [shoutout.videoUrl])

  // Keyboard shortcuts
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === ' ') {
      e.preventDefault()
      togglePlay()
    }
    if (e.key === 'm') toggleMute()
  }, [playing, muted]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const togglePlay = () => {
    const vid = videoRef.current
    if (!vid) return
    if (playing) { vid.pause(); setPlaying(false) }
    else          { vid.play().then(() => setPlaying(true)).catch(() => {}) }
  }

  const toggleMute = () => {
    const vid = videoRef.current
    if (!vid) return
    vid.muted = !muted
    setMuted(!muted)
  }

  const handleTimeUpdate = () => {
    const vid = videoRef.current
    if (!vid) return
    setCurrentTime(vid.currentTime)
    setProgress(vid.duration ? (vid.currentTime / vid.duration) * 100 : 0)
  }

  const handleLoadedMetadata = () => {
    const vid = videoRef.current
    if (!vid) return
    setDuration(vid.duration)
    setVideoLoaded(true)
  }

  const handleSeek = (e) => {
    const vid = videoRef.current
    if (!vid || !videoLoaded) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    vid.currentTime = pct * vid.duration
    setProgress(pct * 100)
  }

  const handleFullscreen = () => {
    const vid = videoRef.current
    if (!vid) return
    if (vid.requestFullscreen) vid.requestFullscreen()
  }

  const handleApprove = () => {
    if (confirming === 'approve') {
      onApprove(shoutout.id)
      onClose()
    } else {
      setConfirming('approve')
    }
  }

  const handleReject = () => {
    if (confirming === 'reject') {
      onReject(shoutout.id)
      onClose()
    } else {
      setConfirming('reject')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#0d1424' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${shoutout.gradient} flex items-center justify-center shrink-0`}>
              <span className="text-white font-bold text-sm">
                {shoutout.name?.[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-bold leading-tight">{shoutout.name}</span>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusBadge[shoutout.status]}`}>
                  {shoutout.status}
                </span>
              </div>
              <div className="text-white/50 text-xs mt-0.5">
                {formatRelativeTime(shoutout.time)}{shoutout.location && ` · ${shoutout.location}`}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors shrink-0 ml-3"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* ── Video area ── */}
        <div className="relative bg-black aspect-video">
          {shoutout.videoUrl ? (
            <video
              ref={videoRef}
              src={shoutout.videoUrl}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setPlaying(false)}
              onClick={togglePlay}
              playsInline
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${shoutout.gradient} flex flex-col items-center justify-center`}>
              <Play className="w-12 h-12 text-white/40 mb-2" />
              <span className="text-white/50 text-sm">No video attached</span>
            </div>
          )}

          {/* Play overlay (only show when paused and video exists) */}
          {shoutout.videoUrl && !playing && (
            <button
              className="absolute inset-0 flex items-center justify-center cursor-pointer group"
              onClick={togglePlay}
            >
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Play className="w-7 h-7 text-white ml-1" />
              </div>
            </button>
          )}
        </div>

        {/* ── Playback controls ── */}
        {shoutout.videoUrl && (
          <div className="px-5 pt-3 pb-2 bg-black/50">
            {/* Progress bar */}
            <div
              className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 relative group"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1.5"
                style={{ left: `${progress}%` }}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
              >
                {playing
                  ? <Pause className="w-4 h-4 text-white" />
                  : <Play className="w-4 h-4 text-white ml-0.5" />}
              </button>
              <button
                onClick={toggleMute}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
              >
                {muted
                  ? <VolumeX className="w-4 h-4 text-white" />
                  : <Volume2 className="w-4 h-4 text-white" />}
              </button>
              <span className="text-white/40 text-xs ml-1 tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <button
                onClick={handleFullscreen}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors ml-auto"
              >
                <Maximize2 className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* ── Action buttons ── */}
        {isPending ? (
          <div className="flex gap-3 px-5 py-4 border-t border-white/10">
            <button
              onClick={handleApprove}
              className={`flex-1 py-3 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
                confirming === 'approve'
                  ? 'bg-emerald-400 scale-[1.02] ring-2 ring-emerald-300'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              {confirming === 'approve' ? 'Confirm Approve' : 'Approve'}
            </button>
            <button
              onClick={handleReject}
              className={`flex-1 py-3 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
                confirming === 'reject'
                  ? 'bg-red-400 scale-[1.02] ring-2 ring-red-300'
                  : 'bg-red-600 hover:bg-red-500'
              }`}
            >
              <XCircle className="w-5 h-5" />
              {confirming === 'reject' ? 'Confirm Reject' : 'Reject'}
            </button>
          </div>
        ) : (
          <div className="px-5 py-4 border-t border-white/10 text-center">
            <span className={`text-sm font-medium ${
              shoutout.status === 'approved' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              This shoutout has been {shoutout.status}.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
