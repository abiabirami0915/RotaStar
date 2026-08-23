/**
 * Robust Gamification Logic for RotaStar
 */

// 1. Level & Progress Calculator (1-100 = Level 1, 101-200 = Level 2, etc.)
export function calculateLevelProgress(rawPoints = 0) {
  const currentPoints = Math.max(0, Number(rawPoints) || 0);
  const currentLevel = currentPoints <= 0 ? 1 : Math.floor((currentPoints - 1) / 100) + 1;
  const nextLevel = currentLevel + 1;

  const levelFloor = (currentLevel - 1) * 100;
  const levelCap = currentLevel * 100;

  const progressInLevel = Math.max(0, currentPoints - levelFloor);
  const pointsNeeded = Math.max(0, levelCap - currentPoints);
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

// 2. Clear, Rewarding Badge Definitions
export const BADGE_DEFINITIONS = [
  {
    id: "starter_spark",
    title: "Starter Spark",
    description: "Earned 50+ points and joined the club roster",
    icon: "Sparkles",
    category: "Milestone",
    isUnlocked: (pts, acts, streak, lvl) => pts >= 50,
  },
  {
    id: "century_club",
    title: "Century Club",
    description: "Reached 100+ points and ascended to Level 2",
    icon: "Crown",
    category: "Level",
    isUnlocked: (pts, acts, streak, lvl) => pts >= 101 || lvl >= 2,
  },
  {
    id: "double_century",
    title: "Double Century",
    description: "Reached 200+ points through dedicated club initiatives",
    icon: "Award",
    category: "Level",
    isUnlocked: (pts, acts, streak, lvl) => pts >= 201 || lvl >= 3,
  },
  {
    id: "active_contributor",
    title: "Active Contributor",
    description: "Logged your first verified club activity or project",
    icon: "Trophy",
    category: "Activity",
    isUnlocked: (pts, acts, streak, lvl) => (acts && acts.length >= 1) || pts > 50,
  },
  {
    id: "service_titan",
    title: "Service Titan",
    description: "Participated in 3 or more club service initiatives",
    icon: "Flame",
    category: "Activity",
    isUnlocked: (pts, acts, streak, lvl) => (acts && acts.length >= 3) || pts >= 150,
  },
  {
    id: "streak_champion",
    title: "Streak Champion",
    description: "Maintained active club participation across months",
    icon: "Zap",
    category: "Streak",
    isUnlocked: (pts, acts, streak, lvl) => (streak || 0) >= 1,
  },
];

// 3. Evaluates all badges safely
export function getMemberBadges(rawPoints = 0, rawActivities = [], rawStreak = 0) {
  const points = Math.max(0, Number(rawPoints) || 0);
  const activities = Array.isArray(rawActivities) ? rawActivities : [];
  const streak = Math.max(0, Number(rawStreak) || 0);
  const level = points <= 0 ? 1 : Math.floor((points - 1) / 100) + 1;

  return BADGE_DEFINITIONS.map((badge) => {
    let unlocked = false;
    try {
      unlocked = Boolean(badge.isUnlocked(points, activities, streak, level));
    } catch (e) {
      console.warn(`Badge evaluation error for ${badge.id}:`, e);
      unlocked = false;
    }

    return {
      ...badge,
      unlocked,
    };
  });
}

// 4. Safe Monthly Streak Calculation
export function calculateMonthlyStreak(activities = []) {
  if (!Array.isArray(activities) || activities.length === 0) return 0;

  const activeMonths = new Set();

  activities.forEach((act) => {
    if (!act) return;
    let date = null;

    if (act.createdAt?.toDate && typeof act.createdAt.toDate === "function") {
      date = act.createdAt.toDate();
    } else if (act.createdAt?.seconds) {
      date = new Date(act.createdAt.seconds * 1000);
    } else if (typeof act.createdAt === "string" || typeof act.createdAt === "number") {
      date = new Date(act.createdAt);
    }

    if (date && !isNaN(date.getTime())) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      activeMonths.add(`${y}-${m}`);
    }
  });

  if (activeMonths.size === 0) {
    // If user has activities logged, count at least 1 month streak
    return activities.length > 0 ? 1 : 0;
  }

  const now = new Date();
  let checkYear = now.getFullYear();
  let checkMonth = now.getMonth() + 1;
  let streak = 0;

  // Check current month or previous month
  let currentKey = `${checkYear}-${String(checkMonth).padStart(2, "0")}`;
  if (!activeMonths.has(currentKey)) {
    checkMonth -= 1;
    if (checkMonth === 0) {
      checkMonth = 12;
      checkYear -= 1;
    }
    currentKey = `${checkYear}-${String(checkMonth).padStart(2, "0")}`;
    if (!activeMonths.has(currentKey)) {
      return 1; // Minimum active month
    }
  }

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

  return Math.max(1, streak);
}