const { BrowserWindow } = require( 'electron' );

const defaultProps = {
    width: 1024,
    height: 640,
    webPreferences: { nodeIntegration: true },
    show: false
};

class Window extends BrowserWindow {
    constructor( { file, ...windowSettings } ) {
        super( { ...defaultProps, ...windowSettings } );

        this.loadFile( file );
        this.once( 'ready-to-show', () => { this.show() } );
    }
}

module.exports = Window;