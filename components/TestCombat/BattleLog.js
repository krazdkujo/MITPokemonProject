/**
 * BattleLog Component
 * Scrollable log panel for displaying combat events
 *
 * Feature: 021-combat-test-harness
 * Task: T008, T016 (status effect rendering)
 */

import { useRef, useEffect } from 'react';

// T016, T021, T036, T040, T045: Log entry type constants for styling
const LogEntryType = {
  STATUS_APPLIED: 'status_applied',
  STATUS_BLOCKED: 'status_blocked',
  STATUS_DAMAGE: 'status_damage',
  STATUS_CHECK: 'status_check',
  STATUS_REMOVED: 'status_removed',
  TURN_SKIP: 'turn_skip',
  HEALING: 'healing',
  RECOIL: 'recoil',
  AC_CHANGE: 'ac_change',
  BURNED_PENALTY: 'burned_penalty',
  FLINCHED_EFFECT: 'flinched_effect',
  // T036: Movement log entry type
  MOVEMENT: 'movement',
  RANGE_CHECK: 'range_check'
};

/**
 * BattleLog - Display scrollable combat log entries
 *
 * @param {Object} props
 * @param {Array<string|Object>} props.entries - Array of log entry strings or structured entries
 * @param {boolean} props.autoScroll - Whether to auto-scroll to bottom on new entries
 * @param {number} props.maxHeight - Maximum height of log panel in pixels
 */
export default function BattleLog({
  entries = [],
  autoScroll = true,
  maxHeight = 500
}) {
  const logContainerRef = useRef(null);
  const lastEntryCountRef = useRef(0);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (autoScroll && logContainerRef.current && entries.length > lastEntryCountRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
    lastEntryCountRef.current = entries.length;
  }, [entries, autoScroll]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Battle Log</h3>
        <span style={styles.entryCount}>{entries.length} entries</span>
      </div>

      <div
        ref={logContainerRef}
        style={{
          ...styles.logContainer,
          maxHeight: `${maxHeight}px`
        }}
      >
        {entries.length === 0 ? (
          <div style={styles.emptyState}>
            No battle events yet. Start a battle to see combat logs.
          </div>
        ) : (
          <pre style={styles.logContent}>
            {entries.map((entry, index) => (
              <div key={index} style={getEntryStyle(entry)}>
                {formatLogEntry(entry)}
              </div>
            ))}
          </pre>
        )}
      </div>
    </div>
  );
}

/**
 * T016: Get style for an entry based on its type
 * @param {string|Object} entry - Log entry
 * @returns {Object} Style object
 */
function getEntryStyle(entry) {
  const baseStyle = { ...styles.logEntry };

  // Handle structured entries
  if (typeof entry === 'object' && entry.type) {
    switch (entry.type) {
      case LogEntryType.STATUS_APPLIED:
        return { ...baseStyle, ...styles.statusApplied };
      case LogEntryType.STATUS_BLOCKED:
        return { ...baseStyle, ...styles.statusBlocked };
      case LogEntryType.STATUS_DAMAGE:
        return { ...baseStyle, ...styles.statusDamage };
      case LogEntryType.STATUS_CHECK:
        return { ...baseStyle, ...styles.statusCheck };
      case LogEntryType.TURN_SKIP:
        return { ...baseStyle, ...styles.turnSkip };
      case LogEntryType.STATUS_REMOVED:
        return { ...baseStyle, ...styles.statusRemoved };
      case LogEntryType.HEALING:
        return { ...baseStyle, ...styles.healing };
      case LogEntryType.RECOIL:
        return { ...baseStyle, ...styles.recoil };
      case LogEntryType.AC_CHANGE:
        return { ...baseStyle, ...styles.acChange };
      case LogEntryType.BURNED_PENALTY:
        return { ...baseStyle, ...styles.burnedPenalty };
      case LogEntryType.FLINCHED_EFFECT:
        return { ...baseStyle, ...styles.flinchedEffect };
      // T036: Movement entry styling
      case LogEntryType.MOVEMENT:
        return { ...baseStyle, ...styles.movement };
      case LogEntryType.RANGE_CHECK:
        return { ...baseStyle, ...styles.rangeCheck };
      default:
        return baseStyle;
    }
  }

  // T021: Check for faint from status damage
  if (typeof entry === 'object' && entry.details?.fainted) {
    return { ...baseStyle, ...styles.statusFaint };
  }

  // Handle string entries with status indicators
  if (typeof entry === 'string') {
    if (entry.includes('is now') && (entry.includes('PARALYZED') || entry.includes('BURNED') ||
        entry.includes('POISONED') || entry.includes('FROZEN') || entry.includes('ASLEEP') ||
        entry.includes('CONFUSED') || entry.includes('FLINCHED'))) {
      return { ...baseStyle, ...styles.statusApplied };
    }
    if (entry.includes('blocked')) {
      return { ...baseStyle, ...styles.statusBlocked };
    }
    if (entry.includes('takes') && entry.includes('damage') && (entry.includes('BURNED') ||
        entry.includes('POISONED') || entry.includes('BADLY_POISONED'))) {
      return { ...baseStyle, ...styles.statusDamage };
    }
  }

  return baseStyle;
}

/**
 * Format a log entry for display (convert ANSI codes to spans if needed)
 * @param {string|Object} entry - Raw log entry string or structured entry
 * @returns {string|JSX.Element} Formatted entry
 */
function formatLogEntry(entry) {
  // Handle structured entries
  if (typeof entry === 'object') {
    // Use the formatted string if available
    if (entry.formatted) {
      return stripAnsi(entry.formatted);
    }
    // Fallback: stringify the details
    return JSON.stringify(entry.details || entry, null, 2);
  }

  // Handle string entries - strip ANSI codes for web display
  return stripAnsi(entry);
}

/**
 * Strip ANSI codes from a string
 * @param {string} text - Text with potential ANSI codes
 * @returns {string} Clean text
 */
function stripAnsi(text) {
  if (typeof text !== 'string') return String(text);
  const ansiRegex = /\x1b\[[0-9;]*m/g;
  return text.replace(ansiRegex, '');
}

const styles = {
  container: {
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#1a1a1a',
    borderBottom: '1px solid #333'
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#fff'
  },
  entryCount: {
    fontSize: '12px',
    color: '#888'
  },
  logContainer: {
    overflowY: 'auto',
    overflowX: 'auto',
    padding: '12px 16px',
    scrollBehavior: 'smooth'
  },
  emptyState: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic'
  },
  logContent: {
    margin: 0,
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    fontSize: '13px',
    lineHeight: '1.5',
    color: '#ccc',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  logEntry: {
    marginBottom: '2px'
  },
  // T016: Status effect entry styles
  statusApplied: {
    color: '#e040fb',
    borderLeft: '3px solid #e040fb',
    paddingLeft: '8px',
    marginLeft: '-8px'
  },
  statusBlocked: {
    color: '#888',
    fontStyle: 'italic'
  },
  statusDamage: {
    color: '#ff7043',
    borderLeft: '3px solid #ff7043',
    paddingLeft: '8px',
    marginLeft: '-8px'
  },
  statusCheck: {
    color: '#ffca28',
    borderLeft: '3px solid #ffca28',
    paddingLeft: '8px',
    marginLeft: '-8px'
  },
  turnSkip: {
    color: '#ffa726',
    fontStyle: 'italic'
  },
  // T021: Additional status damage styles
  statusRemoved: {
    color: '#81c784',
    fontStyle: 'italic'
  },
  statusFaint: {
    color: '#f44336',
    fontWeight: 'bold',
    borderLeft: '3px solid #f44336',
    paddingLeft: '8px',
    marginLeft: '-8px'
  },
  // T036: Move extra effect styles
  healing: {
    color: '#66bb6a',
    borderLeft: '3px solid #66bb6a',
    paddingLeft: '8px',
    marginLeft: '-8px'
  },
  recoil: {
    color: '#ffa726',
    borderLeft: '3px solid #ffa726',
    paddingLeft: '8px',
    marginLeft: '-8px'
  },
  acChange: {
    color: '#42a5f5',
    borderLeft: '3px solid #42a5f5',
    paddingLeft: '8px',
    marginLeft: '-8px'
  },
  // T040, T045: Burn penalty and flinch effect styles
  burnedPenalty: {
    color: '#ff5722',
    borderLeft: '3px solid #ff5722',
    paddingLeft: '8px',
    marginLeft: '-8px'
  },
  flinchedEffect: {
    color: '#ffeb3b',
    fontStyle: 'italic',
    borderLeft: '3px solid #ffeb3b',
    paddingLeft: '8px',
    marginLeft: '-8px'
  },
  // T036: Movement log entry style
  movement: {
    color: '#29b6f6',
    borderLeft: '3px solid #29b6f6',
    paddingLeft: '8px',
    marginLeft: '-8px'
  },
  rangeCheck: {
    color: '#ab47bc',
    borderLeft: '3px solid #ab47bc',
    paddingLeft: '8px',
    marginLeft: '-8px'
  }
};
