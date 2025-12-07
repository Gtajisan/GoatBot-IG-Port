#!/usr/bin/env python3
"""
Instagram API Server - GoatBot Style
Wraps instagrapi for use by Java FCA and Node.js adapter
"""

import os
import sys
import json
import time
import threading
from pathlib import Path
from flask import Flask, request, jsonify

sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'ig-api' / 'instagrapi_core'))

from instagrapi import Client
from instagrapi.exceptions import (
    LoginRequired, ChallengeRequired, TwoFactorRequired,
    ClientError, ClientNotFoundError
)

app = Flask(__name__)

class InstagramAPI:
    def __init__(self):
        self.client = Client()
        self.logged_in = False
        self.user_id = None
        self.username = None
        self.session_file = Path(__file__).parent.parent.parent / 'ig-account.txt'
        self.pending_messages = []
        self.message_lock = threading.Lock()
        
    def load_session(self):
        if self.session_file.exists():
            try:
                settings = json.loads(self.session_file.read_text())
                self.client.set_settings(settings)
                self.client.get_timeline_feed()
                self.logged_in = True
                self.user_id = self.client.user_id
                self.username = settings.get('username', 'unknown')
                return True
            except Exception as e:
                print(f"[IG-API] Session load failed: {e}")
                return False
        return False
    
    def save_session(self):
        try:
            settings = self.client.get_settings()
            settings['username'] = self.username
            self.session_file.write_text(json.dumps(settings, indent=2))
            return True
        except Exception as e:
            print(f"[IG-API] Session save failed: {e}")
            return False
    
    def login(self, username, password, verification_code=None):
        try:
            self.username = username
            if verification_code:
                self.client.login(username, password, verification_code=verification_code)
            else:
                self.client.login(username, password)
            self.logged_in = True
            self.user_id = self.client.user_id
            self.save_session()
            return {"success": True, "user_id": str(self.user_id), "username": username}
        except TwoFactorRequired:
            return {"success": False, "error": "2fa_required", "message": "Two-factor authentication required"}
        except ChallengeRequired:
            return {"success": False, "error": "challenge_required", "message": "Challenge verification required"}
        except Exception as e:
            return {"success": False, "error": "login_failed", "message": str(e)}
    
    def send_message(self, thread_id, text):
        if not self.logged_in:
            return {"success": False, "error": "not_logged_in"}
        try:
            result = self.client.direct_send(text, thread_ids=[int(thread_id)])
            return {
                "success": True,
                "message_id": str(result.id) if result else None,
                "thread_id": str(thread_id)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def send_photo(self, thread_id, photo_path, caption=""):
        if not self.logged_in:
            return {"success": False, "error": "not_logged_in"}
        try:
            result = self.client.direct_send_photo(photo_path, thread_ids=[int(thread_id)])
            return {"success": True, "message_id": str(result.id) if result else None}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def send_video(self, thread_id, video_path):
        if not self.logged_in:
            return {"success": False, "error": "not_logged_in"}
        try:
            result = self.client.direct_send_video(video_path, thread_ids=[int(thread_id)])
            return {"success": True, "message_id": str(result.id) if result else None}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_user_info(self, user_id):
        if not self.logged_in:
            return {"success": False, "error": "not_logged_in"}
        try:
            user = self.client.user_info(int(user_id))
            return {
                "success": True,
                "user": {
                    "id": str(user.pk),
                    "username": user.username,
                    "full_name": user.full_name,
                    "profile_pic_url": str(user.profile_pic_url) if user.profile_pic_url else None,
                    "is_private": user.is_private,
                    "is_verified": user.is_verified,
                    "follower_count": user.follower_count,
                    "following_count": user.following_count
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_thread_info(self, thread_id):
        if not self.logged_in:
            return {"success": False, "error": "not_logged_in"}
        try:
            thread = self.client.direct_thread(int(thread_id))
            return {
                "success": True,
                "thread": {
                    "id": str(thread.id),
                    "users": [{"id": str(u.pk), "username": u.username} for u in thread.users],
                    "is_group": thread.is_group,
                    "thread_title": thread.thread_title
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_threads(self, amount=20):
        if not self.logged_in:
            return {"success": False, "error": "not_logged_in"}
        try:
            threads = self.client.direct_threads(amount=amount)
            return {
                "success": True,
                "threads": [{
                    "id": str(t.id),
                    "users": [{"id": str(u.pk), "username": u.username} for u in t.users],
                    "is_group": t.is_group,
                    "thread_title": t.thread_title
                } for t in threads]
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_pending_messages(self):
        if not self.logged_in:
            return {"success": False, "error": "not_logged_in"}
        try:
            threads = self.client.direct_threads(amount=10)
            messages = []
            for thread in threads:
                for msg in thread.messages[:5]:
                    if msg.user_id != self.user_id:
                        messages.append({
                            "id": str(msg.id),
                            "thread_id": str(thread.id),
                            "user_id": str(msg.user_id),
                            "text": msg.text or "",
                            "timestamp": msg.timestamp.isoformat() if msg.timestamp else None,
                            "item_type": msg.item_type
                        })
            return {"success": True, "messages": messages}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_status(self):
        return {
            "logged_in": self.logged_in,
            "user_id": str(self.user_id) if self.user_id else None,
            "username": self.username
        }

ig_api = InstagramAPI()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "instagram-api"})

@app.route('/status', methods=['GET'])
def status():
    return jsonify(ig_api.get_status())

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    result = ig_api.login(
        data.get('username'),
        data.get('password'),
        data.get('verification_code')
    )
    return jsonify(result)

@app.route('/login/session', methods=['POST'])
def login_session():
    if ig_api.load_session():
        return jsonify({"success": True, **ig_api.get_status()})
    return jsonify({"success": False, "error": "no_session"})

@app.route('/send/message', methods=['POST'])
def send_message():
    data = request.json
    result = ig_api.send_message(data.get('thread_id'), data.get('text'))
    return jsonify(result)

@app.route('/send/photo', methods=['POST'])
def send_photo():
    data = request.json
    result = ig_api.send_photo(data.get('thread_id'), data.get('photo_path'), data.get('caption', ''))
    return jsonify(result)

@app.route('/send/video', methods=['POST'])
def send_video():
    data = request.json
    result = ig_api.send_video(data.get('thread_id'), data.get('video_path'))
    return jsonify(result)

@app.route('/user/<user_id>', methods=['GET'])
def get_user(user_id):
    return jsonify(ig_api.get_user_info(user_id))

@app.route('/thread/<thread_id>', methods=['GET'])
def get_thread(thread_id):
    return jsonify(ig_api.get_thread_info(thread_id))

@app.route('/threads', methods=['GET'])
def get_threads():
    amount = request.args.get('amount', 20, type=int)
    return jsonify(ig_api.get_threads(amount))

@app.route('/messages/pending', methods=['GET'])
def get_pending():
    return jsonify(ig_api.get_pending_messages())

if __name__ == '__main__':
    if ig_api.load_session():
        print("[IG-API] Session loaded successfully")
    else:
        print("[IG-API] No session found, login required")
    app.run(host='127.0.0.1', port=3001, debug=False)
