import { Router } from 'express';
import { requireAuthorization } from '../auth.js';
import { postEmbedToDiscord } from '../discord.js';
import { getActivities, getActivityById, isValidActivityId } from '../data/activities.js';
import { createActivityReportEmbed } from '../models/embed.js';

const router = Router();

router.get('/activities', requireAuthorization, (req, res) => {
  res.json(getActivities());
});

router.post('/posts', requireAuthorization, async (req, res) => {
  const { activityId, date, timeStart, timeEnd, participants, content, xPostUrl } = req.body;

  // Validate required fields
  if (!activityId || !isValidActivityId(activityId)) {
    return res.status(400).json({ error: 'Valid activity is required' });
  }

  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  if (!timeStart) {
    return res.status(400).json({ error: 'Start time is required' });
  }

  if (!timeEnd) {
    return res.status(400).json({ error: 'End time is required' });
  }

  if (!participants || isNaN(parseInt(participants)) || parseInt(participants) < 0) {
    return res.status(400).json({ error: 'Valid participant count is required' });
  }

  const activity = getActivityById(activityId);
  const embed = createActivityReportEmbed({
    activity,
    date,
    timeStart,
    timeEnd,
    participants,
    content,
    xPostUrl,
    user: req.user
  });

  try {
    const result = await postEmbedToDiscord('新しい活動報告が投稿されました！', embed);
    res.json({ success: true, messageId: result.id });
  } catch (error) {
    console.error('Error posting message:', error);
    res.status(500).json({ error: 'Failed to post message' });
  }
});

export default router;
