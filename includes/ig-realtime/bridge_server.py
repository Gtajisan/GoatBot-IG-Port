
"""
bridge_server.py - Bridge between Python IG client and Node.js handlers
Receives messages from Instagram and forwards to Node.js via stdout/stdin
"""

import sys
import json
import threading
from RealtimeClient import IGRealtimeClient

class BridgeServer:
    def __init__(self, username, password):
        self.client = IGRealtimeClient(username, password)
        self.setup_handlers()
    
    def setup_handlers(self):
        @self.client.on_message
        def handle_message(msg):
            self.send_to_node({
                "type": "message",
                "data": msg
            })
        
        @self.client.on_event
        def handle_event(evt):
            self.send_to_node({
                "type": "event",
                "data": evt
            })
    
    def send_to_node(self, data):
        """Send data to Node.js via stdout"""
        try:
            print(json.dumps(data), flush=True)
        except Exception as e:
            sys.stderr.write(f"Send error: {e}\n")
    
    def listen_from_node(self):
        """Listen for commands from Node.js via stdin"""
        for line in sys.stdin:
            try:
                data = json.loads(line.strip())
                self.handle_node_command(data)
            except Exception as e:
                sys.stderr.write(f"Receive error: {e}\n")
    
    def handle_node_command(self, data):
        """Handle commands from Node.js"""
        action = data.get('action')
        
        if action == 'send_message':
            thread_id = data.get('threadID')
            text = data.get('text')
            try:
                self.client.client.direct_send(text, [int(thread_id)])
            except Exception as e:
                sys.stderr.write(f"Send message error: {e}\n")
        
        elif action == 'react':
            message_id = data.get('messageID')
            emoji = data.get('emoji')
            try:
                # Instagram doesn't support reactions via API yet
                pass
            except Exception as e:
                sys.stderr.write(f"React error: {e}\n")
    
    def start(self):
        """Start the bridge server"""
        if not self.client.start():
            sys.stderr.write("Failed to start Instagram client\n")
            sys.exit(1)
        
        # Send ready signal
        self.send_to_node({"status": "ready"})
        
        # Start listening for Node.js commands
        stdin_thread = threading.Thread(target=self.listen_from_node, daemon=True)
        stdin_thread.start()
        
        # Keep running
        try:
            while True:
                import time
                time.sleep(1)
        except KeyboardInterrupt:
            self.client.stop()
            sys.exit(0)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.stderr.write("Usage: python bridge_server.py <username> <password>\n")
        sys.exit(1)
    
    username = sys.argv[1]
    password = sys.argv[2]
    
    bridge = BridgeServer(username, password)
    bridge.start()
