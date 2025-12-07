
import { Logger } from '../utils/Logger.js';

export class EventNormalizer {
  constructor(bot) {
    this.bot = bot;
  }

  async normalizeMessage(message, thread) {
    try {
      return {
        type: 'message',
        threadID: thread.thread_id,
        messageID: message.item_id,
        senderID: message.user_id.toString(),
        body: this.extractMessageText(message),
        isGroup: thread.is_group,
        mentions: this.extractMentions(message),
        attachments: await this.extractAttachments(message),
        timestamp: message.timestamp,
        raw: message
      };
    } catch (error) {
      Logger.error('Event normalization error:', error);
      return null;
    }
  }

  extractMessageText(message) {
    if (message.text) return message.text;
    if (message.link) return message.link.text || '';
    if (message.media) return '[Media]';
    if (message.voice_media) return '[Voice Message]';
    return '';
  }

  extractMentions(message) {
    const mentions = [];
    
    if (message.text && message.mentioned_users) {
      message.mentioned_users.forEach(user => {
        mentions.push({
          id: user.user_id.toString(),
          tag: `@${user.username}`
        });
      });
    }
    
    return mentions;
  }

  async extractAttachments(message) {
    const attachments = [];

    // Photo
    if (message.media_share || message.visual_media) {
      const media = message.media_share || message.visual_media.media;
      
      if (media.image_versions2) {
        attachments.push({
          type: 'photo',
          url: media.image_versions2.candidates[0].url,
          id: media.id
        });
      }

      if (media.video_versions) {
        attachments.push({
          type: 'video',
          url: media.video_versions[0].url,
          id: media.id
        });
      }
    }

    // Voice message
    if (message.voice_media) {
      attachments.push({
        type: 'audio',
        url: message.voice_media.media.audio.audio_src,
        duration: message.voice_media.media.audio.duration
      });
    }

    // Link
    if (message.link) {
      attachments.push({
        type: 'url',
        url: message.link.link_context.link_url,
        title: message.link.link_context.link_title
      });
    }

    return attachments;
  }
}
