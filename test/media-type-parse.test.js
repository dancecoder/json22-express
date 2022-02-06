import { strict as assert } from 'assert';
import { suite, test } from 'mocha';
import { MediaType } from '../media-type.js';

suite('Media type parse tests', () => {

    test('type only', () => {
        const mediaType = 'text';
        const mt = MediaType.parse(mediaType);
        assert.equal(mt.type, 'text');
        assert.equal(mt.subtype, undefined);
        assert.deepEqual(mt.parameters, { });
    });

    test('type/subtype', () => {
        const mediaType = 'text/html';
        const mt = MediaType.parse(mediaType);
        assert.equal(mt.type, 'text');
        assert.equal(mt.subtype, 'html');
        assert.deepEqual(mt.parameters, { });
    });

    test('type/subtype a parameter', () => {
        const mediaType = 'text/html; encoding=utf-8';
        const mt = MediaType.parse(mediaType);
        assert.equal(mt.type, 'text');
        assert.equal(mt.subtype, 'html');
        assert.deepEqual(mt.parameters, { encoding: 'utf-8' });
    });

    test('few parameters', () => {
        const mediaType = 'text/html; encoding=utf-8; lineFeeds=crlf';
        const mt = MediaType.parse(mediaType);
        assert.equal(mt.type, 'text');
        assert.equal(mt.subtype, 'html');
        assert.deepEqual(mt.parameters, { encoding: 'utf-8', lineFeeds: 'crlf' });
    });

    test('few parameters (no space)', () => {
        const mediaType = 'text/html;encoding=utf-8;lineFeeds=crlf';
        const mt = MediaType.parse(mediaType);
        assert.equal(mt.type, 'text');
        assert.equal(mt.subtype, 'html');
        assert.deepEqual(mt.parameters, { encoding: 'utf-8', lineFeeds: 'crlf' });
    });

    test('quoted parameter value', () => {
        const mediaType = 'text/html;encoding="utf-8"';
        const mt = MediaType.parse(mediaType);
        assert.equal(mt.type, 'text');
        assert.equal(mt.subtype, 'html');
        assert.deepEqual(mt.parameters, { encoding: 'utf-8' });
    });

    test('quoted value and escaped character', () => {
        const mediaType = 'text/html;encoding="utf-\\"8\\""';
        const mt = MediaType.parse(mediaType);
        assert.equal(mt.type, 'text');
        assert.equal(mt.subtype, 'html');
        assert.deepEqual(mt.parameters, { encoding: 'utf-"8"' });
    });

    /*
    * controversial decisions
    * */

    test('empty string', () => {
        // NOTE: not sure this is right solution,
        // probably parser should throw an exception this case
        const mediaType = '';
        const mt = MediaType.parse(mediaType);
        assert.equal(mt.type, '');
        assert.equal(mt.subtype, undefined);
        assert.deepEqual(mt.parameters, { });
    });

    test('no parameter after semicolon', () => {
        // NOTE: not sure this is right solution,
        // probably parser should throw an exception this case
        const mediaType = 'text/html;';
        const mt = MediaType.parse(mediaType);
        assert.equal(mt.type, 'text');
        assert.equal(mt.subtype, 'html');
        assert.deepEqual(mt.parameters, { });
    });

    /**
     * negative tests
     * */

    test('wrong type', () => {
        const mediaType = 't\\ext/html';
        assert.throws(
            () => MediaType.parse(mediaType),
            Error,
            'Unexpected character. Valid media type expected.'
        );
    });

    test('wrong subtype', () => {
        const mediaType = 'text/htm[l';
        assert.throws(
            () => MediaType.parse(mediaType),
            Error,
            'Unexpected character. Semicolon \';\' expected'
        );
    });

    test('no semicolon before params', () => {
        const mediaType = 'text/html charset=utf8';
        assert.throws(
            () => MediaType.parse(mediaType),
            Error,
            'Unexpected character. Semicolon \';\' expected'
        );
    });

    test('wrong character before params', () => {
        const mediaType = 'text/html ]; charset=utf8';
        assert.throws(
            () => MediaType.parse(mediaType),
            Error,
            'Unexpected character. Media type parameter expected.'
        );
    });

    test('parameter name starts from wrong char', () => {
        const mediaType = 'text/html;(harset=utf8';
        assert.throws(
            () => MediaType.parse(mediaType),
            Error,
            'Unexpected character. Parameter name expected'
        );
    });

    test('parameter starts from wrong char', () => {
        const mediaType = 'text/html;charset="utf—8"'; // — unicode dash
        assert.throws(
            () => MediaType.parse(mediaType),
            Error,
            'Unexpected character. ASCII or quoted char expected'
        );
    });

    test('not supported escaped char', () => {
        const mediaType = 'text/html;charset="utf\—8"'; // — unicode dash
        assert.throws(
            () => MediaType.parse(mediaType),
            Error,
            'Unexpected character. Unexpected quoted character'
        );
    });

    test('no param value', () => {
        const mediaType = 'text/html;charset=';
        assert.throws(
            () => MediaType.parse(mediaType),
            Error,
            'Malformed media type parameters. Value expected'
        );
    });

    test('no param value quoted', () => {
        const mediaType = 'text/html;charset="';
        assert.throws(
            () => MediaType.parse(mediaType),
            Error,
            'Malformed media type parameters. Value expected'
        );
    });

    test('dropped escaped char', () => {
        const mediaType = 'text/html;charset="utf\\';
        assert.throws(
            () => MediaType.parse(mediaType),
            Error,
            'Malformed media type parameters. Escaped character expected'
        );
    });


});
