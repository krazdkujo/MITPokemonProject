/**
 * BattleLog Component
 * Scrollable log panel for displaying combat events
 *
 * Feature: 021-combat-test-harness
 * Task: T008
 */

import { useRef, useEffect } from 'react';

/**
 * BattleLog - Display scrollable combat log entries
 *
 * @param {Object} props
 * @param {Array<string>} props.entries - Array of log entry strings
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
              <div key={index} style={styles.logEntry}>
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
 * Format a log entry for display (convert ANSI codes to spans if needed)
 * @param {string} entry - Raw log entry string
 * @returns {string|JSX.Element} Formatted entry
 */
function formatLogEntry(entry) {
  // Strip ANSI codes for web display and just return plain text
  // The logger can use colorize:false for web or we strip here
  const ansiRegex = /\x1b\[[0-9;]*m/g;
  return entry.replace(ansiRegex, '');
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
  }
};
