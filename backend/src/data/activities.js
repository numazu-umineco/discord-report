// Activities configuration
// Each activity has an internal ID and display name
// The ID is used for validation, the name is displayed to users

const activities = [
  { id: 'soccer', name: 'サッカー部', emoji: '⚽' },
  { id: 'baseball', name: '野球部', emoji: '⚾' },
  { id: 'basketball', name: 'バスケットボール部', emoji: '🏀' },
  { id: 'volleyball', name: 'バレーボール部', emoji: '🏐' },
  { id: 'tennis', name: 'テニス部', emoji: '🎾' },
  { id: 'swimming', name: '水泳部', emoji: '🏊' },
  { id: 'track', name: '陸上部', emoji: '🏃' },
  { id: 'kendo', name: '剣道部', emoji: '🤺' },
  { id: 'judo', name: '柔道部', emoji: '🥋' },
  { id: 'brass', name: '吹奏楽部', emoji: '🎺' },
  { id: 'art', name: '美術部', emoji: '🎨' },
  { id: 'drama', name: '演劇部', emoji: '🎭' },
  { id: 'science', name: '科学部', emoji: '🔬' },
  { id: 'literature', name: '文芸部', emoji: '📚' },
  { id: 'computer', name: 'コンピュータ部', emoji: '💻' }
];

// Create a map for quick lookup by ID
const activitiesMap = new Map(activities.map(a => [a.id, a]));

export function getActivities() {
  return activities;
}

export function getActivityById(id) {
  return activitiesMap.get(id) || null;
}

export function isValidActivityId(id) {
  return activitiesMap.has(id);
}
