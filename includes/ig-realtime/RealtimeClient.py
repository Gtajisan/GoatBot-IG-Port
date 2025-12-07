
"""
Instagram Realtime Client for GoatBot-V2
Uses instagrapi to listen for real-time Instagram events
"""

import json
import time
import asyncio
import threading
from instagrapi import Client
from instagrapi.mixins.challenge import ChallengeChoice
from instagrapi.exceptions import LoginRequired, ChallengeRequired
import sys
import os

class IGRealtimeClient:
    def __init__(self, username, password, session_file="includes/session/ig_session.json"):
        self.username = username
        self.password = password
        self.session_file = session_file
        self.client = Client()
        self.client.delay_range = [1, 3]
        self.is_running = False
        self.message_handlers = []
        self.event_handlers = []
        self.last_message_ids = set()
        
    def load_session(self):
        """Load existing session from file"""
        if os.path.exists(self.session_file):
            try:
                self.client.load_settings(self.session_file)
                self.client.login(self.username, self.password)
                self.client.get_timeline_feed()
                print(f"[IG-REALTIME] Loaded session for {self.username}")
                return True
            except Exception as e:
                print(f"[IG-REALTIME] Session load failed: {e}")
                return False
        return False
    
    def save_session(self):
        """Save current session to file"""
        try:
            self.client.dump_settings(self.session_file)
            print(f"[IG-REALTIME] Session saved")
        except Exception as e:
            print(f"[IG-REALTIME] Session save failed: {e}")
    
    def login(self):
        """Login to Instagram with challenge handling"""
        try:
            if self.load_session():
                return True
            
            print(f"[IG-REALTIME] Logging in as {self.username}...")
            
            # Handle 2FA if needed
            self.client.login(self.username, self.password)
            self.save_session()
            print(f"[IG-REALTIME] Login successful")
            return True
            
        except ChallengeRequired as e:
            print(f"[IG-REALTIME] Challenge required, attempting to solve...")
            api_path = self.client.last_response.headers.get("X-IG-Challenge-Path", "/challenge/")
            
            # Auto-select email/SMS challenge
            self.client.challenge_auto(self.username, self.password)
            self.save_session()
            return True
            
        except LoginRequired:
            print(f"[IG-REALTIME] Login required, clearing session...")
            if os.path.exists(self.session_file):
                os.remove(self.session_file)
            return self.login()
            
        except Exception as e:
            print(f"[IG-REALTIME] Login failed: {e}")
            return False
    
    def on_message(self, handler):
        """Register message handler"""
        self.message_handlers.append(handler)
    
    def on_event(self, handler):
        """Register event handler"""
        self.event_handlers.append(handler)
    
    def emit_message(self, message_data):
        """Emit message to all handlers"""
        for handler in self.message_handlers:
            try:
                handler(message_data)
            except Exception as e:
                print(f"[IG-REALTIME] Handler error: {e}")
    
    def emit_event(self, event_data):
        """Emit event to all handlers"""
        for handler in self.event_handlers:
            try:
                handler(event_data)
            except Exception as e:
                print(f"[IG-REALTIME] Event handler error: {e}")
    
    def process_direct_message(self, thread, item):
        """Convert IG direct message to Goat format"""
        try:
            # Skip if already processed
            if item.id in self.last_message_ids:
                return
            self.last_message_ids.add(item.id)
            
            # Keep only last 1000 message IDs
            if len(self.last_message_ids) > 1000:
                self.last_message_ids = set(list(self.last_message_ids)[-500:])
            
            sender = item.user_id
            sender_info = self.client.user_info(sender)
            
            message_data = {
                "type": "message",
                "senderID": str(sender),
                "senderName": sender_info.username,
                "threadID": str(thread.id),
                "messageID": item.id,
                "body": item.text or "",
                "attachments": [],
                "replyTo": None,
                "isGroup": thread.thread_type == "group",
                "mentions": [],
                "timestamp": int(item.timestamp.timestamp()),
                "rawItem": item
            }
            
            # Handle media attachments
            if item.media:
                media_type = item.item_type
                if media_type == "media":
                    message_data["attachments"].append({
                        "type": "photo" if item.media.media_type == 1 else "video",
                        "url": item.media.thumbnail_url or item.media.url,
                        "id": str(item.media.pk)
                    })
                elif media_type == "voice_media":
                    message_data["attachments"].append({
                        "type": "audio",
                        "url": item.media.audio.audio_src,
                        "duration": item.media.audio.duration
                    })
            
            # Handle story replies
            if item.story_share:
                message_data["attachments"].append({
                    "type": "story_mention",
                    "url": item.story_share.media.thumbnail_url
                })
            
            # Handle link shares
            if item.link:
                message_data["attachments"].append({
                    "type": "link",
                    "url": item.link.link_context.link_url,
                    "title": item.link.link_context.link_title
                })
            
            self.emit_message(message_data)
            
        except Exception as e:
            print(f"[IG-REALTIME] Process message error: {e}")
    
    def process_thread_event(self, thread, item):
        """Convert IG thread events to Goat events"""
        try:
            event_data = {
                "type": "event",
                "threadID": str(thread.id),
                "timestamp": int(time.time())
            }
            
            # User joined
            if hasattr(item, 'users_added'):
                event_data["eventType"] = "user_join"
                event_data["users"] = [str(u.pk) for u in item.users_added]
            
            # User left
            elif hasattr(item, 'users_removed'):
                event_data["eventType"] = "user_leave"
                event_data["users"] = [str(u.pk) for u in item.users_removed]
            
            # Thread name changed
            elif hasattr(item, 'thread_title'):
                event_data["eventType"] = "thread_name"
                event_data["newName"] = item.thread_title
            
            self.emit_event(event_data)
            
        except Exception as e:
            print(f"[IG-REALTIME] Process event error: {e}")
    
    def listen_loop(self):
        """Main listening loop"""
        print(f"[IG-REALTIME] Starting listen loop...")
        self.is_running = True
        
        while self.is_running:
            try:
                # Get all direct threads
                threads = self.client.direct_threads(amount=20)
                
                for thread in threads:
                    # Get messages from each thread
                    messages = self.client.direct_messages(thread.id, amount=10)
                    
                    for item in messages:
                        # Skip bot's own messages
                        if str(item.user_id) == str(self.client.user_id):
                            continue
                        
                        # Process regular messages
                        if item.item_type in ["text", "media", "voice_media", "link", "story_share"]:
                            self.process_direct_message(thread, item)
                        
                        # Process thread events
                        elif item.item_type in ["user_joined", "user_left", "title"]:
                            self.process_thread_event(thread, item)
                
                # Sleep to avoid rate limits
                time.sleep(3)
                
            except LoginRequired:
                print(f"[IG-REALTIME] Session expired, re-logging...")
                if self.login():
                    continue
                else:
                    print(f"[IG-REALTIME] Re-login failed, stopping...")
                    break
                    
            except Exception as e:
                print(f"[IG-REALTIME] Listen loop error: {e}")
                time.sleep(5)
    
    def start(self):
        """Start the realtime client"""
        if not self.login():
            print(f"[IG-REALTIME] Failed to start - login failed")
            return False
        
        # Start listening in a separate thread
        listen_thread = threading.Thread(target=self.listen_loop, daemon=True)
        listen_thread.start()
        
        print(f"[IG-REALTIME] Client started successfully")
        return True
    
    def stop(self):
        """Stop the realtime client"""
        self.is_running = False
        print(f"[IG-REALTIME] Client stopped")

if __name__ == "__main__":
    # Test the client
    client = IGRealtimeClient("username", "password")
    
    @client.on_message
    def handle_message(msg):
        print(f"Message: {msg['body']} from {msg['senderName']}")
    
    client.start()
    
    # Keep running
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        client.stop()
