import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GamePlayer } from "@/components/game-player";
import { GAMES, getGame } from "@/lib/games";

// Unknown ids must 404 with a real status, so params are read outside Suspense.
export const instant = false;

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

export async function generateMetadata({ params }: PageProps<"/games/[id]/play">): Promise<Metadata> {
  const game = getGame((await params).id);
  return game ? { title: `Jugando ${game.title} · Arcade Vault` } : {};
}

export default async function PlayPage({ params }: PageProps<"/games/[id]/play">) {
  const game = getGame((await params).id);
  if (!game) notFound();

  return <GamePlayer game={game} />;
}
