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

import zlib from 'zlib';
import { JSON22 } from 'json22';
import { Buffer } from 'buffer';
import { pipeline } from 'stream';
import { MediaType } from './media-type.js';
import { Json22Parser } from './json22-parser.js';

const JSON22_MEDIA_TYPE = MediaType.parse(JSON22.mimeType);
const JSON_MEDIA_TYPE = MediaType.parse('application/json');
const DEFAULT_CHARSET = 'utf-8';
const SUPPORTED_CHARSETS = ['utf-8', 'utf8', 'utf-16', 'utf16', 'utf-32', 'utf32'];
const SUPPORTED_ENCODINGS = ['deflate', 'gzip', 'br', 'identity'];

const HTTP_PAYLOAD_TOO_LARGE = 413;
const HTTP_UNSUPPORTED_MEDIA_TYPE = 415;

const JSON22_WAS_HERE = Symbol();

/**
 * @param {Json22ExpressOptions} [options = {}]
 * */
export function json22express(options = {}) {

    const SUPPORTED_MEDIA_TYPE = [JSON22_MEDIA_TYPE];
    if (options.handleJson) {
        SUPPORTED_MEDIA_TYPE.push(JSON_MEDIA_TYPE);
    }

    /**
     * @param {IncomingMessage} req
     * @param {ServerResponse} res
     * @param {Function} next
     * */
    async function json22Middleware (req, res, next) {

        if (req[JSON22_WAS_HERE] === true) {
            next(new Error('Duplicated json22 middleware on the pipe'));
            return;
        }

        req[JSON22_WAS_HERE] = true;

        res.json22 = function (obj) {
            const serialized = JSON22.stringify(obj, options.json22StringifyOptions);
            res.set('Content-Type', JSON22.mimeType);
            return res.send(serialized);
        }

        if (options.overrideResponseJsonMethod) {
            res.json = function (obj) {
                if (arguments.length > 1) {
                    throw new Error('Too much arguments');
                }
                return res.json22(obj);
            }
        }

        if (req.headers['transfer-encoding'] == null && (req.headers['content-length'] == null || req.headers['content-length'] === '0')) {
            next();
            return;
        }

        const contentLength = Number(req.headers['content-length']);
        if (options.maxContentLength != null && contentLength > options.maxContentLength) {
            res.status(HTTP_PAYLOAD_TOO_LARGE).send('Payload too large');
            return;
        }

        const ct = MediaType.parse(req.headers['content-type'] ?? '');
        if (SUPPORTED_MEDIA_TYPE.some(mt => ct.match(mt))) {
            const charset = ct.parameters.charset?.toLowerCase() ?? DEFAULT_CHARSET;
            if (Buffer.isEncoding(charset) && SUPPORTED_CHARSETS.some(enc => enc === charset)) {
                const encoding = req.headers['content-encoding']?.toLowerCase() ?? 'identity';
                if (SUPPORTED_ENCODINGS.some(enc => enc === encoding)) {
                    const streams = [req];
                    switch (encoding) {
                        case 'deflate': streams.push(zlib.createInflate()); break;
                        case 'gzip': streams.push(zlib.createGunzip()); break;
                        case 'br': streams.push(zlib.createBrotliDecompress()); break;
                        case 'identity':
                        default:
                            break;
                    }
                    streams.push(new Json22Parser(req, charset, options.maxContentLength, options.keepRawAs, options.json22ParseOptions));
                    await pipeline(...streams, err => {
                        if (err == null) {
                            next();
                        } else {
                            res.status(HTTP_UNSUPPORTED_MEDIA_TYPE).send(`Wrong content encoding: ${err.code ?? err.message}`);
                        }
                    });
                } else {
                    res.status(HTTP_UNSUPPORTED_MEDIA_TYPE).send(`Unsupported content encoding "${encoding}"`);
                }
            } else {
                res.status(HTTP_UNSUPPORTED_MEDIA_TYPE).send(`Unsupported charset "${ct.parameters.charset}"`);
            }
        } else {
            next();
        }

    }

    return json22Middleware;
}
