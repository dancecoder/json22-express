/*
MIT License

Copyright (c) 2022 Dmitry Dutikov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

/**
 * @param {number} from
 * @param {number} to
 * @return {string[]}
 * */
function crange(from, to) {
    const result = [];
    for (let i = from, max = to; i <= max; i++) {
        result.push(String.fromCharCode(i));
    }
    return result;
}

const ESCAPE = '\\';
const DQUOTE = '"';
const SP = ' ';
const HTAB = '\t';
const WSP = [SP, HTAB];
const DIGIT = ['0','1','2','3','4','5','6','7','8','9'];
const ALPHA = [...crange(0x41, 0x5A), ...crange(0x61, 0x7A)]; // A-Z / a-z
const VCHAR = [...crange(0x21, 0x7E)]; // visible (printing) characters
const TCHAR = ['!','#','$','%','&','\'','*','+','-','.','^','_','`','|','~',...DIGIT,...ALPHA];

const OBS_TEXT = [...crange(0x80, 0xFF)];
const QDTEXT = [HTAB,SP,'!',...crange(0x23, 0x5B),...crange(0x5D, 0x7E),...OBS_TEXT];


// https://datatracker.ietf.org/doc/html/rfc7231#section-3.1.1.5
// Content-Type = media-type

export class MediaType {

    // https://datatracker.ietf.org/doc/html/rfc7231#section-3.1.1.1
    // media-type = type "/" subtype *( OWS ";" OWS parameter )
    // type       = token
    // subtype    = token
    // parameter  = token "=" ( token / quoted-string )

    // optional whitespace (https://datatracker.ietf.org/doc/html/rfc7230#section-3.2.3)
    // OWS = WSP

    // https://datatracker.ietf.org/doc/html/rfc7230#section-3.2.6
    // token      = 1*tchar
    // tchar      = "!" / "#" / "$" / "%" / "&" / "'" / "*" / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~" / DIGIT / ALPHA
    // quoted-string  = DQUOTE *( qdtext / quoted-pair ) DQUOTE
    // qdtext         = HTAB / SP /%x21 / %x23-5B / %x5D-7E / obs-text
    // obs-text       = %x80-FF
    // quoted-pair    = "\" ( HTAB / SP / VCHAR / obs-text )

    // https://datatracker.ietf.org/doc/html/rfc5234#appendix-B.1
    // ALPHA      =  %x41-5A / %x61-7A   ; A-Z / a-z
    // DIGIT      =  %x30-39             ; 0-9

    /**
     * @param {string} type
     * @param {string} [subtype]
     * @param {Record<string, string>} [parameters = {}]
     * */
    constructor(type, subtype, parameters= {}) {
        this.type = type;
        this.subtype = subtype;
        this.parameters = parameters;
    }

    toString() {
        const result = [this.type, '/', this.subtype];
        for (const [name, value] of this.parameters) {
            result.push(';');
            result.push(name);
            result.push('=');
            result.push(value);
        }
        return result.join('');
    }

    /**
     * @param {string} text
     * @return {MediaType}
     * */
    static parse(text) {
        const buffer = [];
        let state = ['type'];
        let type = undefined;
        let subtype = undefined;
        let lastParamName = undefined;
        const params = {};
        for (let i = 0, max = text.length; i < max; i++) {
            const c = text.charAt(i);
            switch (state[state.length-1]) { // TODO: replace by state.at(-1) as far as node >16.6.0 will we available at AWS
                case 'type':
                    switch (c) {
                        case (TCHAR.indexOf(c) > -1 ? c : null):
                            buffer.push(c);
                            break;
                        case '/':
                            type = buffer.join('');
                            buffer.length = 0;
                            state.pop();
                            state.push('subtype');
                            break;
                        default:
                            throw new Error('Unexpected character. Valid media type expected.');
                    }
                    break;
                case 'subtype':
                    switch (c) {
                        case ((TCHAR.indexOf(c)) > -1 ? c : null):
                            buffer.push(c);
                            break;
                        default:
                            subtype = buffer.join('');
                            buffer.length = 0;
                            state.pop();
                            state.push('param');
                            i--;
                            break;
                    }
                    break;
                case 'param':
                    switch (c) {
                        case ((WSP.indexOf(c)) > -1 ? c : null):
                            buffer.push(c);
                            break;
                        case ';':
                            buffer.push(c);
                            break;
                        case ((TCHAR.indexOf(c)) > -1 ? c : null):
                            if (buffer.indexOf(';') > -1) {
                                buffer.length = 0;
                                state.push('paramName');
                                i--;
                            } else {
                                throw new Error('Unexpected character. Semicolon \';\' expected');
                            }
                            break;
                        default:
                            throw new Error('Unexpected character. Media type parameter expected.');

                    }
                    break;
                case 'paramName':
                    switch (c) {
                        case ((TCHAR.indexOf(c)) > -1 ? c : null):
                            buffer.push(c);
                            break;
                        case '=':
                            lastParamName = buffer.join('');
                            buffer.length = 0;
                            state.pop();
                            state.push('paramValue');
                            break;
                        default:
                            throw new Error('Unexpected character. Parameter name expected');
                    }
                    break;
                case 'paramValue':
                    switch (c) {
                        case DQUOTE:
                            state.pop();
                            state.push('paramValueQuoted');
                            break;
                        case (TCHAR.indexOf(c) > -1 ? c : null):
                            buffer.push(c);
                            state.pop();
                            state.push('paramValueToken');
                            break;
                        default:
                            throw new Error('Unexpected character. Parameter value token or quoted string expected');
                    }
                    break;
                case 'paramValueToken':
                    switch (c) {
                        case (TCHAR.indexOf(c) > -1 ? c : null):
                            buffer.push(c);
                            break;
                        default:
                            params[lastParamName] = buffer.join('');
                            buffer.length = 0;
                            state.pop(); // up to param
                            i--;
                            break;
                    }
                    break;
                case 'paramValueQuoted':
                    switch (c) {
                        case DQUOTE:
                            params[lastParamName] = buffer.join('');
                            buffer.length = 0;
                            state.pop(); // up to param
                            break;
                        case (QDTEXT.indexOf(c) > -1 ? c : null):
                            buffer.push(c);
                            break;
                        case ESCAPE:
                            state.push('escapedChar');
                            break;
                        default:
                            throw new Error('Unexpected character. ASCII or quoted char expected');
                    }
                    break;
                case 'escapedChar':
                    switch (c) {
                        case HTAB:
                        case SP:
                        case (VCHAR.indexOf(c) > -1 ? c : null):
                        case (OBS_TEXT.indexOf(c) > -1 ? c : null):
                            buffer.push(c);
                            state.pop();
                            break;
                        default:
                            throw new Error('Unexpected quoted character.');

                    }
                    break;
                default:
                    throw new Error(`Unexpected state ${state[state.length-1]}`);
            }
        }

        switch (state[state.length-1]) { // TODO: replace by state.at(-1) as far as node >16.6.0 will we available at AWS
            case "type":
                type = buffer.join('');
                break;
            case 'subtype':
                subtype = buffer.join('');
                break;
            case 'param':
                // no tail expected
                break;
            case 'paramName':
            case 'paramValue':
            case 'paramValueQuoted':
                throw new Error('Malformed media type parameters. Value expected');
            case 'paramValueToken':
                params[lastParamName] = buffer.join('');
                break;
            case 'escapedChar':
                throw new Error('Malformed media type parameters. Escaped character expected');
            default:
                throw new Error(`Unexpected state ${state[state.length-1]}`);

        }

        return new MediaType(type, subtype, params);
    }

    /**
     * @param {string | MediaType} mt
     * @param {boolean} [includeParameters=false]
     * @param {boolean} [paramValuesCaseSensitive=false]
     * */
    match(mt, includeParameters = false, paramValuesCaseSensitive = false) {
        const mType = mt instanceof MediaType ? mt : MediaType.parse(mt);
        const typeMatch = this.type.toLowerCase() === mType.type?.toLowerCase();
        if (typeMatch) {
            const subtypeMatch = mType.subtype?.toLowerCase() === this.subtype?.toLowerCase() || mType.subtype == null && this.subtype == null;
            if (subtypeMatch) {
                if (includeParameters) {
                    const a = Object.entries(this.parameters);
                    const b = Object.keys(mType.parameters);
                    if (paramValuesCaseSensitive) {
                        return a.length === b.length && a.every(([k, v]) => mType.parameters[k] === v);
                    }
                    return a.length === b.length && a.every(([k, v]) => mType.parameters[k]?.toLowerCase() === v?.toLowerCase());
                }
                return true;
            }
        }
        return false;
    }

}
