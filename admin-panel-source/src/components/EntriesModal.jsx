import Modal from './Modal'

export default function EntriesModal({ isOpen, onClose, contest }) {
  if (!contest) return null
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Entries: ${contest.name}`} size="sm">
      {contest.entries.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">No entries yet.</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {contest.entries.map((entry, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-300 to-blue-400 flex items-center justify-center text-white text-xs font-bold">
                {entry.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>
              <span className="text-sm text-gray-700">{entry}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 pt-3 border-t border-gray-100 text-sm text-gray-500 text-center">
        {contest.entries.length} total entries
      </div>
    </Modal>
  )
}
