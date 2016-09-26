# appctheme
Simple theme builder for appcelerator apps. This is for a very specific use case where we had an appcelerator app that needed to be replicated (or white-labeled) and the only thing that was changing was *colors*, *logo*, and *title*. As it's very specific, please read through the entire Setup.

![Screencast](https://cdn.rawgit.com/senica/appctheme/master/out.gif)

# Install
Run `npm install appctheme -g`

# Setup
You must have a theme directory inside your app directory as described here: http://docs.appcelerator.com/platform/latest/#!/guide/Alloy_Styles_and_Themes.
```
root
  +- app
    +- themes
```

Your `themes` folder should have at least one theme directory that is the name of your theme.

This folder should have the following:
- `assets` directory
- `lib` directory
- `styles` directory
- `config.json` file
- `DefaultIcon.png` file
- `tiapp.xml` file

Your `assets` directory is not used by this app, but should follow theming practices by appcelerator

`lib` can be an empty directory or you can use it as you wish. This app will install a `colors.js` file that you can use inside your appcelerator app. It is generated from the `app.tss` file inside the `styles` directory.

`styles` is a directory that should contain an `app.tss` file. The `app.tss` file styles should contain only single directives. e.g.:
```
'.headerBorder1':{
	backgroundColor: '#CEAD5B',
}
```
this won't work:
```
'.headerBorder1':{
	backgroundColor: '#CEAD5B',
  color: '#CEAD5B',
}
```

`app.tss` should at a minimum contain
```
'.headerBg':{
	backgroundColor: '#58A5C4',
}
```
as this will be used to generate your logo.

`colors.js` will end up creating an object such that if you did `var colors = require('colors');` you could do `colors.headerBorder1`

`config.json` is the standard appcelerator config file. It will get copied over to the `app` directory. See http://docs.appcelerator.com/platform/latest/#!/guide/Project_Configuration_File_(config.json)

`DefaultIcon.png` is your logo. You can make it whatever size you want. I used 2048x2048 and it will be scaled down. If you open up the index.js file here you can see an option where you could create all the icons, but it's time consuming. This script will take your logo and apply the headerBg backgroundColor from the app.tss as stated above.

`tiapp.xml` is your standard tiapp.xml file that is generated when doing `appc new`. I put it in the theme folder because version numbers are managed by this script on deploy and it is copied over to the root of your project.

At the end your directory structure might look like this:
```
root/
  +- app/
    +- themes/
      +- mytheme/
        +- assets/
        +- lib/
        +- styles/
          +- app.tss (must contain at least '.headerBg':{backroundColor: #FFFFFF}; this is converted to ../lib/colors.js
        +- config.json (standard appcelerator config format); this is copied to ../../app/config.json
        +- DefaultIcon.png (2048x2048 or 1024x1024 may be transparent logo) solid background image is made from this an copied to ../../../DefaultIcon.png and appcelerator generates all the icons from this
        +- tiapp.xml (standard appcelerator file); version numbers will be changed in this file on release and copied to ../../../tiapp.xml
```

# Run
From your appcelerator's project root directory, run `appctheme`.

# Options
There are only a couple command line options:
- **skip-assets** - Don't build images from DefaultIcon.png `appctheme --skip-assets`
- **theme** - what theme to use instead of being prompted `appctheme --theme=mytheme`

Well, if that helps anyone, let me know.
