/**
 * @see https://github.com/goto-bus-stop/get-youtube-title/
 */
const assert = require( 'assert' );
const qs = require( 'querystring' );
const https = require( 'https' );

const DEFAULT_KEY = 'AIzaSyA04eUTmTP3skSMcRXWeXlBNI0luJ2146c';

module.exports = function getYoutubeVideoData( id, key, cb ) {
    if( typeof key === 'function' ) {
        cb = key;
        key = DEFAULT_KEY;
    }

    assert( typeof id  === 'string', 'get-youtube-title: id must be string');
    assert( typeof key === 'string', 'get-youtube-title: key must be string');
    assert( typeof cb  === 'function', 'get-youtube-title: callback must be a function');

    let url = 'https://www.googleapis.com/youtube/v3/videos';
    url += '?' + qs.stringify({ key: key, part: 'snippet,contentDetails', id: id } );

    https.request(url, onrequest).end();

    /**
     * @param {string} duration
     * @return {string}
     */
    function YTDuration2TimeString( duration ) {
        let match = duration.match( /PT(\d+H)?(\d+M)?(\d+S)?/ );

        match = match.slice( 1 ).map( x => { if( x != null ) { return x.replace( /\D/, '' ); } } );

        const hours   = ( parseInt( match[ 0 ] ) || 0 );
        const minutes = ( parseInt( match[ 1 ] ) || 0 );
        const seconds = ( parseInt( match[ 2 ] ) || 0 );

        return new Date( ( hours * 3600 + minutes * 60 + seconds ) * 1000 ).toISOString().substr( 11, 8 );
    }

    /**
     * @param {number} ytdate
     * @return {string}
     */
    function YTDate2DateString( ytdate ) {
        const f2digit = function( number ) { return isNaN( number *1 ) ? '??' : number *1 < 10 ? '0' + number : number +''; };
        const theDate = new Date( ytdate );

        let date = [ f2digit( theDate.getDate() ), f2digit( theDate.getMonth() + 1 ), f2digit( theDate.getFullYear() ) ].join( '/' );
        let time = [ f2digit( theDate.getHours() ), f2digit( theDate.getMinutes() ), f2digit( theDate.getSeconds() ) ].join( ':' );

        return `${date} ${time}`;
    }

    function onrequest( res ) {
        let data = '';
        res.on( 'data' , ondata );
        res.on( 'end'  , onend );
        res.on( 'error', cb );

        function ondata( chunk ) { data += chunk }
        function onend () {
            let json;
            try { json = JSON.parse( data ) } catch( err ) { return cb( err ); }
            onresponse( json );
        }
    }

    function onresponse( json ) {
        if( json.error ) { return cb(json.error); }
        if( json.items.length === 0 ) { return cb( new Error( 'Not found' ) ) }

        let data = json.items[ 0 ];

        data.resume = {
            id            : data.id,
            title         : data.snippet.title,
            description   : data.snippet.description,
            duration      : YTDuration2TimeString( data.contentDetails.duration ),
            publishedDate : YTDate2DateString( data.snippet.publishedAt ),
            thumbnails    : data.snippet.thumbnails,
            channel       : {
                id   : data.snippet.channelId,
                name : data.snippet.channelTitle,
            }
        };

        cb( null, data );
    }
};