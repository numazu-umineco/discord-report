// Activities configuration
// Each activity has an internal ID and display name
// The ID is used for validation, the name is displayed to users

const activities = [
  { id: 'muscle', name: '筋トレ部', emoji: '🏋️' },
  { id: 'running', name: 'ランニング部', emoji: '🏃' },
  { id: 'mountain', name: '登山部', emoji: '🏔️' },
  { id: 'history', name: '歴史アドベンチャー部', emoji: '📜' },
  { id: 'mahjong', name: '麻雀部', emoji: '🀄' },
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
