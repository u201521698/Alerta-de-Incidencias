var ws = require('ws.js')
  , Http = ws.Http
  , Security = ws.Security
  , UsernameToken = ws.UsernameToken

var request =  '<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">' +
                  '<Header />' +
                    '<Body>' +
                      '<EchoString xmlns="http://tempuri.org/">' +
                        '<s>123</s>' +
                      '</EchoString>' +
                    '</Body>' +
                '</Envelope>'

var ctx =  { request: request 
           , url: "http://service/security"
           , action: "http://tempuri.org/EchoString"
           , contentType: "text/xml" 
           }

var handlers =  [ new Security({}, [new UsernameToken({username: "yaron", password: "1234"})])
                , new Http()
                ]

ws.send(handlers, ctx, function(ctx) {                    
  console.log("response: " + ctx.response);
})  
