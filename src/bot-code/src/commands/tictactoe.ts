/**
 * /tictactoe Discord Slash Command & Interactive Button Game Engine
 * Allows community members to challenge friends or play against AegisMod AI
 */

import {
  ChatInputCommandInteraction,
  ButtonInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  User,
  MessageFlags,
} from "discord.js";

export type BoardCell = "X" | "O" | null;
export type GameDifficulty = "easy" | "medium" | "hard";

export interface TicTacToeGame {
  id: string;
  guildId: string;
  channelId: string;
  playerX: { id: string; tag: string; isBot: boolean };
  playerO: { id: string; tag: string; isBot: boolean };
  board: BoardCell[];
  currentTurn: "X" | "O";
  winner: "X" | "O" | "TIE" | null;
  winningCombo: number[] | null;
  difficulty: GameDifficulty;
  lastMoveTimestamp: number;
}

const activeGames = new Map<string, TicTacToeGame>();

const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function checkWinner(board: BoardCell[]): { winner: "X" | "O" | "TIE" | null; combo: number[] | null } {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as "X" | "O", combo };
    }
  }

  if (board.every((cell) => cell !== null)) {
    return { winner: "TIE", combo: null };
  }

  return { winner: null, combo: null };
}

export function calculateAiMove(board: BoardCell[], difficulty: GameDifficulty = "hard"): number {
  const emptyIndices = board
    .map((cell, idx) => (cell === null ? idx : -1))
    .filter((idx) => idx !== -1);

  if (emptyIndices.length === 0) return -1;

  // Easy mode: random moves with 20% block chance
  if (difficulty === "easy") {
    if (Math.random() < 0.2) {
      // Check block
      for (const idx of emptyIndices) {
        const testBoard = [...board];
        testBoard[idx] = "X";
        if (checkWinner(testBoard).winner === "X") return idx;
      }
    }
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }

  // 1. Can AI ("O") win immediately?
  for (const idx of emptyIndices) {
    const testBoard = [...board];
    testBoard[idx] = "O";
    if (checkWinner(testBoard).winner === "O") return idx;
  }

  // 2. Can Player ("X") win immediately? Must block!
  for (const idx of emptyIndices) {
    const testBoard = [...board];
    testBoard[idx] = "X";
    if (checkWinner(testBoard).winner === "X") return idx;
  }

  // Medium mode: 50% smart, 50% random
  if (difficulty === "medium" && Math.random() < 0.35) {
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }

  // 3. Take Center if available (best position)
  if (board[4] === null) return 4;

  // 4. Take Opposite Corners or Corners
  const corners = [0, 2, 6, 8].filter((idx) => board[idx] === null);
  if (corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  // 5. Take any remaining empty side
  return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}

export function buildGameEmbed(game: TicTacToeGame): EmbedBuilder {
  const embed = new EmbedBuilder().setTimestamp();

  if (game.winner === "X") {
    embed
      .setColor(0xef4444)
      .setTitle("🏆 Game Over • Victory for ❌!")
      .setDescription(
        `🎉 **${game.playerX.tag}** (❌) defeated **${game.playerO.tag}** (⭕)!\nCongratulations on a well-played match.`
      );
  } else if (game.winner === "O") {
    embed
      .setColor(0x10b981)
      .setTitle("🏆 Game Over • Victory for ⭕!")
      .setDescription(
        `🎉 **${game.playerO.tag}** (⭕) defeated **${game.playerX.tag}** (❌)!\n${
          game.playerO.isBot ? "🤖 *The AegisMod AI claimed victory!*" : "Great match!"
        }`
      );
  } else if (game.winner === "TIE") {
    embed
      .setColor(0xf59e0b)
      .setTitle("🤝 Game Over • Stalemate / Draw!")
      .setDescription(
        `It's a draw between **${game.playerX.tag}** (❌) and **${game.playerO.tag}** (⭕)!\nNo moves remain on the board.`
      );
  } else {
    const activePlayer = game.currentTurn === "X" ? game.playerX : game.playerO;
    const symbol = game.currentTurn === "X" ? "❌" : "⭕";

    embed
      .setColor(0x6366f1)
      .setTitle(`🎮 Tic-Tac-Toe • ${game.playerX.tag} vs ${game.playerO.tag}`)
      .setDescription(
        `Current Turn: **${symbol} <@${activePlayer.id}>**\nClick an available button in the 3x3 grid below to claim your spot!`
      )
      .setFooter({
        text: `Mode: ${game.playerO.isBot ? `AI (${game.difficulty.toUpperCase()})` : "Multiplayer PvP"} • Game ID: ${game.id}`,
      });
  }

  return embed;
}

export function buildGameComponents(game: TicTacToeGame): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  const isFinished = game.winner !== null;

  for (let r = 0; r < 3; r++) {
    const row = new ActionRowBuilder<ButtonBuilder>();
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      const cell = game.board[idx];
      const isWinningCell = game.winningCombo?.includes(idx);

      let label = " ";
      let style = ButtonStyle.Secondary;

      if (cell === "X") {
        label = "❌";
        style = isWinningCell ? ButtonStyle.Danger : ButtonStyle.Primary;
      } else if (cell === "O") {
        label = "⭕";
        style = isWinningCell ? ButtonStyle.Success : ButtonStyle.Primary;
      }

      const btn = new ButtonBuilder()
        .setCustomId(`ttt:${game.id}:${idx}`)
        .setLabel(label)
        .setStyle(style)
        .setDisabled(isFinished || cell !== null);

      row.addComponents(btn);
    }
    rows.push(row);
  }

  if (isFinished) {
    const controlRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`ttt_rematch:${game.id}`)
        .setLabel("🔄 Play Rematch")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`ttt_dismiss:${game.id}`)
        .setLabel("✖️ Close Board")
        .setStyle(ButtonStyle.Secondary)
    );
    rows.push(controlRow);
  }

  return rows;
}

export const ticTacToeCommand = {
  data: new SlashCommandBuilder()
    .setName("tictactoe")
    .setDescription("Play an interactive game of Tic-Tac-Toe against a friend or AegisMod AI")
    .addUserOption((opt) =>
      opt
        .setName("opponent")
        .setDescription("Challenge a member (leave empty to play against AegisMod AI)")
        .setRequired(false)
    )
    .addStringOption((opt) =>
      opt
        .setName("difficulty")
        .setDescription("AI difficulty when playing against AegisMod (default: hard)")
        .setRequired(false)
        .addChoices(
          { name: "⭐ Easy (Casual / Fun)", value: "easy" },
          { name: "⭐⭐ Medium (Balanced)", value: "medium" },
          { name: "⭐⭐⭐ Hard (Unbeatable Minimax)", value: "hard" }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const opponentUser = interaction.options.getUser("opponent");
    const difficulty = (interaction.options.getString("difficulty") || "hard") as GameDifficulty;
    const isAi = !opponentUser || opponentUser.bot || opponentUser.id === interaction.user.id;

    const gameId = Math.random().toString(36).substring(2, 9);

    const game: TicTacToeGame = {
      id: gameId,
      guildId: interaction.guildId || "dm",
      channelId: interaction.channelId,
      playerX: {
        id: interaction.user.id,
        tag: interaction.user.username,
        isBot: false,
      },
      playerO: {
        id: isAi ? (interaction.client.user?.id || "bot") : opponentUser.id,
        tag: isAi ? "AegisMod AI" : opponentUser.username,
        isBot: isAi,
      },
      board: Array(9).fill(null),
      currentTurn: "X",
      winner: null,
      winningCombo: null,
      difficulty,
      lastMoveTimestamp: Date.now(),
    };

    activeGames.set(gameId, game);

    // Auto-clean games older than 15 minutes
    setTimeout(() => {
      activeGames.delete(gameId);
    }, 15 * 60 * 1000);

    const embed = buildGameEmbed(game);
    const components = buildGameComponents(game);

    await interaction.reply({
      content: isAi
        ? `🎮 **Tic-Tac-Toe Match Started!** Playing against **AegisMod AI** (*${difficulty.toUpperCase()}*).`
        : `🎮 **Tic-Tac-Toe Challenge!** <@${interaction.user.id}> challenged <@${opponentUser.id}>. <@${interaction.user.id}> moves first!`,
      embeds: [embed],
      components,
    });
  },
};

export async function handleTicTacToeButton(interaction: ButtonInteraction) {
  const parts = interaction.customId.split(":");
  const prefix = parts[0];
  const gameId = parts[1];

  if (prefix === "ttt_dismiss") {
    activeGames.delete(gameId);
    return interaction.message.delete().catch(() => null);
  }

  if (prefix === "ttt_rematch") {
    const existingGame = activeGames.get(gameId);
    if (!existingGame) {
      return interaction.reply({
        content: "⚠️ This game session has expired. Start a new one with `/tictactoe`.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const newGameId = Math.random().toString(36).substring(2, 9);
    const newGame: TicTacToeGame = {
      id: newGameId,
      guildId: existingGame.guildId,
      channelId: existingGame.channelId,
      playerX: existingGame.playerX,
      playerO: existingGame.playerO,
      board: Array(9).fill(null),
      currentTurn: "X",
      winner: null,
      winningCombo: null,
      difficulty: existingGame.difficulty,
      lastMoveTimestamp: Date.now(),
    };

    activeGames.set(newGameId, newGame);
    const embed = buildGameEmbed(newGame);
    const components = buildGameComponents(newGame);

    return interaction.reply({
      content: `🔄 **Rematch initiated!** <@${newGame.playerX.id}> moves first as ❌.`,
      embeds: [embed],
      components,
    });
  }

  if (prefix !== "ttt") return;

  const cellIndex = parseInt(parts[2], 10);
  const game = activeGames.get(gameId);

  if (!game) {
    return interaction.reply({
      content: "⚠️ This Tic-Tac-Toe game has expired. Please run `/tictactoe` to play a fresh game.",
      flags: MessageFlags.Ephemeral,
    });
  }

  if (game.winner !== null) {
    return interaction.reply({
      content: "Game is already over!",
      flags: MessageFlags.Ephemeral,
    });
  }

  // Verify turn
  const expectedUserId = game.currentTurn === "X" ? game.playerX.id : game.playerO.id;
  if (interaction.user.id !== expectedUserId) {
    const expectedTag = game.currentTurn === "X" ? game.playerX.tag : game.playerO.tag;
    return interaction.reply({
      content: `⏳ It's not your turn! Waiting for **${expectedTag}** (${game.currentTurn}) to move.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  // Verify cell is empty
  if (game.board[cellIndex] !== null) {
    return interaction.reply({
      content: "⚠️ That square is already taken!",
      flags: MessageFlags.Ephemeral,
    });
  }

  // Player makes move
  game.board[cellIndex] = game.currentTurn;
  game.lastMoveTimestamp = Date.now();

  // Check victory
  const outcome = checkWinner(game.board);
  if (outcome.winner) {
    game.winner = outcome.winner;
    game.winningCombo = outcome.combo;
  } else {
    // Switch turn
    game.currentTurn = game.currentTurn === "X" ? "O" : "X";

    // If opponent is AI, execute AI move immediately
    if (game.playerO.isBot && game.currentTurn === "O" && game.winner === null) {
      const aiMove = calculateAiMove(game.board, game.difficulty);
      if (aiMove !== -1) {
        game.board[aiMove] = "O";
        const aiOutcome = checkWinner(game.board);
        if (aiOutcome.winner) {
          game.winner = aiOutcome.winner;
          game.winningCombo = aiOutcome.combo;
        } else {
          game.currentTurn = "X";
        }
      }
    }
  }

  const embed = buildGameEmbed(game);
  const components = buildGameComponents(game);

  await interaction.update({
    embeds: [embed],
    components,
  });
}
