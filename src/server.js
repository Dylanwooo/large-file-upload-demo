var http = require('http');
var koaStatic = require('koa-static');
var path = require('path');
var koaBody = require('koa-body');
var fs = require('fs');
var Koa = require('koa2');

var app = new Koa();
var port = process.env.PORT || '3001';

var uploadHost = `http://localhost:${port}/uploads/`;

app.use(
  koaBody({
    formidable: {
      uploadDir: path.resolve(__dirname, '../static/uploads'),
    },
    multipart: true,
  })
);

app.use(koaStatic(path.resolve(__dirname, '../static')));

// header setting
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', ctx.headers.origin);
  ctx.set('Access-Control-Max-Age', 864000);
  ctx.set('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
  ctx.set(
    'Access-Control-Allow-Headers',
    'x-requested-with, accept, origin, content-type'
  );

  await next();
});

app.use(ctx => {
  var body = ctx.request.body;
  var files = ctx.request.files ? ctx.request.files.f1 : []; //得到上传文件的数组
  var result = [];
  var fileToken = ctx.request.body.token; // 文件标识
  var fileIndex = ctx.request.body.index; //文件顺序

  if (files && !Array.isArray(files)) {
    //单文件上传容错
    files = [files];
  }

  files &&
    files.forEach(item => {
      var path = item.path.replace(/\\/g, '/');
      var fname = item.name; //原文件名称
      var nextPath =
        path.slice(0, path.lastIndexOf('/') + 1) + fileIndex + '-' + fileToken;
      if (item.size > 0 && path) {
        //得到扩展名
        var extArr = fname.split('.');
        var ext = extArr[extArr.length - 1];
        //var nextPath = path + '.' + ext;
        //重命名文件
        fs.renameSync(path, nextPath);

        result.push(uploadHost + nextPath.slice(nextPath.lastIndexOf('/') + 1));
      }
    });

  ctx.body = `{
        "fileUrl":${JSON.stringify(result)}
    }`;

  if (body.type === 'merge') {
    //合并文件
    var filename = body.filename,
      chunkCount = body.chunkCount,
      folder = path.resolve(__dirname, '../static/uploads') + '/';

    var writeStream = fs.createWriteStream(`${folder}${filename}`);

    var cindex = 0;
    //合并文件
    function fnMergeFile() {
      var fname = `${folder}${cindex}-${fileToken}`;
      var readStream = fs.createReadStream(fname);
      readStream.pipe(writeStream, {end: false});
      readStream.on('end', function() {
        fs.unlink(fname, function(err) {
          if (err) {
            throw err;
          }
        });
        if (cindex + 1 < chunkCount) {
          cindex += 1;
          fnMergeFile();
        }
      });
    }

    fnMergeFile();

    ctx.body = 'merge ok 200';
  }
});

var server = http.createServer(app.callback());
server.listen(port);
console.log('server has started');
