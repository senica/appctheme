#! /usr/bin/env node
var dir = process.cwd()
/*
 * node build.js --skip-icons --theme=<theme-directory>
 */
var fs = require('fs');
var btoa = require('btoa');
var inquirer = require('inquirer');
var spawn = require('child_process').spawn;

var a = require('minimist')(process.argv.slice(2), {
  default: {
    theme: null,
    'skip-assets': false,
    platform: null,
  }
});

if(!a.platform){
  selectPlatform();
}else{
  getTheme();
}

function selectPlatform(){
  inquirer.prompt([{
    type: 'list',
    name: 'platform',
    message: 'Which platform are you targeting?',
    choices: [
      {name: 'Android', value: 'android'},
      {name: 'iOS', value: 'ios'},
    ],
  }]).then(function (answers) {
    a.platform = answers.platform;
    getTheme();
  });
}

function getTheme(){
  if(!a.theme){
    console.log('You may provide a theme:\r\nappctheme --theme=xxx');
    selectTheme();
  }else{
    checkTheme(a.theme);
  }
}

function checkTheme(theme){
  try{
    var themes = fs.readdirSync(dir + '/app/themes');
  }catch(e){
    console.log('You should run this from the root of your appcelerator project and there should be a themes directory in your app folder.');
    return;
  }
  if(themes.indexOf(theme) < 0){
    console.log('Invalid theme provided.\r\n');
    selectTheme();
  }else{
    copy(theme);
  }
}

function selectTheme(){
  var themes = [];
  try{
    themes = fs.readdirSync(dir + '/app/themes');
  }catch(e){}
  if(!themes.length){
    console.log('You should run this from the root of your appcelerator project and there should be a themes directory in your app folder.');
    return;
  }
  inquirer.prompt([{
    type: 'list',
    name: 'theme',
    message: 'Select one of the available themes below:',
    choices: function(){
      return themes;
    },
  }]).then(function (answers) {
    copy(answers.theme);
  });
}


var base, app, resources, theme;
function copy(_theme){
  console.log('Building theme: ', _theme);
  base = dir;
  app = base + '/app';
  resources = base + '/Resources';
  theme = app + '/themes/'+_theme;

  copyFile(theme+'/config.json', app+'/config.json', function(err){
    if(err) return console.log('failed to copy config');
    config();
  });

  function config(){
    copyFile(theme+'/tiapp.xml', base+'/tiapp.xml', function(err){
      if(err) return console.log('failed to copy config');
      styles();
    });
  }

  function styles(){
    console.log('Writing colors library');
    var styles = fs.readFileSync(theme + '/styles/app.tss');
    var parser = require(base + '/tss.js');
    var t = parser.parse('{'+styles.toString()+'}');
    var o = {};
    for(var i in t){
      var key = i.replace(/[#\.]/g, '');
      // get value of first child
      var value = t[i][Object.keys(t[i])[0]]
      o[key] = value;
    }
    fs.writeFileSync(theme + '/lib/colors.js', 'module.exports = '+JSON.stringify(o));
    console.log('Color library created here:' + theme + '/lib/colors.js');
    icons();
  }

  function icons(){
    if(a['skip-assets']){
      console.log("Skipping Building Assets");
      return appc();
    }
    var pica = require('pica');
    var Canvas = require('canvas');
    var Image = Canvas.Image;

    var colors = require(theme + '/lib/colors.js');
    var sizes = [
      /*
      // App icons
      { width: 29, height: 29, title: 'appicon-Small.png'},
      { width: 58, height: 58, title: 'appicon-Small@2x.png'},
      { width: 87, height: 87, title: 'appicon-Small@3x.png'},
      { width: 40, height: 40, title: 'appicon-Small-40.png'},
      { width: 80, height: 80, title: 'appicon-Small-40@2x.png'},
      { width: 120, height: 120, title: 'appicon-Small-40@3x.png'},
      { width: 60, height: 60, title: 'appicon-60.png'},
      { width: 120, height: 120, title: 'appicon-60@2x.png'},
      { width: 180, height: 180, title: 'appicon-60@3x.png'},
      { width: 76, height: 76, title: 'appicon-76.png'},
      { width: 152, height: 152, title: 'appicon-76@2x.png'},
      { width: 167, height: 167, title: 'appicon-83.5@2x.png'},

      // Splash Screen
      { width: 640, height: 960, title: 'Default@2x.png'},
      { width: 640, height: 1136, title: 'Default-568h@2x.png'},
      { width: 750, height: 1334, title: 'Default-667h@2x.png'},
      { width: 2208, height: 1242, title: 'Default-Landscape-736h@3x.png'},
      { width: 1242, height: 2208, title: 'Default-Portrait-736h@3x.png'},
      { width: 1024, height: 768, title: 'Default-Landscape.png'},
      { width: 768, height: 1024, title: 'Default-Portrait.png'},
      { width: 2048, height: 1536, title: 'Default-Landscape@2x.png'},
      { width: 1536, height: 2048, title: 'Default-Portrait@2x.png'},

      // iTunes Artwork
      { width: 512, height: 512, title: 'iTunesArtwork'},
      { width: 1024, height: 1024, title: 'iTunesArtwork@2x'},
      */

      // Default
      { width: 1024, height: 1024, title: 'DefaultIcon.png', default: true},
      { width: 1024, height: 1024, title: 'appicon.png', default: true},
      { width: 1024, height: 1024, title: 'default.png', default: true},
      /*
      { width: 1024, height: 1024, title: 'DefaultIcon.png', default: true},
      { width: 1024, height: 1024, title: 'DefaultIcon-ios.png', background: false},

      { width: 1024, height: 1024, title: 'iTunesConnect.png', background: false},
      { width: 512, height: 512, title: 'MarketplaceArtwork.png', background: false},*/
    ]

    fs.readFile(theme + '/DefaultIcon.png', function(err, logo){
      if (err) throw err;
      var img = new Image;
      img.dataMode = Image.MODE_MIME | Image.MODE_IMAGE; // Both are tracked
      img.onload = images;
      img.src = logo;

      function images(){
        if(!sizes.length){
          console.log('Finished preparing assets.');
          return appc();
        }
        var size = sizes.shift();
        var canvas = new Canvas(size.width, size.height);
        var min = Math.min(size.width, size.height);

        if(a.platform == 'android'){
          var file = size.default === true ? (app + '/assets/android/' + size.title) : (app + '/platform/android/' + size.title);
        }else if(a.platform == 'ios'){
          var file = size.default === true ? (base + '/' + size.title) : (app + '/platform/iphone/' + size.title);
        }
        var out = fs.createWriteStream(file)
        var stream = canvas.pngStream();
        stream.on('data', function(chunk){
          out.write(chunk);
        });
        stream.on('end', function(){
          console.log(file);
          images();
        });

        var ctx = canvas.getContext('2d');

        if(size.background !== false){
          //var grd=ctx.createLinearGradient(0,0,0,size.height);
          //grd.addColorStop(0, colors.primary);
          //grd.addColorStop(1, colors.secondary);
          ctx.fillStyle=colors.headerBg;
          ctx.fillRect(0,0,size.width,size.height);
        }

        var _canvas = new Canvas(min - 10, min - 10);
        pica.resizeCanvas(img, _canvas, {
          alpha: true,
        }, function(err){
          if(err) return; // should terminate here
          ctx.drawImage(_canvas, (size.width / 2) - ((min - 5) / 2), (size.height / 2) - ((min - 5) / 2));
        })

      }

    });
  }
}

function appc(){
  inquirer.prompt([{
    type: 'list',
    name: 'what',
    message: 'What would you like to do?',
    choices: [
      {name: 'Clean', value: 'clean'},
      {name: 'Test on Simulator', value: 'test'},
      {name: 'Test on Device', value: 'device'},
      {name: 'Deploy', value: 'deploy'},
      {name: 'Exit', value: 'exit'},
    ],
  }]).then(function (answers) {
    if(answers.what == 'clean'){
      clean();
    }else if(answers.what == 'exit'){
      return;
    }else if(answers.what == 'device'){
      testDevice();
    }else if(answers.what == 'test'){
      getDevices(test);
    }else if(answers.what == 'deploy'){
      checkVersion(deploy);
    }
  });
}

function clean(){
  var child = spawn('appc', [
    'ti', 'clean',
  ], {
    shell: true,
    stdio: 'inherit',
  });

  child.on('close', function(){
    console.log('Finished cleaning.');
    appc();
  })
}

function getDevices(cb){
  console.log('Getting list of devices...');
  if(a.platform == 'ios'){
    var devices = '';
    var child = spawn('instruments', [
      '-s', 'devices',
    ]);

    child.stdout.on('data', function(data){
      devices += data;
    });

    child.on('close', function(){
      devices = devices.split(/\n/g);
      devices.shift(); // Remove 'Known Devices'
      var _devices = [];
      devices.forEach(function(device){
        var matches = /^([^\[]+)\[([^\]]+)\](.*?)$/.exec(device);
        if(matches && matches.length)
          _devices.push({name: matches[1] + matches[3], value: matches[2] });
      });

      inquirer.prompt([{
        type: 'list',
        name: 'device',
        message: 'Select your device:',
        choices: _devices,
      }]).then(function (answers) {
        cb(answers.device);
      });

    })
  }else if(a.platform == 'android'){
    var devices = '';
    var child = spawn('appc', [
      'ti', 'info', '-t', 'android'
    ]);

    child.stdout.on('data', function(data){
      devices += data;
    });

    child.on('close', function(){
      devices = devices.split(/\n/g);
      var _devices = [];
      devices.forEach(function(device, i){
        if(device == 'Android Emulators'){
          var id = devices[i+1].replace(/^\s+/, '').replace(/\s+$/, '');
          _devices.push({name: 'Emulator - '+id, value: id, type: 'emulator'});
        }if(device == 'Connected Android Devices'){
          // only grabbing the first one for now
          var id = devices[i+1].replace(/^\s+/, '').replace(/\s+$/, '');
          _devices.push({name: 'Device - '+id, value: id, type: 'device'});
        }
      });

      inquirer.prompt([{
        type: 'list',
        name: 'device',
        message: 'Select your device:',
        choices: _devices,
      }]).then(function (answers, test) {
        for(var i in _devices){
          if(_devices[i].value == answers.device){
            return cb(_devices[i]);
          }
        }
      });

    })
  }
}

function test(deviceid){
  if(a.platform == 'ios'){
    //appc run -p ios -T simulator -C "C13CE766-CAE5-4AD8-B99A-8C85BE6FAFAD"
    var child = spawn('appc', [
      'run', '-p', 'ios', '-T', 'simulator', '-C', deviceid
    ], {
      shell: true,
      stdio: 'inherit',
    });

    child.on('close', function(){
      console.log('finished testing');
    })
  }else if(a.platform == 'android'){
    //appc run -p android -T device
    // appc run -p android
    //appc run -p android -T device --device-id <DEVICE_ID>
    var ar = [
      'run', '-p', 'android'
    ];
    if(deviceid){
      ar.push('--device-id', deviceid.value, '-T', deviceid.type);
    }
    console.log('appc ' + ar.join(' '));
    var child = spawn('appc', ar, {
      shell: true,
      stdio: 'inherit',
    });

    child.on('close', function(){
      console.log('finished testing');
    })
  }
}

function testDevice(){
  //if(a.platform == 'ios'){
    //appc run -p ios -T device
    console.log(`You will need to register the device in the developer console.
      Then create a DEVELOPMENT provisioning profile with that device added.
      Download and add the provisioning profile to Xcode by dragging it on the
      icon (or do it through preferences). The run the above command.`)
    var child = spawn('appc', [
      'run', '-p', 'ios', '-T', 'device'
    ], {
      shell: true,
      stdio: 'inherit',
    });

    child.on('close', function(){
      console.log('finished testing');
      appc()
    })
  /*}else if(a.platform == 'android'){
    //appc run -p android -T device
    // appc run -p android
    //appc run -p android -T device --device-id <DEVICE_ID>
    var ar = [
      'run', '-p', 'android'
    ];
    if(deviceid){
      ar.push('--device-id', deviceid.value, '-T', deviceid.type);
    }
    console.log('appc ' + ar.join(' '));
    var child = spawn('appc', ar, {
      shell: true,
      stdio: 'inherit',
    });

    child.on('close', function(){
      console.log('finished testing');
    })
  }*/
}

function checkVersion(cb){
  var xml = fs.readFileSync(theme + '/tiapp.xml').toString();

  if(a.platform == 'android'){
    var versionCode = "1";
    var versionCodes = /([^]+)(<android[^<]+)(<manifest)([^>]+)?([^]+)/gmi.exec(xml);
    if(versionCodes[4]){
      var _versionCodes = /([^]+)(android:versionCode=")([^\"]+)?([^]+)/gmi.exec(versionCodes[4]);
      // remove versioncode from manifest so we can build it later
      versionCode = _versionCodes[3];
      versionCodes[4] = _versionCodes[1] + _versionCodes[4];
    }else{
      versionCodes[4] = '';
    }
    inquirer.prompt([{
      type: 'input',
      name: 'version',
      message: 'Enter new versionCode or press <enter> to keep current ['+versionCode+']:',
    }]).then(function (answers) {
      if(answers.version){
        versionCode = answers.version;
        console.log('Changing to versionCode:' + answers.version);
      }
      versionCodes[4] += ' android:versionCode="'+versionCode+'"';
      xml = versionCodes[1] + versionCodes[2] + versionCodes[3] + versionCodes[4] + versionCodes[5];
      version();
    });
  }else{
    version();
  }

  function version(){
    var matches = /([^]+)(<version>)([^<]+)(<\/version>)([^]+)/gmi.exec(xml);
    var version = matches[3];
    inquirer.prompt([{
      type: 'input',
      name: 'version',
      message: 'Enter new version or press <enter> to keep current ['+version+']:',
    }]).then(function (answers) {
      if(answers.version){
        version = answers.version;
        console.log('Changing to version:' + version);
      }else{
        console.log("Keeping current version: ", version);
      }
      var newversion = matches[1] + matches[2] + version + matches[4] + matches[5];
      fs.writeFileSync(theme + '/tiapp.xml', newversion);
      console.log('Creating copy for build...');
      fs.writeFileSync(base + '/tiapp.xml', newversion);
      cb(version);
    });
  }
}

function deploy(){
  console.log('Building...');
  if(a.platform == 'ios'){
    var child = spawn('appc', [
      'run', '-f', '-p', 'ios', '-F', 'universal', '-T', 'dist-appstore', '-I', '9.3'
    ], {
      shell: true,
      stdio: 'inherit',
    });
  }else if(a.platform == 'android'){
    var child = spawn('appc', [
      'run', '-f', '-p', 'android', '-T', 'dist-playstore'
    ], {
      shell: true,
      stdio: 'inherit',
    });
  }

  child.on('close', function(){
    console.log('Finished building.');
    appc();
  })
}

function googlePlay(){
  console.log('Building...');
  //appc run -p android -T dist-playstore
  //'-F', 'universal',
  var child = spawn('appc', [
    'run', '-f', '-p', 'android', '-T', 'dist-playstore'
  ], {
    shell: true,
    stdio: 'inherit',
  });

  child.on('close', function(){
    console.log('Finished building.');
    appc();
  })
}

function copyFile(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}
