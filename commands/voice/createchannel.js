const { log } = require("../../functions.js");

exports.run = (client, message, args) => {
    if (message.member.voiceChannel) {
        if (args.length == 0) message.reply("Not enough arguments. Type !-help");
        else if (args.length == 1) {
            channel = makeChannel(message, args[0], 0, message);
            message.reply("The channel is created.");
        } else {
            channel = makeChannel(message, args[0], args[1], message);
            message.reply("The channel is created.");
        }
    } else message.reply("First enter to a voice channel");
}

function makeChannel(message, name, limit, message) {
    var server = message.guild;
    let category = server.channels.find(
        c => c.name == "Игровые" && c.type == "category"
    );
    server
        .createChannel(name, { type: "voice" })
        .then(channel => {
            channel.userLimit = limit;

            if (!category) throw new Error("Category of the channel does not exist");
            channel.setParent(category.id);
            channel
                .edit({ bitrate: 96000 })
                .then(vc => { })
                .catch(console.error);
            if (message.member.voiceChannel) {
                message.member.setVoiceChannel(channel);
            }
            log(`create voice channel ${name}`, "Guild " + message.guild, message.member.tag);
        }).catch(console.error);
}