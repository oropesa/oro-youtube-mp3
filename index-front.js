// All of the Node.js APIs are available here.
const { ipcRenderer, remote, shell } = require( 'electron' );
const { dialog } = remote;
const fs = require( 'fs' );

const storage = require( 'electron-json-storage' );
const fns = require( './functions' );
const _ = require( 'lodash' );

const confDefault = require( './default-configuration' );

let objMain = {
    folder: '',
    links: [],
    ids: {},
    configuration: {
        default: confDefault,
        current: {}
    }
};

const preInitConfiguration = () => {
    storage.get('currentConfiguration', function( err, data ) {
        if( err ) { console.error( err ); }

        objMain.configuration.current = data || {};
        initConfiguration();
    });
};

const initConfiguration = () => {
    let inputGoogleApiKey = document.getElementById( 'config-google-api-key' );

    inputGoogleApiKey.setAttribute( 'placeholder', objMain.configuration.default.googleApiKey );

    if( objMain.configuration.current.googleApiKey ) {
        inputGoogleApiKey.value = objMain.configuration.current.googleApiKey;
    }

    if( objMain.configuration.current.folderPath ) {
        fns.existFolder( { folder: objMain.configuration.current.folderPath }, ( err, existFolder ) => {
            if( err ) { console.error( err ); return; }

            if( ! existFolder ) {
                objMain.configuration.current.folderPath = "";
                fnUpdateCurrentConfiguration();
            }
            else {
                fnChooseFolderUpdate( objMain.configuration.current.folderPath );
            }
        });
    }
};

const fnUpdateCurrentConfiguration = done => {
    let data = JSON.stringify( objMain.configuration.current, null, 2 );

    storage.set('currentConfiguration', objMain.configuration.current, function( err ) {
        if( err ) { console.error( err ); return; }

        done && done();
    });

};

const fnUpdateConfigGoogleApiKey = () => {
    objMain.configuration.current.googleApiKey = document.getElementById( 'config-google-api-key' ).value;

    fnUpdateCurrentConfiguration( () => {
        ipcRenderer.send( 'oro-update-yd-settings', objMain );
    });
};

const fnChooseFolder = () => {
    let selText = document.getElementById( 'selecter-text' );

    //init
    fns.disableActions();
    selText.innerHTML = '<span class="uk-text-muted">Ruta de la carpeta</span>';

    dialog.showOpenDialog( { properties: [ 'openDirectory' ] }, folderName => {
        if( folderName === undefined || ! folderName[ 0 ] ) {
            //update first json, then main
            objMain.configuration.current.folderPath = "";
            fnUpdateCurrentConfiguration( () => {
                fns.allowActions( [ 'selecter', 'analizer' ] );
                fns.disableActions( [ 'converters' ] );
            });

            return;
        }

        //update first json, then main
        objMain.configuration.current.folderPath = folderName[ 0 ];
        fnUpdateCurrentConfiguration( () => {
            fnChooseFolderUpdate( folderName[ 0 ] );
        });
    });
};

const fnChooseFolderUpdate = ( folderName ) => {
    let selText = document.getElementById( 'selecter-text' );

    objMain.folder = folderName;
    selText.innerHTML = `<span class="the-folder-button uk-link" data-path="${ folderName }">${ folderName }</span>`;

    fns.allowActions( [ 'converters' ] );

    ipcRenderer.send( 'oro-update-yd-settings', objMain );
};

const fnChooseFolderDone = () => {
    fns.allowActions( [ 'selecter', 'analizer' ] );
    fns.checkToAllowMainAction( objMain );
};

const fnOpenFolder = path => {
    shell.openItem( path );
};

const fnOpenLink = ( event, url ) => {
    event.preventDefault();

    shell.openExternal( url );
};

const fnSelectLinks = () => {
    let anaText = document.getElementById( 'analizer-text' );
    let textarea = document.getElementById( 'analizer-textarea' );

    let links = textarea.value.split( "\n" );
    _.remove( links, n => {
        const regexLink = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/).{11,}/;
        return ! regexLink.test( n.trim() );
    } );

    objMain.links = links;
    anaText.innerHTML = links.length;

    fns.checkToAllowMainAction( objMain );
};

const fnValidateLinks = () => {
    fns.disableActions( [ 'fail-validater' ] );

    let $listOfLinks = document.getElementById( 'list-of-links' );

    objMain.links.forEach( link => {
        if( link.indexOf( 'http://' ) === -1 ) { link = 'http://' + link; }

        let url = new URL( link );
        let id = url.searchParams.get( 'v' );
        ! id && ( id = link.substr( link.lastIndexOf( '/' ) + 1 ) );

        if( ! objMain[ id ] ) {

            fns.getYoutubeVideoData( id,
                objMain.configuration.current.googleApiKey || objMain.configuration.default.googleApiKey,
                function( err, data ) {
                    if( err ) {
                        console.error( err );

                        let errorString = JSON.stringify( err );

                        let extraReason = '';
                        switch( true ) {
                            case err.errors && err.errors[ 0 ] && err.errors[ 0 ].reason === 'keyInvalid':
                                extraReason = '<br>La clave de Google Api no es válida.';
                                break;
                        }

                        document.getElementById( 'fail-validater-info' ).innerHTML = `
                            <span uk-icon='icon: question; ratio: .6' style='position: relative; top: -1px;'
                                uk-tooltip='pos: right;title: ${errorString}'></span>${extraReason}`;

                        fns.allowActions( [ 'fail-validater' ] );
                        return;
                    }

                    objMain[ id ] = true;

                    let html = fns.templateLinkRow( id, link, data.resume, objMain.folder );
                    let $node = document.createElement( 'DIV' );
                    $node.innerHTML = html;

                    $listOfLinks.appendChild( $node );
                });
        }
    } );

};

const fnConvertYoutubeVideo = data => {
    if( ! data.id ) { return; }

    let theTitle = document.getElementById( data.id ).getElementsByClassName( 'the-title' )[ 0 ].value;
    ! theTitle && ( theTitle = undefined );

    document.getElementById( data.id ).getElementsByClassName( 'the-title' )[ 0 ].setAttribute( 'disabled', 'disabled' );

    document.getElementById( data.id ).getElementsByClassName( 'the-percentage' )[ 0 ].classList.remove( 'uk-hidden' );
    document.getElementById( data.id ).getElementsByClassName( 'the-percentage-number' )[ 0 ].innerHTML = 1;
    document.getElementById( data.id ).getElementsByClassName( 'the-spinner' )[ 0 ].classList.remove( 'uk-hidden' );
    document.getElementById( data.id ).getElementsByClassName( 'the-fail' )[ 0 ].classList.add( 'uk-hidden' );
    document.getElementById( data.id ).getElementsByClassName( 'the-convert-button' )[ 0 ].classList.add( 'uk-hidden' );

    ipcRenderer.send( 'oro-yd-download', data.id, theTitle );
};

const fnConvertYoutubeVideoFail = ( event, data ) => {
    if( ! data.id ) { return; }

    document.getElementById( data.id ).getElementsByClassName( 'the-title' )[ 0 ].removeAttribute( 'disabled' );

    document.getElementById( data.id ).getElementsByClassName( 'the-convert-button' )[ 0 ].classList.remove( 'uk-hidden' );
    document.getElementById( data.id ).getElementsByClassName( 'the-spinner' )[ 0 ].classList.add( 'uk-hidden' );
    document.getElementById( data.id ).getElementsByClassName( 'the-percentage' )[ 0 ].classList.add( 'uk-hidden' );

    let errorString = JSON.stringify( data );

    let theFail = document.getElementById( data.id ).getElementsByClassName( 'the-fail' )[ 0 ];
    theFail.classList.remove( 'uk-hidden' );
    theFail.setAttribute( 'uk-tooltip', `pos:left;title:${errorString}` );

};

const fnConvertYoutubeVideoProgress = ( event, data ) => {
    if( ! data.id ) { return; }

    let theNumber = parseInt( data.progress.progress.percentage );

    document.getElementById( data.id ).getElementsByClassName( 'the-percentage-number' )[ 0 ].innerHTML = Math.min( theNumber, 99 );

    let theProgress = document.getElementById( data.id ).getElementsByClassName( 'the-progress' )[ 0 ];
    theProgress.setAttribute( 'value', theNumber );
};

const fnConvertYoutubeVideoDone = ( event, data ) => {
    if( ! data.id ) { return; }

    document.getElementById( data.id ).getElementsByClassName( 'the-done' )[ 0 ].classList.remove( 'uk-hidden' );
    document.getElementById( data.id ).getElementsByClassName( 'the-spinner' )[ 0 ].classList.add( 'uk-hidden' );

    document.getElementById( data.id ).getElementsByClassName( 'the-percentage-number' )[ 0 ].innerHTML = 100;
    let theProgress = document.getElementById( data.id ).getElementsByClassName( 'the-progress' )[ 0 ];
    theProgress.setAttribute( 'value', '100' );
};

const listenerDinamicElements = event => {
    const link = fns.isTheTargetTree( event.target, { tag: 'A' }, 'href' );
    if( link ) { fnOpenLink( event, link ); }

    const videoYoutubeID = fns.isTheTargetTree( event.target, { class: 'the-convert-button' }, 'data-id' );
    if( videoYoutubeID ) { fnConvertYoutubeVideo( { id: videoYoutubeID } ); }

    const folderPath = fns.isTheTargetTree( event.target, { class: 'the-folder-button' }, 'data-path' );
    if( folderPath ) { fnOpenFolder( folderPath ); }
};

preInitConfiguration();

document.getElementById( 'config-google-api-key' ).addEventListener('change', fnUpdateConfigGoogleApiKey );

document.getElementById( 'selecter-button' ).addEventListener('click', fnChooseFolder );

document.getElementById( 'analizer-textarea' ).addEventListener( 'paste', fnSelectLinks );
document.getElementById( 'analizer-textarea' ).addEventListener( 'keyup', fnSelectLinks );

document.getElementById( 'validater-button' ).addEventListener('click', fnValidateLinks );

document.addEventListener( "click", listenerDinamicElements );

ipcRenderer
    .on( 'oro-update-yd-settings-done', fnChooseFolderDone            )
    .on( 'oro-yd-download-fail'       , fnConvertYoutubeVideoFail     )
    .on( 'oro-yd-download-progress'   , fnConvertYoutubeVideoProgress )
    .on( 'oro-yd-download-done'       , fnConvertYoutubeVideoDone     );

