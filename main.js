const { app, ipcMain } = require( 'electron' );
const path = require ('path');
const is = require('electron-is');
const YoutubeMp3Downloader = require( 'youtube-mp3-downloader' );

const Window = require( './Window' );
const fns = require( './functions' );

let mainWindow;
let mainYDSettings;

function createWindow () {
    mainWindow = new Window( { file: 'index.html' } );
    mainWindow.on('closed', () => { mainWindow = null } );
}

app.on( 'ready', createWindow );
app.on( 'activate', () => { if( mainWindow === null ) { createWindow() } } );
app.on( 'window-all-closed', () => { if( process.platform !== 'darwin' ) { app.quit(); } } );

// SERVER FN
ipcMain.on( 'oro-update-yd-settings', ( event, objFile ) => {

    let mainFolder = process.cwd();
    let osFolder = is.macOS() ? 'mx64' :
                   is.windows() ? is.x64() ? 'wx64' : 'wx32'
                       : 'wx32'; // default

    mainYDSettings = {
        "ffmpegPath": `${mainFolder}\\ffmpeg\\${osFolder}\\bin\\ffmpeg`, // Where is the FFmpeg binary located?
        "outputPath": objFile.folder,     // Where should the downloaded and encoded files be stored?
        "youtubeVideoQuality": "highest", // What video quality should be used?
        "queueParallelism": 2,            // How many parallel downloads/encodes should be started?
        "progressTimeout": 1500           // How long should be the interval of the progress reports
    };

    event.sender.send( 'oro-update-yd-settings-done', true );

});

ipcMain.on( 'oro-yd-download', ( event, id, title ) => {

    const YD = new YoutubeMp3Downloader( mainYDSettings );
    YD.download( id, `${title}.mp3` );

    YD.on( 'finished', function( err, data ) {
        event.sender.send( 'oro-yd-download-done', { id, data } );
    });

    YD.on( 'error', function( error ) {
        event.sender.send( 'oro-yd-download-fail', { id, error } );
    });

    YD.on( 'progress', function( progress ) {
        event.sender.send( 'oro-yd-download-progress', { id, progress } );
    });

});