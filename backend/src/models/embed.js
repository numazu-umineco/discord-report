import { formatDateTime } from '../lib/datetime.js';
import { cleanXUrl } from '../lib/url.js';
import { getUserAvatarUrl } from '../discord.js';

/**
 * Activity Report Embed Builder
 */
export class ActivityReportEmbed {
  constructor() {
    this.title = null;
    this.color = 0x5865F2; // Discord blurple
    this.fields = [];
    this.footer = null;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Set activity name
   * @param {object} activity - Activity object with name property
   * @returns {ActivityReportEmbed}
   */
  setActivity(activity) {
    this.title = `${activity.name} 活動報告`;
    return this;
  }

  /**
   * Set activity date and time
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} time - Time in HH:mm format
   * @returns {ActivityReportEmbed}
   */
  setDateTime(date, time) {
    this.fields.push({
      name: '活動日時',
      value: formatDateTime(date, time),
      inline: true
    });
    return this;
  }

  /**
   * Set participant count
   * @param {number|string} count - Number of participants
   * @returns {ActivityReportEmbed}
   */
  setParticipants(count) {
    this.fields.push({
      name: '活動人数',
      value: `${count}名`,
      inline: true
    });
    return this;
  }

  /**
   * Set activity content (optional)
   * @param {string} content - Activity description
   * @returns {ActivityReportEmbed}
   */
  setContent(content) {
    if (content && content.trim()) {
      this.fields.push({
        name: '活動内容',
        value: content.trim(),
        inline: false
      });
    }
    return this;
  }

  /**
   * Set X (Twitter) post URL (optional)
   * @param {string} url - X post URL
   * @returns {ActivityReportEmbed}
   */
  setXPostUrl(url) {
    const cleanedUrl = cleanXUrl(url);
    if (cleanedUrl) {
      this.fields.push({
        name: 'X (Twitter)',
        value: cleanedUrl,
        inline: false
      });
    }
    return this;
  }

  /**
   * Set footer with user info
   * @param {object} user - User object with username, id, avatar
   * @returns {ActivityReportEmbed}
   */
  setAuthor(user) {
    this.footer = {
      text: user.username,
      icon_url: getUserAvatarUrl(user)
    };
    return this;
  }

  /**
   * Build the embed object for Discord API
   * @returns {object}
   */
  build() {
    return {
      title: this.title,
      color: this.color,
      fields: this.fields,
      footer: this.footer,
      timestamp: this.timestamp
    };
  }
}

/**
 * Create an activity report embed from form data
 * @param {object} params - Form data
 * @param {object} params.activity - Activity object
 * @param {string} params.date - Date in YYYY-MM-DD format
 * @param {string} params.time - Time in HH:mm format
 * @param {number|string} params.participants - Participant count
 * @param {string} [params.content] - Activity content
 * @param {string} [params.xPostUrl] - X post URL
 * @param {object} params.user - User object
 * @returns {object} - Discord embed object
 */
export function createActivityReportEmbed({ activity, date, time, participants, content, xPostUrl, user }) {
  return new ActivityReportEmbed()
    .setActivity(activity)
    .setDateTime(date, time)
    .setParticipants(participants)
    .setContent(content)
    .setXPostUrl(xPostUrl)
    .setAuthor(user)
    .build();
}
