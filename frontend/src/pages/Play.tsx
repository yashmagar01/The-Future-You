import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { LevelPath } from '@/components/play/LevelPath';
import { LevelIntroModal } from '@/components/play/LevelIntroModal';
import {
  PLAY_LEVELS,
  PLAYER_RANKS,
  getNextPlayableLevel,
  getStreakMultiplierLabel,
  hasBadge,
  type PlayLevel,
} from '@/data/playLevels';
import { usePlay } from '@/contexts/PlayContext';
import { Trophy, Zap, Flame, Shield, CheckCircle2, Lock, ArrowRight, Award } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Play() {
  const { xp, badges, badgeDates, streak, playerLevel, allBadges, getStatus, progress } = usePlay();
  const [introLevel, setIntroLevel] = useState<PlayLevel | null>(null);
  const navigate = useNavigate();

  const currentLevel = getNextPlayableLevel(progress);

  const handleStart = (level: PlayLevel) => {
    setIntroLevel(null);
    navigate(`/record?level=${level.id}`);
  };

  const completedLevelsCount = PLAY_LEVELS.filter((l) => getStatus(l).status === 'completed').length;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Mastery Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white p-6 md:p-8 mb-8 border border-emerald-500/30 shadow-xl">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                <span className="text-base">{playerLevel.currentRank.emoji}</span>
                Level {playerLevel.level} of 10 · {playerLevel.currentRank.title}
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Master Your Speech, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-300">Level by Level.</span>
              </h1>

              <p className="text-emerald-100/80 text-sm md:text-base leading-relaxed">
                {playerLevel.currentRank.description}
              </p>

              {/* Perk highlight */}
              <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-300/90 bg-white/5 rounded-lg px-3 py-1.5 border border-white/10">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                <span>Active Perk: {playerLevel.currentRank.perk}</span>
              </div>
            </div>

            {/* Quick Action Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 min-w-[280px] space-y-4">
              <div className="flex items-center justify-between text-xs text-emerald-200">
                <span className="font-semibold uppercase tracking-wide">Next Rank Progress</span>
                <span className="font-mono font-bold text-white">{playerLevel.progressPercent}%</span>
              </div>

              <Progress value={playerLevel.progressPercent} className="h-2.5 bg-black/40" />

              <div className="flex items-center justify-between text-xs text-emerald-100/70">
                <span>{xp} XP earned</span>
                <span>
                  {playerLevel.nextRank
                    ? `${playerLevel.xpNeededForNextLevel} XP to ${playerLevel.nextRank.title}`
                    : 'Max Rank Achieved 🏆'}
                </span>
              </div>

              <Button
                onClick={() => handleStart(currentLevel)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/30"
              >
                <span>Continue: Level {currentLevel.level}</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Gamification Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Zap className="h-4 w-4 text-amber-500" /> Total XP
            </div>
            <div className="text-3xl font-extrabold mt-2 text-foreground">{xp}</div>
            <p className="text-xs text-muted-foreground mt-1">From challenges & reflections</p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Flame className="h-4 w-4 text-orange-500" /> Daily Streak
            </div>
            <div className="text-3xl font-extrabold mt-2 text-foreground">
              {streak} <span className="text-base font-semibold text-muted-foreground">days</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{getStreakMultiplierLabel(streak)}</p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Levels Cleared
            </div>
            <div className="text-3xl font-extrabold mt-2 text-foreground">
              {completedLevelsCount}
              <span className="text-base font-semibold text-muted-foreground">/{PLAY_LEVELS.length}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Unlock next by clearing</p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Trophy className="h-4 w-4 text-indigo-500" /> Badges
            </div>
            <div className="text-3xl font-extrabold mt-2 text-foreground">
              {badges.length}
              <span className="text-base font-semibold text-muted-foreground">/{allBadges.length}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Achievements unlocked</p>
          </div>
        </div>

        {/* Tab Navigation: Quest Ladder vs 10 Mastery Ranks vs Trophy Room */}
        <Tabs defaultValue="quest" className="space-y-6">
          <div className="flex justify-center md:justify-start">
            <TabsList className="bg-muted/70 p-1 rounded-2xl">
              <TabsTrigger value="quest" className="rounded-xl px-5 py-2 font-semibold">
                🎯 Quest Ladder (10 Levels)
              </TabsTrigger>
              <TabsTrigger value="ranks" className="rounded-xl px-5 py-2 font-semibold">
                👑 10 Mastery Ranks
              </TabsTrigger>
              <TabsTrigger value="trophies" className="rounded-xl px-5 py-2 font-semibold">
                🏆 Trophy Room ({badges.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: 10 Challenge Levels Path */}
          <TabsContent value="quest" className="space-y-4 animate-fade-in">
            <div className="text-center max-w-lg mx-auto mb-6">
              <h2 className="text-2xl font-bold">10-Level Challenge Quest</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Each level builds a new communication muscle. Clear the benchmark score to unlock the next challenge.
              </p>
            </div>
            <LevelPath onSelectLevel={setIntroLevel} />
          </TabsContent>

          {/* TAB 2: 10 Player Mastery Ranks */}
          <TabsContent value="ranks" className="space-y-6 animate-fade-in">
            <div className="text-center max-w-lg mx-auto mb-6">
              <h2 className="text-2xl font-bold">10 Speaker Mastery Ranks</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Accumulate XP through practice sessions and challenge clears to advance your global speaker rank.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {PLAYER_RANKS.map((rank) => {
                const isCurrent = playerLevel.level === rank.level;
                const isUnlocked = xp >= rank.minXp;

                return (
                  <Card
                    key={rank.level}
                    className={`relative overflow-hidden transition-all duration-300 ${
                      isCurrent
                        ? 'border-2 border-emerald-500 shadow-md bg-emerald-500/5'
                        : isUnlocked
                        ? 'border-border bg-card'
                        : 'border-border/60 bg-muted/40 opacity-70'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-muted/80 border flex items-center justify-center text-2xl">
                            {rank.emoji}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">Level {rank.level}: {rank.title}</CardTitle>
                              {isCurrent && (
                                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px]">
                                  CURRENT
                                </Badge>
                              )}
                            </div>
                            <CardDescription className="text-xs mt-0.5">
                              {rank.minXp} XP required
                            </CardDescription>
                          </div>
                        </div>

                        {isUnlocked ? (
                          <div className="text-emerald-600 bg-emerald-500/10 p-1.5 rounded-full">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                        ) : (
                          <div className="text-muted-foreground bg-muted p-1.5 rounded-full">
                            <Lock className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="text-muted-foreground">{rank.description}</p>
                      <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-primary">
                        <Award className="h-4 w-4 text-emerald-500" />
                        <span>Perk: {rank.perk}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB 3: Trophy Room (Badges Showcase) */}
          <TabsContent value="trophies" className="space-y-6 animate-fade-in">
            <div className="text-center max-w-lg mx-auto mb-6">
              <h2 className="text-2xl font-bold">Trophy Case & Badges</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Collect badges by clearing speech levels, maintaining daily streaks, and achieving high mastery scores.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allBadges.map((badge) => {
                const isEarned = hasBadge(badges, badge);
                const unlockedAt = badgeDates[badge.id];

                return (
                  <Card
                    key={badge.id}
                    className={`relative overflow-hidden transition-all duration-300 ${
                      isEarned
                        ? 'border-amber-400/40 bg-gradient-to-br from-amber-500/5 via-card to-card shadow-sm'
                        : 'border-border/60 bg-muted/30 opacity-60'
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl">
                          {badge.emoji}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase font-bold ${
                              badge.rarity === 'Legendary'
                                ? 'border-amber-500 text-amber-600 bg-amber-500/10'
                                : badge.rarity === 'Epic'
                                ? 'border-purple-500 text-purple-600 bg-purple-500/10'
                                : badge.rarity === 'Rare'
                                ? 'border-blue-500 text-blue-600 bg-blue-500/10'
                                : 'border-slate-300 text-slate-600'
                            }`}
                          >
                            {badge.rarity}
                          </Badge>
                          {isEarned && (
                            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Unlocked
                            </span>
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-base mt-2">{badge.title}</CardTitle>
                      <CardDescription className="text-xs">{badge.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs space-y-2">
                      <div className="rounded-lg bg-muted/60 p-2 text-muted-foreground font-medium">
                        Target: {badge.criteria}
                      </div>
                      {isEarned && unlockedAt && (
                        <p className="text-[11px] font-semibold text-emerald-600">
                          Unlocked {new Date(unlockedAt).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <LevelIntroModal
        level={introLevel}
        open={!!introLevel}
        onClose={() => setIntroLevel(null)}
        onStart={handleStart}
      />
    </Layout>
  );
}
