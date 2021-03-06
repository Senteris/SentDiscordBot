const db = require("../../db.js");
const { log } = require("../../functions.js");

exports.run = (client, message, args) => {
  if (!message.member.hasPermission("VIEW_AUDIT_LOG")) return message.reply('**Error:** You do not have "view audit log" permission!');
  new Promise(function (resolve) {
    db.getGuild(message.guild, resolve);
  }).then(function (guildDB) {
    const strWhiteChannels = guildDB.whiteChannels.join(", ");
    const logChannelName = message.guild.channels.find(channel => channel.id == guildDB.logChannel);
    const roleChannelName = message.guild.channels.find(channel => channel.id == guildDB.roleChannel);
    const voiceChannelsCategory = message.guild.channels.find( c => c.id == guildDB.voiceChannelsCategory && c.type == "category" );

    // role ids -> role names
    let gameRoleNames = new Array();
    const roles = message.guild.roles;
    guildDB.gameRoles.forEach(function(item, i, arr) {
      gameRole = roles.find(role => role.id == item);
      if (gameRole != null) { gameRoleNames.push(gameRole.name); }
      else gameRoleNames.push("unknown");
      gameRole = null;
    });
    const strGameRolesNames = gameRoleNames.join(", ");

    message.channel.send({ // for administrators 
      embed: {
        color: 0x2ed32e,
        fields: [{
          name: "Guild settings",
          value: `Guild ID: ${guildDB.guildID}\n` +
            `Bitrate: ${guildDB.bitrate}Kbps\n`+
            `Log channel: ${logChannelName}\n`+
            `White channels: ${strWhiteChannels}\n` +
            `Voice channels category: ${voiceChannelsCategory.name}\n`+
            `Prefix: ${guildDB.prefix}\n\n`+
            `GameRoles names: ${strGameRolesNames}\n`+
            `Role message ID: ${guildDB.roleMessage}\n`+
            `Role channel: ${roleChannelName}`
        }],
      }
    });
  log("Requested settings", undefined, "Guild " + message.guild, message.author.tag);
  });
}