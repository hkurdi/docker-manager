import React, { useEffect, useRef, useState } from "react";
import { Channel, invoke } from "@tauri-apps/api/core";
import "../styles/LogsViewer.css";

interface LogProps {
  containerName: string;
}

export const LogsViewer: React.FC<LogProps> = ({ containerName }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleLogs = async (name: string): Promise<void> => {
      try {
        const onEvent = new Channel<string>();
        onEvent.onmessage = (message: string): void => {
          setLogs((prevLogs: string[]) => [...prevLogs, message]);
        };
        
        await invoke('emit_logs', { name, onEvent });
      } catch (error) {
        console.error('Error streaming logs:', error);
      }
    };

    handleLogs(containerName);
  }, [containerName]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="terminal">
      <h3 className="terminal-title">Logs Window</h3>
      <div className="terminal-logs" ref={terminalRef}>
        {logs.map((log, index) => (
          <pre key={index} className="log-line">
            {log}
          </pre>
        ))}
      </div>
    </div>
  );
};