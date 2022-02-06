import { strict as assert } from 'assert';
import { suite, test } from 'mocha';
import { MediaType } from '../media-type.js';

suite('Media type match tests', () => {

    test('type only', () => {
        const mt = new MediaType('text');
        assert.equal(mt.match('text'), true);
        assert.equal(mt.match('text/html'), false);
    });

    test('type/subtype', () => {
        const mt = new MediaType('text', 'html');
        assert.equal(mt.match('text/html'), true);
        assert.equal(mt.match('text/html', true), true);
        assert.equal(mt.match('text/html;encoding=utf-8'), true);
        assert.equal(mt.match('text/plain'), false);
        assert.equal(mt.match('application/html'), false);
    });

    test('with a parameter', () => {
        const mt = new MediaType('text', 'html', { encoding: 'utf-8' });
        assert.equal(mt.match('text/html; encoding=utf-8', true), true);
        assert.equal(mt.match('text/html', true), false);
        assert.equal(mt.match('text/html; encoding=utf-8; lineFeeds=crlf', true), false);
    });

    test('with few parameters', () => {
        const mt = new MediaType('text', 'html', { encoding: 'utf-8', lineFeeds: 'crlf' });
        assert.equal(mt.match('text/html; encoding=utf-8; lineFeeds=crlf', true), true);
        assert.equal(mt.match('text/html; encoding=utf-8', true), false);
        assert.equal(mt.match('text/html', true), false);
    });

    test('case sensitiveness', () => {
        const mt = new MediaType('text', 'html', { encoding: 'UTF8' });
        assert.equal(mt.match('text/html; encoding=UTF8', true, true), true);
        assert.equal(mt.match('Text/html; encoding=UTF8', true, true), true);
        assert.equal(mt.match('text/HTML; encoding=UTF8', true, true), true);
        assert.equal(mt.match('text/html; encoding=utf8', true, true), false);
    });

    test('match to MediaType', () => {
        const mt = new MediaType('text', 'html', { encoding: 'UTF8' });
        assert.equal(mt.match(mt, true, true), true);
        assert.equal(mt.match(mt, true), true);
        assert.equal(mt.match(mt), true);
    });



});
