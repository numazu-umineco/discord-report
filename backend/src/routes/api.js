import { Router } from 'express';
import multer from 'multer';
import { requireAuthorization } from '../auth.js';
import { postEmbedToDiscord } from '../discord.js';
import { getActivities, getActivityById, isValidActivityId } from '../data/activities.js';
import { createActivityReportEmbed } from '../models/embed.js';

const router = Router();

// multer configuration - memory storage for direct Discord upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024 // 8MB (Discord free server limit)
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP are allowed.'));
    }
  }
});

router.get('/activities', requireAuthorization, (req, res) => {
  res.json(getActivities());
});

router.post('/posts', requireAuthorization, upload.single('image'), async (req, res) => {
  const { activityId, customActivityName, date, timeStart, timeEnd, participants, content, xPostUrl } = req.body;

  // Validate required fields
  if (!activityId || !isValidActivityId(activityId)) {
    return res.status(400).json({ error: 'Valid activity is required' });
  }

  // Validate custom activity name when "other" is selected
  const activity = getActivityById(activityId);
  if (activity.isCustom && (!customActivityName || !customActivityName.trim())) {
    return res.status(400).json({ error: 'Custom activity name is required' });
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

  // Prepare image file if uploaded
  const imageFile = req.file ? {
    buffer: req.file.buffer,
    filename: `report_${Date.now()}.${req.file.mimetype.split('/')[1]}`,
    contentType: req.file.mimetype
  } : null;

  const embed = createActivityReportEmbed({
    activity,
    customActivityName: activity.isCustom ? customActivityName.trim() : null,
    date,
    timeStart,
    timeEnd,
    participants,
    content,
    xPostUrl,
    user: req.user,
    imageFilename: imageFile?.filename
  });

  try {
    const result = await postEmbedToDiscord('新しい活動報告が投稿されました！', embed, imageFile);
    res.json({ success: true, messageId: result.id });
  } catch (error) {
    console.error('Error posting message:', error);
    res.status(500).json({ error: 'Failed to post message' });
  }
});

// multer error handler
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '画像サイズは8MB以下にしてください' });
    }
    return res.status(400).json({ error: 'ファイルアップロードエラー' });
  }
  if (error.message === 'Invalid file type. Only JPEG, PNG, GIF, WebP are allowed.') {
    return res.status(400).json({ error: '画像形式が無効です。JPEG, PNG, GIF, WebP のみ対応しています' });
  }
  next(error);
});

export default router;
