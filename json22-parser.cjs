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

const { Writable } = require('stream');
const { Buffer } = require('buffer');
const { JSON22 } = require('json22');

class Json22Parser extends Writable {

    #options;
    #charset;
    #target;
    #keepRawAs;
    #maxContentLength;

    #chunks = [];
    #length = 0;

    /**
     * @param {object} target
     * @param {string} charset
     * @param {number | null | undefined} maxContentLength
     * @param {string | null | undefined} keepRawAs
     * @param {Json22ParseOptions} options
     * */
    constructor(target, charset, maxContentLength, keepRawAs, options = {}) {
        super();
        this.#target = target;
        this.#charset = charset;
        this.#options = options;
        this.#keepRawAs = keepRawAs;
        this.#maxContentLength = maxContentLength;
    }

    _write(chunk, encoding, callback) {
        if (encoding === 'buffer') {
            this.#chunks.push(chunk);
            this.#length += chunk.length;
            if (this.#maxContentLength != null && this.#length > this.#maxContentLength) {
                callback(new Error('Maximum content length exceeded'));
            } else {
                callback();
            }
        } else {
            callback(new Error('Buffer chunks supported only'));
        }
    }

    _final(callback) {
        const buffer = Buffer.concat(this.#chunks);
        const text = buffer.toString(this.#charset);
        try {
            this.#target.body = JSON22.parse(text, this.#options);
            if (this.#keepRawAs != null) {
                this.#target[this.#keepRawAs] = buffer;
            }
            callback();
        } catch (e) {
            callback(e);
        }
    }
}

module.exports = { Json22Parser };
