import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getUser, saveUser } from '../../storage.js';

export default {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('أدوات الإشراف والرقابة والإدارة')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(s => s.setName('ban').setDescription('حظر عضو من السيرفر')
      .addUserOption(o => o.setName('user').setDescription('العضو المراد حظره').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('السبب').setRequired(false)))
    .addSubcommand(s => s.setName('kick').setDescription('طرد عضو من السيرفر')
      .addUserOption(o => o.setName('user').setDescription('العضو المراد طرده').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('السبب').setRequired(false)))
    .addSubcommand(s => s.setName('warn').setDescription('إعطاء تحذير لعضو')
      .addUserOption(o => o.setName('user').setDescription('العضو المراد تحذيره').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('السبب').setRequired(true)))
    .addSubcommand(s => s.setName('warnings').setDescription('عرض تحذيرات عضو معين')
      .addUserOption(o => o.setName('user').setDescription('العضو المراد فحص تحذيراته').setRequired(true)))
    .addSubcommand(s => s.setName('clearwarnings').setDescription('مسح جميع تحذيرات العضو')
      .addUserOption(o => o.setName('user').setDescription('العضو').setRequired(true)))
    .addSubcommand(s => s.setName('timeout').setDescription('إسكات عضو (تأديب)')
      .addUserOption(o => o.setName('user').setDescription('العضو المراد إسكاته').setRequired(true))
      .addIntegerOption(o => o.setName('minutes').setDescription('المدة بالدقائق').setRequired(true).setMinValue(1).setMaxValue(10080)))
    .addSubcommand(s => s.setName('purge').setDescription('مسح الرسائل من الشات')
      .addIntegerOption(o => o.setName('amount').setDescription('عدد الرسائل (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)))
    .addSubcommand(s => s.setName('givemoney').setDescription('💰 إعطاء مال للاعب (للأدمن فقط)')
      .addUserOption(o => o.setName('user').setDescription('اللاعب المستلم').setRequired(true))
      .addIntegerOption(o => o.setName('amount').setDescription('المبلغ المراد إعطاؤه').setRequired(true).setMinValue(1)))
    .addSubcommand(s => s.setName('giverank').setDescription('👑 إعطاء رتبة (رول) للاعب (للأدمن فقط)')
      .addUserOption(o => o.setName('user').setDescription('اللاعب المستهدف').setRequired(true))
      .addRoleOption(o => o.setName('role').setDescription('الرتبة المراد إعطاؤها').setRequired(true)))
    .addSubcommand(s => s.setName('givejob').setDescription('💼 تعيين عمل/وظيفة للاعب (للأدمن فقط)')
      .addUserOption(o => o.setName('user').setDescription('اللاعب المستهدف').setRequired(true))
      .addStringOption(o => o.setName('job').setDescription('اسم الوظيفة').setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const reason = interaction.options.getString('reason') ?? 'لم يتم تحديد سبب';
    
    let target, member;
    if (sub !== 'purge') {
      target = interaction.options.getUser('user');
      member = await interaction.guild?.members.fetch(target.id).catch(() => null);
    }

    if (sub === 'ban') {
      if (!member) return interaction.reply({ content: '❌ هذا العضو غير موجود في السيرفر.', ephemeral: true });
      if (!member.bannable) return interaction.reply({ content: '❌ لا يمكنني حظر هذا العضو. قد تكون رتبته أعلى مني.', ephemeral: true });
      
      await member.ban({ reason }).catch(() => null);
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('🔨 تم حظر العضو').setColor(0xe74c3c)
          .addFields({ name: 'العضو', value: target.username, inline: true }, { name: 'السبب', value: reason, inline: true })],
      });
    }

    if (sub === 'kick') {
      if (!member) return interaction.reply({ content: '❌ هذا العضو غير موجود في السيرفر.', ephemeral: true });
      if (!member.kickable) return interaction.reply({ content: '❌ لا يمكنني طرد هذا العضو.', ephemeral: true });
      
      await member.kick(reason).catch(() => null);
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('👟 تم طرد العضو').setColor(0xe67e22)
          .addFields({ name: 'العضو', value: target.username, inline: true }, { name: 'السبب', value: reason, inline: true })],
      });
    }

    if (sub === 'warn') {
      const warnings = getUser('warnings', target.id, { list: [] });
      warnings.list.push({ reason, by: interaction.user.id, at: Date.now() });
      saveUser('warnings', target.id, warnings);
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('⚠️ تم إصدار تحذير').setColor(0xf1c40f)
          .addFields(
            { name: 'العضو', value: target.username, inline: true },
            { name: 'رقم التحذير', value: `${warnings.list.length}`, inline: true },
            { name: 'السبب', value: reason },
          )],
      });
    }

    if (sub === 'warnings') {
      const warnings = getUser('warnings', target.id, { list: [] });
      if (!warnings.list.length) return interaction.reply({ content: `✅ **${target.username}** ليس لديه أي تحذيرات سابقة.` });
      
      const desc = warnings.list.map((w, i) => `**${i + 1}.** ${w.reason} — <t:${Math.floor(w.at / 1000)}:R>`).join('\n');
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle(`⚠️ تحذيرات العضو: ${target.username}`).setColor(0xf1c40f).setDescription(desc)],
      });
    }

    if (sub === 'clearwarnings') {
      saveUser('warnings', target.id, { list: [] });
      return interaction.reply({ content: `✅ تم مسح جميع تحذيرات العضو **${target.username}** بنجاح.` });
    }

    if (sub === 'timeout') {
      const minutes = interaction.options.getInteger('minutes');
      if (!member) return interaction.reply({ content: '❌ هذا العضو غير موجود في السيرفر.', ephemeral: true });
      if (!member.moderatable) return interaction.reply({ content: '❌ لا يمكنني تطبيق وقت مستقطع (إسكات) على هذا العضو.', ephemeral: true });

      await member.timeout(minutes * 60 * 1000, reason).catch(() => null);
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('🔇 تم إسكات العضو (Timeout)').setColor(0x95a5a6)
          .addFields(
            { name: 'العضو', value: target.username, inline: true },
            { name: 'المدة', value: `${minutes} دقيقة`, inline: true },
            { name: 'السبب', value: reason },
          )],
      });
    }

    if (sub === 'purge') {
      const amount = interaction.options.getInteger('amount');
      await interaction.deferReply({ ephemeral: true });
      
      const deleted = await interaction.channel?.bulkDelete(amount, true).catch(() => null);
      if (!deleted) return interaction.editReply({ content: '❌ فشل مسح الرسائل. قد تكون الرسائل قديمة جداً (أكثر من 14 يوماً).' });
      
      return interaction.editReply({ content: `✅ تم حظر وحذف **${deleted.size}** رسالة بنجاح.` });
    }

    if (sub === 'givemoney') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: '❌ ليس لديك صلاحية إدارة السيرفر لاستخدام هذا الأمر.', ephemeral: true });
      }

      const amount = interaction.options.getInteger('amount');
      const economy = getUser('economy', target.id, { money: 0 });
      economy.money += amount;
      saveUser('economy', target.id, economy);

      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('💰 إضافة أموال').setColor(0x2ecc71)
          .setDescription(`تم منح **${amount}**$ للاعب ${target}.`)
          .addFields({ name: 'رصيده الحالي الآن:', value: `${economy.money}$` })],
      });
    }

    if (sub === 'giverank') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.reply({ content: '❌ ليس لديك صلاحية إدارة الرتب لاستخدام هذا الأمر.', ephemeral: true });
      }

      if (!member) return interaction.reply({ content: '❌ هذا العضو غير موجود في السيرفر.', ephemeral: true });
      const role = interaction.options.getRole('role');

      const success = await member.roles.add(role).catch(() => null);
      if (!success) return interaction.reply({ content: '❌ فشل إعطاء الرتبة. تأكد أن رتبة البوت أعلى من الرتبة المراد إعطاؤها.', ephemeral: true });

      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('👑 ترقية عضو').setColor(0x3498db)
          .setDescription(`تم إعطاء رتبة ${role} للاعب **${target.username}** بنجاح.`)],
      });
    }

    if (sub === 'givejob') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: '❌ ليس لديك صلاحية إدارة السيرفر لتغيير الوظائف.', ephemeral: true });
      }

      const jobName = interaction.options.getString('job');
      const profile = getUser('profile', target.id, { job: 'عاطل' });
      profile.job = jobName;
      saveUser('profile', target.id, profile);

      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('💼 تعيين وظيفة').setColor(0x9b59b6)
          .setDescription(`تم تعيين وظيفة (**${jobName}**) للاعب ${target} بنجاح.`)],
      });
    }
  },
};
