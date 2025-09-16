import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export function TableSession() {
  const activeSession = useQuery(api.tables.getUserActiveSession);
  const endSession = useMutation(api.tables.endTableSession);
  const [isEnding, setIsEnding] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Update session duration every second
  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(() => {
      const duration = Date.now() - activeSession.startTime;
      setSessionDuration(duration);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const handleEndSession = async () => {
    if (!activeSession) return;

    try {
      setIsEnding(true);
      const result = await endSession({ sessionId: activeSession._id });
      toast.success(`Session ended! Used ${result.creditsUsed} credits`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to end session");
    } finally {
      setIsEnding(false);
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const calculateCurrentCost = () => {
    if (!activeSession || !activeSession.table) return 0;
    const hoursUsed = Math.ceil(sessionDuration / (1000 * 60 * 60));
    return hoursUsed * activeSession.table.hourlyRate;
  };

  if (!activeSession) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-600 mb-2">No Active Session</h2>
        <p className="text-gray-500">Scan a QR code to start using a study table</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Active Study Session</h2>
        <p className="text-gray-600">You're currently using a study table</p>
      </div>

      {/* Session Info Card */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-4">
            Table {activeSession.table?.tableNumber}
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-green-100 text-sm">Duration</p>
              <p className="text-2xl font-bold">{formatDuration(sessionDuration)}</p>
            </div>
            <div>
              <p className="text-green-100 text-sm">Current Cost</p>
              <p className="text-2xl font-bold">{calculateCurrentCost()} credits</p>
            </div>
          </div>

          <div className="text-green-100 text-sm space-y-1">
            <p>Location: {activeSession.table?.location}</p>
            <p>Rate: {activeSession.table?.hourlyRate} credits/hour</p>
            <p>Started: {new Date(activeSession.startTime).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Session Controls */}
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-yellow-600">⚠️</span>
            <div>
              <h4 className="font-semibold text-yellow-800">Billing Information</h4>
              <p className="text-yellow-700 text-sm mt-1">
                You're charged {activeSession.table?.hourlyRate} credits per hour (rounded up).
                Current session will cost {calculateCurrentCost()} credits when ended.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleEndSession}
          disabled={isEnding}
          className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isEnding ? "Ending Session..." : "End Study Session"}
        </button>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-primary">
            {Math.ceil(sessionDuration / (1000 * 60 * 60))}
          </p>
          <p className="text-sm text-gray-600">Hours (rounded up)</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-primary">
            {activeSession.table?.capacity}
          </p>
          <p className="text-sm text-gray-600">Table Capacity</p>
        </div>
      </div>
    </div>
  );
}
