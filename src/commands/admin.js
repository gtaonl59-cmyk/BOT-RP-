import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getUser, saveUser } from '../storage.js';

const D = {
  wallet: 500,
  bank: 0,
  xp: 0,
  level: 1
};

export default {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin economy tools')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    .addSubcommand(s =>
      s.setName('addmoney')
        .setDescription('Add money')
        .addUserOption(o =>
          o.setName('user')
            .setDescription('Target user')
            .setRequired(true))
        .addIntegerOption(o =>
          o.setName('amount')
            .setDescription('Amount')
            .setRequired(true)))

    .addSubcommand(s =>
      s.setName('removemoney')
        .setDescription('Remove money')
        .addUserOption(o =>
          o.setName('user')
            .setDescription('Target user')
            .setRequired(true))
        .addIntegerOption(o =>
          o.setName('amount')
            .setDescription('Amount')
            .setRequired(true)))

    .addSubcommand(s =>
      s.setName('setmoney')
        .setDescription('Set money')
        .addUserOption(o =>
          o.setName('user')
            .setDescription('Target user')
            .setRequired(true))
        .addIntegerOption(o =>
          o.setName('amount')
            .setDescription('Amount')
            .setRequired(true)))

    .addSubcommand(s =>
      s.setName('addxp')
        .setDescription('Add XP')
        .addUserOption(o =>
          o.setName('user')
            .setDescription('Target user')
            .setRequired(true))
        .addIntegerOption(o =>
          o.setName('amount')
            .setDescription('XP amount')
            .setRequired(true)))

    .addSubcommand(s =>
      s.setName('setlevel')
        .setDescription('Set level')
        .addUserOption(o =>
          o.setName('user')
            .setDescription('Target user')
            .setRequired(true))
        .addIntegerOption(o =>
          o.setName('level')
            .setDescription('Level')
            .setRequired(true)))

    .addSubcommand(s =>
      s.setName('resetuser')
        .setDescription('Reset user')
        .addUserOption(o =>
          o.setName('user')
            .setDescription('Target user')
            .setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser('user');

    let e = getUser('economy', user.id, D);

    if (sub === 'addmoney') {
      e.wallet += interaction.options.getInteger('amount');
      saveUser('economy', user.id, e);
    }

    if (sub === 'removemoney') {
      e.wallet = Math.max(
        0,
        e.wallet - interaction.options.getInteger('amount')
      );
      saveUser('economy', user.id, e);
    }

    if (sub === 'setmoney') {
      e.wallet = interaction.options.getInteger('amount');
      saveUser('economy', user.id, e);
    }

    if (sub === 'addxp') {
      e.xp = (e.xp || 0) + interaction.options.getInteger('amount');
      saveUser('economy', user.id, e);
    }

    if (sub === 'setlevel') {
      e.level = interaction.options.getInteger('level');
      saveUser('economy', user.id, e);
    }

    if (sub === 'resetuser') {
      e = { ...D };
      saveUser('economy', user.id, e);
    }

    return interaction.reply({
      content: `✅ Admin action ${sub} applied to ${user.username}`
    });
  }
};
