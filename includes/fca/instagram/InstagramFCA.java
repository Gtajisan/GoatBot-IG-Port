/**
 * Instagram FCA - GoatBot Style
 * Java-based FCA implementation for Instagram
 * Bridges to Python instagrapi API server
 */

package instagram;

import java.io.*;
import java.net.*;
import java.util.*;
import java.util.concurrent.*;
import org.json.*;

public class InstagramFCA {
    private static final String API_BASE = "http://127.0.0.1:3001";
    private boolean loggedIn = false;
    private String userId = null;
    private String username = null;
    private List<MessageListener> listeners = new ArrayList<>();
    private ScheduledExecutorService pollExecutor;
    private Set<String> processedMessages = new HashSet<>();
    
    public interface MessageListener {
        void onMessage(JSONObject message);
    }
    
    public InstagramFCA() {
        System.out.println("[IG-FCA] Instagram FCA initialized");
    }
    
    private JSONObject httpRequest(String method, String endpoint, JSONObject body) throws Exception {
        URL url = new URL(API_BASE + endpoint);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod(method);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setConnectTimeout(30000);
        conn.setReadTimeout(30000);
        
        if (body != null && (method.equals("POST") || method.equals("PUT"))) {
            conn.setDoOutput(true);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(body.toString().getBytes("UTF-8"));
            }
        }
        
        int responseCode = conn.getResponseCode();
        InputStream is = responseCode >= 400 ? conn.getErrorStream() : conn.getInputStream();
        
        StringBuilder response = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is, "UTF-8"))) {
            String line;
            while ((line = br.readLine()) != null) {
                response.append(line);
            }
        }
        
        return new JSONObject(response.toString());
    }
    
    public JSONObject login(String username, String password) throws Exception {
        return login(username, password, null);
    }
    
    public JSONObject login(String username, String password, String verificationCode) throws Exception {
        JSONObject body = new JSONObject();
        body.put("username", username);
        body.put("password", password);
        if (verificationCode != null) {
            body.put("verification_code", verificationCode);
        }
        
        JSONObject result = httpRequest("POST", "/login", body);
        if (result.optBoolean("success", false)) {
            this.loggedIn = true;
            this.userId = result.optString("user_id");
            this.username = result.optString("username");
            System.out.println("[IG-FCA] Logged in as: " + this.username);
        }
        return result;
    }
    
    public JSONObject loginFromSession() throws Exception {
        JSONObject result = httpRequest("POST", "/login/session", new JSONObject());
        if (result.optBoolean("success", false)) {
            this.loggedIn = true;
            this.userId = result.optString("user_id");
            this.username = result.optString("username");
            System.out.println("[IG-FCA] Session restored for: " + this.username);
        }
        return result;
    }
    
    public JSONObject sendMessage(String threadId, String text) throws Exception {
        JSONObject body = new JSONObject();
        body.put("thread_id", threadId);
        body.put("text", text);
        return httpRequest("POST", "/send/message", body);
    }
    
    public JSONObject sendPhoto(String threadId, String photoPath, String caption) throws Exception {
        JSONObject body = new JSONObject();
        body.put("thread_id", threadId);
        body.put("photo_path", photoPath);
        body.put("caption", caption);
        return httpRequest("POST", "/send/photo", body);
    }
    
    public JSONObject sendVideo(String threadId, String videoPath) throws Exception {
        JSONObject body = new JSONObject();
        body.put("thread_id", threadId);
        body.put("video_path", videoPath);
        return httpRequest("POST", "/send/video", body);
    }
    
    public JSONObject getUserInfo(String userId) throws Exception {
        return httpRequest("GET", "/user/" + userId, null);
    }
    
    public JSONObject getThreadInfo(String threadId) throws Exception {
        return httpRequest("GET", "/thread/" + threadId, null);
    }
    
    public JSONObject getThreads(int amount) throws Exception {
        return httpRequest("GET", "/threads?amount=" + amount, null);
    }
    
    public JSONObject getStatus() throws Exception {
        return httpRequest("GET", "/status", null);
    }
    
    public void addMessageListener(MessageListener listener) {
        listeners.add(listener);
    }
    
    public void startListening() {
        if (pollExecutor != null) {
            return;
        }
        
        pollExecutor = Executors.newSingleThreadScheduledExecutor();
        pollExecutor.scheduleAtFixedRate(() -> {
            try {
                JSONObject result = httpRequest("GET", "/messages/pending", null);
                if (result.optBoolean("success", false)) {
                    JSONArray messages = result.optJSONArray("messages");
                    if (messages != null) {
                        for (int i = 0; i < messages.length(); i++) {
                            JSONObject msg = messages.getJSONObject(i);
                            String msgId = msg.optString("id");
                            if (!processedMessages.contains(msgId)) {
                                processedMessages.add(msgId);
                                for (MessageListener listener : listeners) {
                                    listener.onMessage(msg);
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("[IG-FCA] Poll error: " + e.getMessage());
            }
        }, 0, 5, TimeUnit.SECONDS);
        
        System.out.println("[IG-FCA] Started listening for messages");
    }
    
    public void stopListening() {
        if (pollExecutor != null) {
            pollExecutor.shutdown();
            pollExecutor = null;
        }
    }
    
    public boolean isLoggedIn() {
        return loggedIn;
    }
    
    public String getUserId() {
        return userId;
    }
    
    public String getUsername() {
        return username;
    }
    
    public static void main(String[] args) {
        try {
            InstagramFCA fca = new InstagramFCA();
            
            JSONObject status = fca.getStatus();
            System.out.println("API Status: " + status.toString(2));
            
            JSONObject session = fca.loginFromSession();
            if (session.optBoolean("success", false)) {
                System.out.println("Session loaded successfully");
                
                fca.addMessageListener(msg -> {
                    System.out.println("New message: " + msg.toString());
                });
                
                fca.startListening();
                
                Thread.sleep(60000);
                fca.stopListening();
            } else {
                System.out.println("No session, login required");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
