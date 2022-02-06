# JSON22-Express
Expressjs middleware providing support to [JSON22](https://github.com/dancecoder/json22#readme) data format in your applications.

## Features
* Ready to use [Express](https://expressjs.com/) middleware
* Parse [JSON22](https://github.com/dancecoder/json22#readme) body content
* Parse JSON body content
* Support for `deflate`, `gzip`, `br` content encodings
* Define Request.json22 method to send [JSON22](https://github.com/dancecoder/json22#readme) encoded data 
* Zero-dependency npm-package (depends on JSON22 only)
* Both CJS/ESM modules support

## Installation
```
npm install json22-express
```
In your application initialization file add as a middleware
```javascript
import express from 'express'; 
import { json22express } from 'json22-express'

const app = express();
app.use(json22express());
```

For old-fashioned applications
```javascript
const express = require('express'); 
const { json22express } = require('json22-express'); 

const app = express();
app.use(json22express());
```

## Configuration
JSON22-Express middleware support set of configuration options.

### Pass options
```javascript
import express from 'express'; 
import { json22express } from 'json22-express'

const app = express();
app.use(json22express({
    overrideResponseJsonMethod: true,
    maxContentLength: 1024 * 1024, // 1 meg
}));
```

### Options
| Option     | Type      | Default | Description                      |
|:-----------|:----------|---------|:----------------------------------|
| handleJson | boolean   | false   | Parse JSON content as well as JSON22 |
| maxContentLength | number | no limit | Prevent from parsing of too large payloads |
| keepRawAs  | string | do not keep raw body | Define `Request` field name to save payload Buffer to | 
| overrideResponseJsonMethod | boolean | false | Override response json method as well |
| json22ParseOptions | Json22ParseOptions | empty | Options to be passed to `JSON22.parse()` method |
| json22StringifyOptions | Json22StringifyOptions | empty | Options to be passed to `JSON22.stringify()` method |

## Usage

```javascript
import express from 'express'; 
import { json22express } from 'json22-express'

const app = express();

app.use(json22express({
    overrideResponseJsonMethod: true,
    maxContentLength: 1024 * 1024, // 1 meg
}));

app.get('/date', (req, res, next) => {
    // Use .json22() method from Response object
    res.status(200).json22({ date: new Date() });
    next();
});

app.get('/json', (req, res, next) => {
    // in case overrideResponseJsonMethod is set to true you may use 
    // .json() method to send JSON22 as well
    res.status(200).json({ date: new Date() });
    next();
});

app.get('/deprecated', (req, res, next) => {
    // WARNING: don't do this. It is deprecated method interface and in case
    // you set overrideResponseJsonMethod to true this method will throw an exception
    res.json(200, { date: new Date() });
    next();
});


```

