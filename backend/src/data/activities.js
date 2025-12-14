// Activities configuration
// Each activity has an internal ID and display name
// The ID is used for validation, the name is displayed to users

const activities = [
  { id: 'soccer', name: 'サッカー部' },
  { id: 'baseball', name: '野球部' },
  { id: 'basketball', name: 'バスケットボール部' },
  { id: 'volleyball', name: 'バレーボール部' },
  { id: 'tennis', name: 'テニス部' },
  { id: 'swimming', name: '水泳部' },
  { id: 'track', name: '陸上部' },
  { id: 'kendo', name: '剣道部' },
  { id: 'judo', name: '柔道部' },
  { id: 'brass', name: '吹奏楽部' },
  { id: 'art', name: '美術部' },
  { id: 'drama', name: '演劇部' },
  { id: 'science', name: '科学部' },
  { id: 'literature', name: '文芸部' },
  { id: 'computer', name: 'コンピュータ部' }
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
