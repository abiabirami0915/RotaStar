/**
 * Comprehensive Gamification & Badge Engine for RotaStar
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

// 2. High-Impact Rotary & Club Service Badge Definitions
export const BADGE_DEFINITIONS = [
  {
    id: "starter_spark",
    title: "Starter Spark",
    description: "Earned initial starter points and officially joined RotaStar.",
    icon: "Sparkles",
    category: "Milestone",
    isUnlocked: (pts) => pts >= 50,
  },
  {
    id: "century_club",
    title: "Century Club",
    description: "Crossed 100+ points and achieved Level 2 recognition.",
    icon: "Crown",
    category: "Milestone",
    isUnlocked: (pts, acts, streak, lvl) => lvl >= 2 || pts >= 101,
  },
  {
    id: "knight_of_service",
    title: "Knight of Service",
    description: "Reached 300+ points through dedicated club participation.",
    icon: "Shield",
    category: "Milestone",
    isUnlocked: (pts, acts, streak, lvl) => lvl >= 4 || pts >= 301,
  },
  {
    id: "crown_of_rotaract",
    title: "Crown of Rotaract",
    description: "Reached premier status with 500+ total club points.",
    icon: "Crown",
    category: "Elite",
    isUnlocked: (pts, acts, streak, lvl) => lvl >= 6 || pts >= 501,
  },
  {
    id: "community_pillar",
    title: "Community Pillar",
    description: "Completed 3 or more verified community service initiatives.",
    icon: "Trophy",
    category: "Community",
    isUnlocked: (pts, acts) =>
      acts.filter((a) =>
        (a.activityName || "").toLowerCase().includes("community") ||
        (a.activityName || "").toLowerCase().includes("service") ||
        (a.activityName || "").toLowerCase().includes("donation")
      ).length >= 3 || acts.length >= 3,
  },
  {
    id: "fellowship_anchor",
    title: "Fellowship Anchor",
    description: "Participated in 3 or more club service or fellowship events.",
    icon: "Award",
    category: "Club Service",
    isUnlocked: (pts, acts) => acts.length >= 4 || pts >= 200,
  },
  {
    id: "streak_titan",
    title: "Streak Titan",
    description: "Maintained active club attendance across consecutive months.",
    icon: "Flame",
    category: "Dedication",
    isUnlocked: (pts, acts, streak) => streak >= 2,
  },
  {
    id: "lifesaver",
    title: "Health & Life Hero",
    description: "Volunteered in a blood donation camp or medical drive.",
    icon: "Zap",
    category: "Special",
    isUnlocked: (pts, acts) =>
      acts.some((a) => {
        const name = (a.activityName || "").toLowerCase();
        return name.includes("blood") || name.includes("medical") || name.includes("health");
      }),
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
      console.warn(`Badge evaluation notice for ${badge.id}:`, e);
      unlocked = false;
    }

    return {
      ...badge,
      unlocked,
    };
  });
}

// 4. Monthly Participation Streak Calculator
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
    return activities.length > 0 ? 1 : 0;
  }

  const now = new Date();
  let checkYear = now.getFullYear();
  let checkMonth = now.getMonth() + 1;
  let streak = 0;

  let currentKey = `${checkYear}-${String(checkMonth).padStart(2, "0")}`;
  if (!activeMonths.has(currentKey)) {
    checkMonth -= 1;
    if (checkMonth === 0) {
      checkMonth = 12;
      checkYear -= 1;
    }
    currentKey = `${checkYear}-${String(checkMonth).padStart(2, "0")}`;
    if (!activeMonths.has(currentKey)) {
      return 1;
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