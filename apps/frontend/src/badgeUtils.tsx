import React from "react";
import {
  SwordsIcon,
  BoltIcon,
  TargetIcon,
  FlameIcon,
  ShieldIcon,
  MedalIcon,
  DiamondIcon,
  CrownIcon,
  BadgeIcon,
} from "./components/Icons";

export interface BadgeItem {
  id: string;
  iconName: "swords" | "bolt" | "target" | "flame" | "shield" | "medal" | "diamond" | "crown" | "badge";
  title: string;
  description: string;
  taskRequirement: string;
  current: number;
  max: number;
  unlocked: boolean;
  category: "BATTLE" | "RATING" | "MASTERY";
}

export const renderBadgeIcon = (iconName: string, className = "w-6 h-6") => {
  switch (iconName) {
    case "swords":
      return <SwordsIcon className={className} />;
    case "bolt":
      return <BoltIcon className={className} />;
    case "target":
      return <TargetIcon className={className} />;
    case "flame":
      return <FlameIcon className={className} />;
    case "shield":
      return <ShieldIcon className={className} />;
    case "medal":
      return <MedalIcon className={className} />;
    case "diamond":
      return <DiamondIcon className={className} />;
    case "crown":
      return <CrownIcon className={className} />;
    case "badge":
    default:
      return <BadgeIcon className={className} />;
  }
};

export const calculateBadges = (stats: {
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
}): BadgeItem[] => {
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;

  return [
    {
      id: "first_blood",
      iconName: "swords",
      title: "First Blood",
      description: "Win your first 1v1 duel battle in the arena.",
      taskRequirement: "Win 1 Match",
      current: stats.wins,
      max: 1,
      unlocked: stats.wins >= 1,
      category: "BATTLE",
    },
    {
      id: "reflex_starter",
      iconName: "bolt",
      title: "Reflex Fighter",
      description: "Complete 3 fast-paced 1v1 duel battles.",
      taskRequirement: "Complete 3 Battles",
      current: stats.gamesPlayed,
      max: 3,
      unlocked: stats.gamesPlayed >= 3,
      category: "BATTLE",
    },
    {
      id: "sharpshooter",
      iconName: "target",
      title: "Sharpshooter",
      description: "Maintain a win rate of 60% or higher with at least 3 battles.",
      taskRequirement: "60%+ Win Rate (min 3 games)",
      current: stats.gamesPlayed >= 3 ? winRate : 0,
      max: 60,
      unlocked: winRate >= 60 && stats.gamesPlayed >= 3,
      category: "MASTERY",
    },
    {
      id: "hot_streak",
      iconName: "flame",
      title: "Hot Streak",
      description: "Achieve 5 victories in competitive duel matches.",
      taskRequirement: "Win 5 Matches",
      current: stats.wins,
      max: 5,
      unlocked: stats.wins >= 5,
      category: "BATTLE",
    },
    {
      id: "silver_duelist",
      iconName: "shield",
      title: "Silver Duelist",
      description: "Reach 50+ ELO rating by defeating rivals.",
      taskRequirement: "Reach 50 ELO",
      current: stats.rating,
      max: 50,
      unlocked: stats.rating >= 50,
      category: "RATING",
    },
    {
      id: "gold_tactician",
      iconName: "medal",
      title: "Gold Tactician",
      description: "Surpass 150+ ELO in competitive matchmaking.",
      taskRequirement: "Reach 150 ELO",
      current: stats.rating,
      max: 150,
      unlocked: stats.rating >= 150,
      category: "RATING",
    },
    {
      id: "diamond_sage",
      iconName: "diamond",
      title: "Diamond Sage",
      description: "Reach 350+ ELO and achieve duel mastery.",
      taskRequirement: "Reach 350 ELO",
      current: stats.rating,
      max: 350,
      unlocked: stats.rating >= 350,
      category: "RATING",
    },
    {
      id: "grandmaster",
      iconName: "crown",
      title: "Grandmaster",
      description: "Attain legendary status at 600+ ELO rating.",
      taskRequirement: "Reach 600 ELO",
      current: stats.rating,
      max: 600,
      unlocked: stats.rating >= 600,
      category: "RATING",
    },
    {
      id: "duel_veteran",
      iconName: "badge",
      title: "Duel Veteran",
      description: "Participate in 15 or more 1v1 battle duels.",
      taskRequirement: "Play 15 Battles",
      current: stats.gamesPlayed,
      max: 15,
      unlocked: stats.gamesPlayed >= 15,
      category: "BATTLE",
    },
  ];
};
