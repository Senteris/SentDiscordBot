var mysql = require("mysql");
const config = require('../config.json');

var pool = mysql.createPool({
  host: config.dbHost,
  user: config.dbUser,
  password: config.dbPassword,
  database: config.dbName,
  queueLimit: 0,
  connectionLimit: 0,
  multipleStatements: true
});

function endConnect(connection) {
  connection.release(function(err) {
    if (err) throw err;
    console.log("A connection is closed:)");
  });
}

function select(table, column, value, resolve) {
  pool.getConnection(function(err, conn) {
    if (err) return console.log(err);
    conn.query(`SELECT * FROM ${table} WHERE ${column} = '${value}'`, function( err, result, fields ) {
      if (err) throw err;
      endConnect(conn);
      var json;
      if (result.length == 0) {
        resolve(undefined);
        return(undefined); // for what?
      }        
      result.forEach(function(row) {
        let string = JSON.stringify(row); // ?
        json = JSON.parse(string); // decode
        resolve(json);
        return json; // for what?
      });
    });
  });
}

function getGuild(guild, resolveMain) {
  new Promise(function (resolve) {
    select("guilds", "guildID", guild.id, resolve);
  }).then(function (guildDB) {
    if (guildDB != null) { // if guild exists in the table
      guildDB.whiteChannels = JSON.parse(guildDB.whiteChannels);
      guildDB.gameRoles = JSON.parse(guildDB.gameRoles);
      resolveMain(guildDB);
    } else { // it inserts guild to the table
      new Promise(function (resolve2) {
        insert("guilds", "`guildID`", guild.id, resolve2);
      }).then(function(er){
        if(!er) {
          getGuild(guild, resolveMain);
          console.log(`New guild! "${guild}", ID: ${guild.id}`);
        }
        else { // console.error in insert
          const guildDefault = {
            guildID: guild.id,
            bitrate: 96,
            whiteChannels: new Array(),
            prefix: "!-",
            gameRoles: new Array()
          }; // default
          resolveMain(guildDefault);
        }
      });
    }
  });
}

function insert(table, column, value, resolve) {
  let columns;
  if (Object.prototype.toString.call(column) === "[object Array]") {
    for (i = 0; i != column.length; i++) {
      columns += column[i] + ", ";
    } columns += column[column.length - 1]; // columns = "... column5, column6 (w/o ',')"
  } else columns = column; // else columns == column

  let values;
  if (Object.prototype.toString.call(value) === "[object Array]") {
    //The Same
    for (i = 0; i != value.length; i++) {
      values += value[i] + ", ";
    } values += value[value.length - 1];
  } else values = value;

  let col, val;
  if (Object.prototype.toString.call(value) === "[object Array]" || Object.prototype.toString.call(column) === "[object Array]") {
    col = column[0]; // column with 0 index must be id
    val = value[0];
  } else{
    col = column;
    val = value;
  }
  new Promise(function (resolve1) {
    select(table, col, val, resolve1);
  }).then(function (sth) {
    if (typeof sth == "undefined") { // in case if guild somehow already exist (bugfix)
      pool.getConnection(function(err, conn) {
        if (err) { console.log(err); resolve("error"); return; }
        conn.query(`INSERT INTO ${table} (${columns}) values (${values})`, function( err, result, fields ) {
          if (err) { console.log(err); resolve("error"); return; }
          endConnect(conn);
          resolve(undefined);
        });
      });
    }
    else resolve(undefined);
  });
}

function updateGuild(column, value, guild, resolveMain) {
  let updateString = makeUpdateString(column, value);
  pool.getConnection(function(err, conn) {
    if (err) return console.log(err);
    conn.query(`UPDATE guilds SET ${updateString} WHERE guildID = ${guild.id};`, function( err, result, fields ) {
      if (err) {
        console.error(err);
        resolveMain(false);
      }
      resolveMain(true);
      endConnect(conn);
    });
  });
}

function update(table, column, value, where_col, where_var, msg = '') {
  let whereString = "";
  if (Object.prototype.toString.call(where_col) === "[object Array]") {
    for (i = 0; i != where_col.length - 2; i++){
      whereString += `${where_col[i]} = ${where_var[i]} AND `;
    } whereString += `${where_col[where_col-1]} = ${where_var[where_col-1]}`;
  } else whereString = `${where_col} = ${where_var}`;
  let updateString = makeUpdateString(column, value);
  pool.getConnection(function(err, conn) {
    if (err) return console.log(err);
    conn.query(`UPDATE ${table} SET ${updateString} WHERE ${whereString}`, function( err, result, fields ) {
      if (err) {
        console.error(err);
        resolveMain(false);
      }
      resolveMain(true);
      endConnect(conn);
    });
  });
}

function makeUpdateString(column, value){
  let updateString = "";
  if (Object.prototype.toString.call(column) === "[object Array]") {
    for (i = 0; i != column.length - 2; i++) { // TEST later
      updateString += `${column[i]}` + " = " + value[i] + ", ";
    }
    updateString += `${column[column.length - 1]}` + " = " + value[value.length - 1];
  } else updateString += `${column}` + " = " + value;
  return updateString;
}

exports.update = update;
exports.updateGuild = updateGuild;
exports.insert = insert;
exports.select = select;
exports.getGuild = getGuild;
