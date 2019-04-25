const fs = require( 'fs' );
const path = require( 'path' );

const _ = require( 'lodash' );
const fileType  = require( 'file-type' );
const readChunk = require( 'read-chunk' );

const getYoutubeVideoData = require( './get-youtube-video-data' );

const templateLinkRow = ( id, link, data, folder ) => {
    let buttonStatus = folder ? '' : 'disabled';

    return `
<div id="${id}" class="uk-flex uk-flex-wrap uk-margin-small-top uk-width-1-1 uk-animation-fade" style="border-bottom: 1px solid lightgray;">
    <small class="uk-display-inline-block uk-width-1-4"><small>v: ${id}</small></small>
    <small class="uk-display-inline-block uk-width-1-2">
        <a target="_blank" href="http://youtu.be/fFfX4u6F-Fk"><small class="uk-text-primary">${link}</small>t</a>
    </small>
    <small class="uk-display-inline-block uk-text-right uk-width-1-4">
        <small class="the-percentage uk-hidden"><span class="the-percentage-number">0</span>%</small>
        <span uk-spinner="ratio: .3" class="the-spinner uk-hidden uk-icon uk-spinner"></span>
        <span uk-icon="icon: close; ratio:.7" class="the-fail uk-hidden uk-icon uk-text-danger"></span>
        <span uk-icon="icon: check; ratio:.7" class="the-done uk-hidden uk-icon uk-text-success"></span>
        <button uk-tooltip="pos:left;title:Comenzar" class="the-convert-button uk-button uk-button-link" ${buttonStatus} data-id="${id}">
            <span uk-icon="icon: download; ratio: .6"></span>
        </button>
    </small>
    <div class="uk-margin-small-top uk-flex uk-width-1-1">
        <div>
            <img alt="thumbnail-youtube" width="80" height="60" src="http://img.youtube.com/vi/${id}/0.jpg">
        </div>
        <div class="uk-flex-1 uk-margin-small-left">
            <div class="uk-flex uk-margin-remove">
                <small class="uk-text-muted" style="line-height: 1.7;">Título:</small>
                <small class="uk-flex-1">
                    <input type="text" class="the-title uk-input" style="height: 20px;font-size: 1em;margin-left: .5rem;padding: 0 .2rem;" value="${data.title}">
                </small>
            </div>
            
            <div><small>
                <span class="uk-text-muted">Duración:</span> 
                <span class="the-duration">${data.duration}</span>
            </small></div>
        </div>
    </div>
    <progress class="the-progress uk-margin-small uk-progress" value="1" max="100" style="height: 5px;"></progress>
</div>`;
};

/**
 * @param {array} [filter]
 */
const disableActions = filter => {
    ! filter && ( filter = [ 'selecter', 'analizer', 'convert', 'fail-validater' ] );

    filter.forEach( label => {
        if( label === 'fail-validater' ) {
            document.getElementById( `${label}-text` ).classList.add( 'uk-hidden' );
        }
        if( label === 'analizer' ) {
            document.getElementById( `${label}-textarea` ).setAttribute( 'disabled', 'disabled' ) ;
        }
        if( label === 'converters' ) {
            let theButtons = document.getElementsByClassName( 'the-convert-button' );
            for( let button of theButtons ) { button.setAttribute( 'disabled', 'disabled' ); }
        }

        let button = document.getElementById( `${label}-button` );
        button && button.setAttribute( 'disabled', 'disabled' ) ;
    });
};

/**
 * @param {array} [filter]
 */
const allowActions = filter => {
    ! filter && ( filter = [ 'selecter', 'analizer', 'fail-validater' ] );

    filter.forEach( label => {
        if( label === 'fail-validater' ) {
            document.getElementById( `${label}-text` ).classList.remove( 'uk-hidden' );
        }
        if( label === 'analizer' ) {
            document.getElementById( `${label}-textarea` ).removeAttribute( 'disabled' ) ;
        }
        if( label === 'converters' ) {
            let theButtons = document.getElementsByClassName( 'the-convert-button' );
            for( let button of theButtons ) { button.removeAttribute( 'disabled' ); }
        }

        let button = document.getElementById( `${label}-button` );
        button && button.removeAttribute( 'disabled' );
    });
};

const checkToAllowValidateAction = objMain => {
    if( ! objMain.links.length ) {
        document.getElementById( 'validater-button' ).setAttribute( 'disabled', 'disabled' ) ;
    }
    else {
        document.getElementById( 'validater-button' ).removeAttribute( 'disabled' );
    }
};

/**
 * let theObj = array2obj( { array: [ "one", "two", "three" ] } );
 * // theObj = { 1: "one", 2: "two", 3:"three" }
 *
 * let theObj = array2obj( { array: [ { id: "one", text: "foo" }, { id: "two", text: "bar" } ] }, 'id' );
 * // theObj = { one: { id: "one", text: "foo" }, two: { id: "two", text: "bar" } }
 *
 * @param {object} args
 * @param {array}  args.array
 * @param {string} [args.key]
 * @return {object} obj
 */
const array2obj = args => {
    if( ! args.array || ! args.array.length ) { return {}; }

    let obj = {};
    args.array.forEach( ( value, key ) => {
        let theKey = args.key && value[ args.key ] !== undefined ? value[ args.key ] : key;
        obj[ theKey ] = value;
    });

    return obj;
};

/**
 * @param node
 * @param filter
 * @param attr
 * @return {string|boolean}
 */
let isTheTargetTree = ( node, filter, attr ) => {
    if( node.getAttribute( 'disabled' ) ) { return false; }

    switch( true ) {
        case ! node:
        case node.tagName === 'BODY':
            return false;

        case filter.tag && node.tagName === filter.tag:
            return attr ? node.getAttribute( attr ) : true;

        case filter.class && node.classList && node.classList.contains( filter.class ):
            return attr ? node.getAttribute( attr ) : true;

        default:
            return isTheTargetTree( node.parentElement, filter, attr );
    }
};

/**
 * @param {object}   args
 * @param {string}   args.folder
 * @param {function} [done]
 */
const createFolder = ( args, done ) => {
    fs.stat( args.folder, ( err, stats ) => {
        if( ! err ) {
            return done && done( null, true );
        }
        else if( err.code === "ENOENT" ) {
            fs.mkdir( args.folder, { recursive: true }, ( err ) => {
                if( err ) { return done && done( err ); }
                else {
                    return done && done( null, true );
                }
            });
        }
        else {
            return done && done( err );
        }
    });
};

/**
 * @param {object}   args
 * @param {string}   args.folder
 * @param {function} [done]
 */
const existFolder = ( args, done ) => {
    fs.stat( args.folder, ( err, stats ) => {
        if( ! err ) {
            return done && done( null, true );
        }
        else if( err.code === "ENOENT" ) {
            return done && done( null, false );
        }
        else {
            return done && done( err );
        }
    });
};

/**
 * Async fn that return the list of files for the folder
 *
 * @param {object}  args
 * @param {string}  args.folder
 * @param {boolean} [args.allowSubdir]
 * @param {array}   [args.typeFilter]
 * @param {string}  [args.mainFolder]
 * @param {function} done {array}
 */
const listFilesOfFolder = ( args, done ) => {
    ! args && ( args = {} );
    args.allowSubdir === undefined && ( args.allowSubdir = false );
    args.typeFilter === undefined && ( args.typeFilter = [] );
    args.mainFolder === undefined && ( args.mainFolder = `${args.folder}\\` );

    var results = [];
    fs.readdir( args.folder, function( err, list ) {
        if( err ) { return done( err ); }

        let pending = list.length;
        if( ! pending ) { return done( null, results ); }

        list.forEach( function( file ) {
            let theFile = path.resolve( args.folder, file );
            fs.stat( theFile, function( err, stat ) {
                if( stat && stat.isDirectory() ) {
                    if( ! args.allowSubdir ) {
                        if( ! --pending ) { done( null, results ); }
                    }
                    else {
                        listFilesOfFolder(
                            { folder: theFile, allowSubdir: args.allowSubdir, typeFilter: args.typeFilter, mainFolder: args.mainFolder },
                            function( err, res ) {
                                results = results.concat( res );
                                if( ! --pending ) { done( null, results ); }
                            }
                        );
                    }
                }
                else {
                    let isValidFile = ! args.typeFilter.length;

                    if( args.typeFilter.length ) {
                        const theType = fileType( readChunk.sync( theFile, 0, fileType.minimumBytes ) );
                        if( theType && args.typeFilter.indexOf( theType.ext ) !== -1 ) { isValidFile = true; }
                    }

                    if( isValidFile ) {
                        results.push( {
                            id: _.uniqueId( 'file-' ),
                            name: file,
                            path: theFile.substr( 0, theFile.lastIndexOf( '\\' ) + 1 ),
                            mainFolder: args.mainFolder,
                            base: theFile,
                            relative: './' + theFile.replace( args.mainFolder, '' ).split( '\\' ).join( '/' )
                        });
                    }

                    if( ! --pending ) { done( null, results ); }
                }
            });
        });
    });
};


exports.getYoutubeVideoData = getYoutubeVideoData;
exports.templateLinkRow = templateLinkRow;

exports.allowActions = allowActions;
exports.disableActions = disableActions;
exports.checkToAllowMainAction = checkToAllowValidateAction;

exports.isTheTargetTree = isTheTargetTree;

exports.createFolder = createFolder;
exports.existFolder = existFolder;

exports.listFilesOfFolder = listFilesOfFolder;
exports.listFilesOfFolder = listFilesOfFolder;
