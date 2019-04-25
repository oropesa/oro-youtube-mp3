# ORO YOUTUBE TO MP3

This is a personal project with 2 purposes: <br>
· improve my electronjs skills, <br>
· download several mp3 audios from youtube videos without ads or waitings. <br>

Because of personal reasons, I decided to use the spanish language in the front views. <br>
In the future, hopefully, I'll add the language support, and other features. <br>

The app is compiled in the folder `dist` only in Windows x64. <br>
It has support for macx64, winx86 and winx64. But unfortunately I didn't test it efficiently.

#### App <small>& Versions</small>

* Version 0.1.0
    * [Installer for Windows x64](https://oropensando.com/extrafiles/oro-youtube-mp3/Oro-youtube-mp3-Setup-0.1.0-x64.exe).

### How it works

It's really simple.

<small>(Optional). If you want, press the blue cog and insert your Google API key to avoid the saturation of the default key usage.</small>

1. `Choose` the folder where you want the mp3s will be downloaded.
2. `Copy & paste` in the textarea all the youtube video links that you want.
3. `Validate` all the links. With this action it will create a list of the youtube links.
4. (Optional) If you want, you can `change the title` of each audio. 
5. Press the `'download' button` of each audio to start. <br><small>Each audio has their own thread, so **you can download several audio at the same time**.</small>

### Screenshots

<img src="https://oropensando.com/extrafiles/oro-youtube-mp3/oro-youtube-mp3-screenshot-initial.png" alt="Oro Youtube Mp3 Screenshot Initial" style="border: 1px solid"/><br><br>
<img src="https://oropensando.com/extrafiles/oro-youtube-mp3/oro-youtube-mp3-screenshot-downloading.png" alt="Oro Youtube Mp3 Screenshot Downloading" style="border: 1px solid"/><br><br>
<img src="https://oropensando.com/extrafiles/oro-youtube-mp3/oro-youtube-mp3-screenshot-config.png" alt="Oro Youtube Mp3 Screenshot Configuration" style="border: 1px solid"/><br>

### Electronjs

To install dependencies (node_modules):
```bash
npm install
```

To install ffmpeg library:<br>
· Download builds [here](https://ffmpeg.zeranoe.com/builds/) and save them in their respective folder.<br>
<small>Make sure the file 'ffmpeg' is hosted in the correct diretory tree.</small>
```
ffmpeg/
├── mx64/
│   └── bin/ffmpeg
├── wx64/
│   └── bin/ffmpeg.exe
└── wx86/
    └── bin/ffmpeg.exe
```

To run meanwhile developing:
```bash
npm start
```

To build the app installer (dist):
```bash
npm run dist
```