/**
 * Gamification & Streak Engine for RotaStar
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

// 2. Continuous Point-Gain Monthly Streak Calculator
export function calculateMonthlyStreak(activities = []) {
  if (!Array.isArray(activities) || activities.length === 0) return 0;

  // 1. Filter ONLY activities where points were actually gained (> 0)
  const positivePointActivities = activities.filter(
    (act) => act && Number(act.points) > 0
  );

  if (positivePointActivities.length === 0) return 0;

  // 2. Extract unique "YYYY-MM" periods of point gains
  const earnedMonths = new Set();

  positivePointActivities.forEach((act) => {
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
      earnedMonths.add(`${y}-${m}`);
    }
  });

  if (earnedMonths.size === 0) return 0;

  const now = new Date();
  let checkYear = now.getFullYear();
  let checkMonth = now.getMonth() + 1;
  let streak = 0;

  // Check current month or last month (grace period)
  let currentKey = `${checkYear}-${String(checkMonth).padStart(2, "0")}`;
  if (!earnedMonths.has(currentKey)) {
    // Check if points were earned in the preceding month
    checkMonth -= 1;
    if (checkMonth === 0) {
      checkMonth = 12;
      checkYear -= 1;
    }
    currentKey = `${checkYear}-${String(checkMonth).padStart(2, "0")}`;
    
    // If no points gained in the current OR previous month, the streak resets to 0
    if (!earnedMonths.has(currentKey)) {
      return 0;
    }
  }

  // Count backwards consecutively for uninterrupted months of point gains
  while (true) {
    const key = `${checkYear}-${String(checkMonth).padStart(2, "0")}`;
    if (earnedMonths.has(key)) {
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

// 3. Badges System
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
    isUnlocked: (pts, acts) => {
      const validActs = acts.filter((a) => Number(a.points) > 0);
      return (
        validActs.filter((a) => {
          const name = (a.activityName || "").toLowerCase();
          return (
            name.includes("community") ||
            name.includes("service") ||
            name.includes("donation") ||
            name.includes("drive")
          );
        }).length >= 3 || validActs.length >= 3
      );
    },
  },
  {
    id: "fellowship_anchor",
    title: "Fellowship Anchor",
    description: "Participated in 3 or more club service or fellowship events.",
    icon: "Award",
    category: "Club Service",
    isUnlocked: (pts, acts) =>
      acts.filter((a) => Number(a.points) > 0).length >= 4 || pts >= 200,
  },
  {
    id: "streak_titan",
    title: "Streak Titan",
    description: "Continuously gained club points across consecutive months.",
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
        return (
          Number(a.points) > 0 &&
          (name.includes("blood") || name.includes("medical") || name.includes("health"))
        );
      }),
  },
];

// 4. Badges Evaluator
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