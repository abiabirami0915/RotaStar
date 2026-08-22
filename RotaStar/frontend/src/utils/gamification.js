/**
 * Gamification calculations for RotaStar
 */

// 1. Level & Progress Calculator (1-100 = L1, 101-200 = L2, etc.)
export function calculateLevelProgress(points = 0) {
  const currentPoints = Math.max(0, points);
  const currentLevel = currentPoints <= 0 ? 1 : Math.floor((currentPoints - 1) / 100) + 1;
  const nextLevel = currentLevel + 1;
  
  // Lower and upper thresholds
  const levelFloor = (currentLevel - 1) * 100;
  const levelCap = currentLevel * 100;
  
  // Points earned inside the current bracket
  const progressInLevel = currentPoints - levelFloor;
  const pointsNeeded = levelCap - currentPoints;
  const percentage = Math.min(100, Math.max(0, Math.round((progressInLevel / 100) * 100)));

  return {
    currentLevel,
    nextLevel,
    levelTitle: `Level ${currentLevel}`,
    levelFloor,
    levelCap,
    progressInLevel,
    pointsNeeded,
    percentage,
  };
}

// 2. Badges Definition & Unlock Evaluation
export const BADGE_DEFINITIONS = [
  {
    id: "starter_spark",
    title: "Starter Spark",
    description: "Earned your first 50 points and joined RotaStar",
    icon: "Sparkles",
    category: "Milestone",
    isUnlocked: (points, activities) => points >= 50,
  },
  {
    id: "century_club",
    title: "Century Club",
    description: "Crossed 100 points and ascended to Level 2",
    icon: "Crown",
    category: "Level",
    isUnlocked: (points, activities) => points >= 101,
  },
  {
    id: "double_century",
    title: "Double Century",
    description: "Reached 200+ points through dedicated club initiatives",
    icon: "Award",
    category: "Level",
    isUnlocked: (points, activities) => points >= 201,
  },
  {
    id: "service_titan",
    title: "Service Titan",
    description: "Completed 5 or more verified service initiatives",
    icon: "Trophy",
    category: "Activity",
    isUnlocked: (points, activities) => activities && activities.length >= 5,
  },
  {
    id: "impact_catalyst",
    title: "Impact Catalyst",
    description: "Completed 10 or more verified service initiatives",
    icon: "Flame",
    category: "Activity",
    isUnlocked: (points, activities) => activities && activities.length >= 10,
  },
  {
    id: "streak_champion",
    title: "Streak Champion",
    description: "Maintained active club participation across consecutive months",
    icon: "Zap",
    category: "Streak",
    isUnlocked: (points, activities, streak) => (streak || 0) >= 2,
  },
];

export function getMemberBadges(points = 0, activities = [], streak = 0) {
  return BADGE_DEFINITIONS.map((badge) => ({
    ...badge,
    unlocked: badge.isUnlocked(points, activities, streak),
  }));
}

// 3. Monthly Participation Streak Calculator
export function calculateMonthlyStreak(activities = []) {
  if (!activities || activities.length === 0) return 0;

  // Extract unique active Year-Month keys (e.g., "2026-07", "2026-08")
  const activeMonths = new Set();

  activities.forEach((act) => {
    let date = null;
    if (act.createdAt?.toDate) {
      date = act.createdAt.toDate();
    } else if (act.createdAt?.seconds) {
      date = new Date(act.createdAt.seconds * 1000);
    } else if (act.createdAt) {
      date = new Date(act.createdAt);
    }

    if (date && !isNaN(date.getTime())) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      activeMonths.add(`${y}-${m}`);
    }
  });

  const now = new Date();
  let checkYear = now.getFullYear();
  let checkMonth = now.getMonth() + 1; // 1-12
  let streak = 0;

  // Check if current month is active; if not, check previous month as grace period
  let currentKey = `${checkYear}-${String(checkMonth).padStart(2, "0")}`;
  if (!activeMonths.has(currentKey)) {
    // Check previous month
    checkMonth -= 1;
    if (checkMonth === 0) {
      checkMonth = 12;
      checkYear -= 1;
    }
    currentKey = `${checkYear}-${String(checkMonth).padStart(2, "0")}`;
    if (!activeMonths.has(currentKey)) {
      return 0;
    }
  }

  // Count backwards consecutively
  while (true) {
    const key = `${checkYear}-${String(checkMonth).padStart(2, "0")}`;
    if (activeMonths.has(key)) {
      streak += 1;
      checkMonth -= 1;
      if (checkMonth === 0) {
        checkMonth = 12;
        checkYear -= 1;
      }
    } else {
      break;
    }
  }

  return streak;
}