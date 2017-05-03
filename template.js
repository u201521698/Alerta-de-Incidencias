var http = require("http");
var path = require('path');
var url = require('url');
var querystring = require('querystring');
var fs = require("fs");
var handlebars = require("handlebars");
var static = require('node-static');
var formidable = require('formidable');
var util = require('util');
var sqlite3 = require('better-sqlite3');
var db =new sqlite3('./test/db/db1.db')
 .on('close',function(err) {if(err)console.log(err)});
require('deasync').loopWhile(function(){return !db.open;});

var fileServer = new static.Server('./test');

var parseString = require('xml2js').parseString;


http.createServer(function (request, response) {
//	var form = new formidable.IncomingForm();
//    form.parse(request, function(err, fields, files) {
//    	console.log(util.inspect({fields: fields, files: files}));
//    });
	var body = "";
     request.addListener('data', function (data) {
		body += data||"";
	});
    request.addListener('end', function () {
        console.log(url.parse(request.url).pathname);
		if(decodeURI(url.parse(request.url).pathname).indexOf("/data/")>=0){
			r0=[]
			console.log(request.headers)
			var uname =((request.headers.cookie||"uname=*").match(/.*uname=([^;]*)/)||[null,""])[1]
			var admin =((request.headers.cookie||"admin=0").match(/.*admin=([^;]*)/)||[null,"0"])[1]

			if(request.method=="POST"){
					try {
						var commands = JSON.parse(body);
					}catch(e){
						var commands = [];
					}
					console.log(commands)
					for(var i = 0; i<commands.length;i++){					
						c= commands[i]
						switch(c.cmd) 	{
							case "addMsg":
								mobj={id:c.id}							
								r0.push(mobj)														
								try {
									var s= db.prepare("insert into message(from_user,to_user,conversationId,text) values(:uname,:dest,:conversationId,:utext) ").run({uname:c.data.uname,dest:'*',conversationId:c.data.conversationId,utext:c.data.text});
								}catch(e){
									mobj.errorMsg=e.message
									console.log(e)																		
									break
								}
								break;
							case "addConversation":
								mobj={id:c.id}							
								r0.push(mobj)														
								try {
									var s= db.prepare("insert into conversation(username,text,type,address) values(:uname,:utext,:utype,:uaddress) ").run({uname:c.data.username,utext:c.data.text,utype:c.data.type,uaddress:c.data.address});
								}catch(e){
									mobj.errorMsg=e.message
									console.log(e)																		
									break
								}
								break;
							case "addAction":
								mobj={id:c.id}							
								r0.push(mobj)														
								try {
									var s= db.prepare("insert into action(employeeId,type,state,text,username,conversationId,address) values(:employeeId,:type,:state,:text,:username,:conversationId,:address) ").run({employeeId:c.data.employeeId,type:c.data.type,state:c.data.state,text:c.data.text,username:c.data.username,conversationId:c.data.conversationId,address:c.data.address});
								}catch(e){
									mobj.errorMsg=e.message
									console.log(e)																		
									break
								}
								break;
							case "modAction":
								mobj={id:c.id}							
								r0.push(mobj)														
								try {
									var s= db.prepare("update action set employeeId=:employeeId ,text=:text ,address = :address where id = :id ").run({employeeId:c.data.employeeId,text:c.data.text,address:c.data.address,id:c.data.id});
								}catch(e){
									mobj.errorMsg=e.message
									console.log(e)																		
									break
								}
								break;
							
							default:
							break;							

						}
					}
					
			}

			var temp3 = false
			wcmd = decodeURI(url.parse(request.url).pathname).split("/data/")[1].split("/")
			switch(wcmd[0]){
				
				case "initial":
					response.writeHead(200, {"Content-Type": "application/json"});				
					var r1 = db.prepare("select m.*,strftime('%d/%m/%Y %H:%M:%S',date_time) date_time,u.name name,u.image image from message m,user u where u.username=m.from_user and( m.from_user = :uname or m.to_user ='*' or instr(','+m.to_user+',', ','+:uname+',') > 0 ) " +
                    " union all select 1000+id ,c.username from_user , '*' to_user, strftime('%d/%m/%Y %H:%M:%S',date_time) date_time,null,text,null,null,id ,strftime('%d/%m/%Y %H:%M:%S',date_time) date_time,u.name,u.image from user u,conversation c where c.username=u.username order by m.date_time").all({uname:uname})										
					
					for(var i = 0; i<r1.length;i++){					
						if (r1[i].image)r1[i].imagecode="data:image/png;base64,"+base64_encode('./test/images/'+r1[i].image.trim())
					}

					if (admin=='1'){
						var r = db.prepare("select c.*,strftime('%d/%m/%Y %H:%M:%S',c.date_time) date_time,u.name name,u.image  image from conversation c left join user u on c.username = u.username").all()
					}else{
						var r = db.prepare("select c.*,strftime('%d/%m/%Y %H:%M:%S',c.date_time) date_time,u.name name,c.type||\".png\"  image from conversation c left join user u on c.username = u.username where c.username = :uname").all({uname:uname})
					}

					for(var i = 0; i<r.length;i++){					
						if (r[i].image) r[i].imagecode="data:image/png;base64," + base64_encode('./test/images/'+r[i].image.trim())
					}
					
					response.write(JSON.stringify({data:{cmds:r0,messages:r1,conversations:r}}));

					response.end();
					break;				
				case "default":
					response.writeHead(200, {"Content-Type": "application/json"});				
					var r1 = db.prepare("select a.*,strftime('%d/%m/%Y %H:%M:%S',a.date_time) date_time,e.name employee_name,u.name user_name,a.type||\".png\" image from action a left join employee e on e.employeeid=a.employeeid left join user u on u.username = e.username").all({})
					for(var i = 0; i<r1.length;i++){					
						if(r1[i].image) r1[i].imagecode="data:image/png;base64," + base64_encode('./test/images/'+r1[i].image.trim())
					}


					if (admin=='1'){
						var r = db.prepare("select c.*,strftime('%d/%m/%Y %H:%M:%S',c.date_time) date_time,u.name name,u.image image from conversation c left join user u on c.username = u.username").all()
					}else{
						var r = db.prepare("select c.*,strftime('%d/%m/%Y %H:%M:%S',c.date_time) date_time,u.name name,u.image image from conversation c left join user u on c.username = u.username where c.username = :uname").all({uname:uname})
					}

					for(var i = 0; i<r.length;i++){					
						if (r[i].image) r[i].imagecode="data:image/png;base64," + base64_encode('./test/images/'+r[i].image.trim())
					}
					
					response.write(JSON.stringify({data:{cmds:r0,actions:r1,conversations:r}}));

					response.end();
					break;										
				case "conversations":
					response.writeHead(200, {"Content-Type": "application/json"});				
					if (admin=='1'||uname=="*"){
						var r = db.prepare("select c.*,strftime('%d/%m/%Y %H:%M:%S',c.date_time) date_time,u.name name,u.image image from conversation c left join user u on c.username = u.username").all()
					}else{
						var r = db.prepare("select c.*,strftime('%d/%m/%Y %H:%M:%S',c.date_time) date_time,u.name name,c.type||\".png\" image from conversation c left join user u on c.username = u.username where c.username = :uname").all({uname:uname})
					}

					for(var i = 0; i<r.length;i++){					
						r[i].imagecode="data:image/png;base64," + base64_encode('./test/images/'+r[i].image.trim())
					}
					response.end(JSON.stringify({data:{cmds:r0,conversations:r}}));					
					break;		
					
				case "conversation":

					if(request.method=="POST"){		
						response.writeHead(200, {"Content-Type": "application/json"});										
        				wdata =  querystring.parse(url.parse(request.url).query||body);	
						try {
							var s= db.prepare("insert into conversation(username,text,type,state,address) values(:username,:text,:type,:state,:address) ").run({username :wdata.username,text :wdata.text,type :wdata.type,state :wdata.state,address :wdata.address});
							response.end(JSON.stringify({id:s.lastInsertROWID}));
						}catch(e){
							console.log(e)
							response.end(JSON.stringify({data:{error:e.stack}}));
						}
					}
					if(request.method=="GET"){
						response.writeHead(200, {"Content-Type": "application/json"});				
						var r = db.prepare("select c.*,u.name name,u.image image from conversation c left join user u on c.username = u.username  where c.id = :id ").all({id:Number(wcmd[1])})	
						for(var i = 0; i<r.length;i++){					
							if(r[i].image) r[i].imagecode="data:image/png;base64," + base64_encode('./test/images/'+r[i].image.trim())
						}
						response.end(JSON.stringify({conversation:(r.length==0)?null:r[0]}));					
					}		
					break;	
				case "actions":
					response.writeHead(200, {"Content-Type": "application/json"});				
					var r = db.prepare("select a.*,strftime('%d/%m/%Y %H:%M:%S',a.date_time) date_time,e.name employee_name,u.name user_name,a.type||\".png\" image from action a left join employee e on e.employeeid=a.employeeid left join user u on u.username = e.username").all({})
					for(var i = 0; i<r.length;i++){					
						if(r[i].image) r[i].imagecode="data:image/png;base64," + base64_encode('./test/images/'+r[i].image.trim())
					}
					response.end(JSON.stringify({data:{cmds:r0,actions:r}}));					
					break;		
					
				case "action":

					if(request.method=="POST"){		
						response.writeHead(200, {"Content-Type": "application/json"});										
        				wdata =  querystring.parse(url.parse(request.url).query||body);	
						try {
							var s= db.prepare("insert into action(employeeId,date_time,type,state,text,username,conversationId,address) values(:employeeId,:date_time,:type,:state,:text,:username,:conversationId,:address) ").run({employeeId:wdata.employeeId,date_time:wdata.date_time,type:wdata.type,state:wdata.state,text:wdata.text,username:wdata.username,conversationId:wdata.conversationId,address:wdata.address});
							response.end(JSON.stringify({id:s.lastInsertROWID}));
						}catch(e){
							console.log(e)
							response.end(JSON.stringify({data:{error:e.stack}}));
						}
					}
					if(request.method=="GET"){
						response.writeHead(200, {"Content-Type": "application/json"});				
					
						var r = db.prepare("select a.*,e.name employee_name,u.name user_name,u.image image from action a left join user u on a.username = u.username  left join employee e on a.employeeid=e.employeeid where a.id = :id ").all({id:Number(wcmd[1])})	
						for(var i = 0; i<r.length;i++){					
							if(r[i].image) r[i].imagecode="data:image/png;base64," + base64_encode('./test/images/'+r[i].image.trim())
						}
						response.end(JSON.stringify({action:(r.length==0)?null:r[0]}));					
					}		
					break;	
					
				case "messages":
					response.writeHead(200, {"Content-Type": "application/json"});				
//					var r = db.prepare("select m.*,strftime('%d/%m/%Y %H:%M:%S',date_time) date_time,u.name name,u.image image from message m,user u where u.username=m.from_user and( m.from_user = :uname or m.to_user ='*' or instr(','+m.to_user+',', ','+:uname+',') > 0 )").all({uname:uname})										

					var r = db.prepare("select m.*,strftime('%d/%m/%Y %H:%M:%S',date_time) date_time,u.name name,u.image image from message m,user u where u.username=m.from_user and( m.from_user = :uname or m.to_user ='*' or instr(','+m.to_user+',', ','+:uname+',') > 0 ) " +
                    " union all select 1000+id ,c.username from_user , '*' to_user, strftime('%d/%m/%Y %H:%M:%S',date_time) date_time,null,text,null,null,id ,strftime('%d/%m/%Y %H:%M:%S',date_time) date_time,u.name,u.image from user u,conversation c where c.username=u.username order by m.date_time").all({uname:uname})										
					
					for(var i = 0; i<r.length;i++){					
						r[i].imagecode="data:image/png;base64," + base64_encode('./test/images/'+r[i].image.trim())
					}
					response.end(JSON.stringify({data:{cmds:r0,messages:r}}));					
					break;		
				case "message":
					if(request.method=="POST"){		
						response.writeHead(200, {"Content-Type": "application/json"});										
        				wdata =  querystring.parse(url.parse(request.url).query||body);	

						try {
							var s= db.prepare("insert into message(from_user,to_user,text,longitude,latitude,conversationId) values(:from_user,:to_user,:text,:longitude,:latitude,:conversationid) ").run({from_user :wdata.from_user,to_user :wdata.to_user,text :wdata.text,longitude :wdata.longitude,latitude :wdata.latitude,conversationid:wdata.conversationid});
							response.end(JSON.stringify({id:s.lastInsertROWID}));
						}catch(e){
							console.log(e)
							response.end(JSON.stringify({data:{error:e.stack}}));
						}
					}
					if(request.method=="GET"){
						response.writeHead(200, {"Content-Type": "application/json"});				
						var r = db.prepare("select m.*,u.name name,u.image image from message m,user u where u.username=m.from_user and m.id = :id ").all({id:Number(wcmd[1])})										
						for(var i = 0; i<r.length;i++){					
							r[i].imagecode="data:image/png;base64," + base64_encode('./test/images/'+r[i].image.trim())
						}
						response.end(JSON.stringify({message:(r.length==0)?null:r[0]}));					
					}		
					break;	
																		
				case "item":
					response.writeHead(200, {"Content-Type": "application/json"});								
					var completeResponseRss = '';
					var gsaReq = http.get("http://peru21.pe/feed/actualidad", function (responseRss) {
						responseRss.on('data', function (chunk) {
							completeResponseRss += chunk;
        				});
        				responseRss.on('end', function() {
							var r = parseString(completeResponseRss,{trim: true}, function (err, result) {
								if(!err){ 
									var r=[];
									try {
										var r1 = result.rss.channel[0].item;
									}catch(e){
										var r1 =[]
									}

									r1.forEach(function(n,i,ar){                            
										r.push({id:i,title:n.title[0],description:n.description[0],date_time:''});
									})

									response.end(JSON.stringify({data:{cmds:r0,item:r}}));					
								}else{
									response.end(JSON.stringify({data:{cmds:r0}}));					
								}
							}); 

        				})
    				}).on('error', function (e) {
        				console.log('problem with request: ' + e.message);
    				});

					//response.write(a2xml('data',[{consumo : r,cmds :r0}]	))
					break;					
					
				default:
					response.write(JSON.stringify({data:{cmds:r0}}));
					response.end();					
					break;					

			} 

		}else{
        	fileServer.serve(request, response,function (err, result) {
            	if (err) { 
                	console.error("Error serving " + request.url + " - " + err.message);
					response.writeHead(err.status, err.headers);
                	response.write('<a href="http://'+request.headers.host+'/client/smain.html" target="_self">M&oacute;dulo Cliente</a><br>');					
                	response.write('<a href="http://'+request.headers.host+'/admin/index.html" target="_self" >M&oacute;dulo Administraci&oacute;n</a><br>');										
                	response.write('<a href="http://'+request.headers.host+'/data/messages" target="_self" >Datos Rest</a><br>');					
                	response.end();
            	}

			});
		}
    }).resume();
}).listen(9090);
function a2xml(name,r){
	var s = ""

	for(var i = 0; i<r.length;i++){
		s += `<${name} `
		var s2 = ""
		for(a in r[i]){
			if(Array.isArray(r[i][a])) {
				s2+=a2xml(a,r[i][a])
			}else if(r[i][a]!==null){
				 s+=` ${a}="${encodeXml(r[i][a].toString())}"`
			}

		}
		s += ` >`
		s += s2
		s += `</${name}>`
	} 	
//	console.log(name)
	return (s);

}

function encodeXml(s) {
    return s.replace(/([\&"<>])/g, function(str, item) {
        return {'&': '&amp;', '"': '&quot;','<': '&lt;','>': '&gt;'}[item];
    });
};


function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}